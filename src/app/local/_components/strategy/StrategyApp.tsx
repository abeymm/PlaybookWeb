"use client";

// StrategyApp — review and edit one print run's strategy plan: holes | map | shots. Edits live in local
// state (target drags, text, add/delete layup); Save PUTs the full notes and the server re-derives the plan
// (core/strategy_edit.py). "Rebuild book" then starts a build from the saved plan reusing the run's inputs.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Chip } from "@/app/admin/_components/ui";
import StrategyMap from "./StrategyMap";
import HoleList from "./HoleList";
import ShotPanel from "./ShotPanel";
import { centerlineFC, holeBbox, holeByNumber, holeFeatureGeos, toPolygonFC } from "@/app/admin/courses/[osmId]/_components/mapdata";
import type { OSMCourse } from "@/lib/coursedata/types";
import {
  addLayup, chainOrder, deleteLayup, diffNotes, groupByHole, moveTarget, rechain, setText,
  type ArchiveNote, type LatLng, type StrategyPayload,
} from "@/lib/localflow/strategy";

interface ApiError extends Error { body?: { error?: string; holes?: number[]; log?: string } }

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error((body as { error?: string }).error ?? `${res.status} ${res.statusText}`) as ApiError;
    e.body = body as ApiError["body"];
    throw e;
  }
  return body as T;
}

export default function StrategyApp({ courseKey, runId }: { courseKey: string; runId: string }) {
  const base = `/local/api/book/${encodeURIComponent(courseKey)}/runs/${encodeURIComponent(runId)}/strategy`;
  const [payload, setPayload] = useState<StrategyPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notes, setNotes] = useState<ArchiveNote[]>([]);
  const [course, setCourse] = useState<OSMCourse | null>(null);
  const [hole, setHole] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rebuildMsg, setRebuildMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const adopt = useCallback((p: StrategyPayload) => {
    setPayload(p);
    setNotes(p.archive.notes);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getJson<StrategyPayload>(base);
        if (cancelled) return;
        adopt(p);
        setHole(groupByHole(p.archive.notes).keys().next().value ?? 1);
        setLoadError(null);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      }
      try {
        const data = await getJson<OSMCourse[]>(`/local/api/course/${encodeURIComponent(courseKey)}`);
        if (!cancelled) setCourse(Array.isArray(data) ? data[0] ?? null : null);
      } catch {
        /* the map still shows the shot chain without course polygons */
      }
    })();
    return () => { cancelled = true; };
  }, [base, courseKey, adopt]);

  const groups = useMemo(() => groupByHole(notes), [notes]);
  const chain = useMemo(() => rechain(chainOrder(groups.get(hole) ?? [])), [groups, hole]);
  const osmHole = useMemo(() => (course ? holeByNumber(course, hole) : undefined), [course, hole]);
  const polygonFC = useMemo(() => (course ? toPolygonFC(holeFeatureGeos(course, osmHole)) : { type: "FeatureCollection" as const, features: [] }), [course, osmHole]);
  const clFC = useMemo(() => centerlineFC(osmHole), [osmHole]);
  const bbox = useMemo(() => (course ? holeBbox(holeFeatureGeos(course, osmHole), clFC) : null), [course, osmHole, clFC]);

  if (loadError) {
    return (
      <div className="m-6 max-w-xl rounded-md border border-border p-4 text-sm">
        <div className="mb-1 font-medium">No such run, or it has no strategy plan</div>
        <div className="text-muted-foreground">{loadError}</div>
        <Link className="mt-3 inline-block underline" href={`/local/course/${encodeURIComponent(courseKey)}`}>Back to the course</Link>
      </div>
    );
  }
  if (!payload) return <div className="m-6 text-sm text-muted-foreground">loading strategy…</div>;

  const diff = diffNotes(payload.archive.notes, notes);
  const flagCounts = payload.review?.summary?.flag_counts ?? {};
  const flagTotal = Object.values(flagCounts).reduce((a, b) => a + b, 0);
  const reviewHole = payload.review?.holes.find((h) => h.hole === hole);

  const onDrag = (id: string, to: LatLng) => setNotes((ns) => moveTarget(ns, id, to));
  const onAdd = () => {
    const next = addLayup(notes, hole, crypto.randomUUID(), Date.now());
    if (!next) { setNotice(`Hole ${hole}: can't add a layup — it needs a tee target and a green note.`); return; }
    setNotice(null);
    setNotes(next);
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    setRebuildMsg(null);
    try {
      adopt(await getJson<StrategyPayload>(base, {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ baseArchiveId: payload.archiveId, notes }),
      }));
    } catch (e) {
      const err = e as ApiError;
      const holes = err.body?.holes?.length ? ` (holes ${err.body.holes.join(", ")})` : "";
      setSaveError(`${err.message}${holes}${err.body?.log ? `\n${err.body.log}` : ""}`);
    } finally {
      setSaving(false);
    }
  };

  const rebuild = async () => {
    setRebuildMsg(null);
    try {
      await getJson(`/local/api/book/${encodeURIComponent(courseKey)}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          variant: "strategy", edition: payload.runMeta.edition ?? "2027", handicap: payload.runMeta.handicap ?? "low",
          primaryTee: payload.primaryTee ?? "auto", golfapiCourseId: payload.runMeta.golfapiCourseId ?? "",
          playbook: payload.archivePath, inputsDir: payload.inputsDir,
        }),
      });
      setRebuildMsg("build started — watch it in the course's Print book panel");
    } catch (e) {
      setRebuildMsg(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2 text-xs">
        <Link className="underline" href={`/local/course/${encodeURIComponent(courseKey)}`}>← {courseKey}</Link>
        <span className="font-mono">{runId}</span>
        <span>archive <span className="font-mono">{payload.archiveId}</span></span>
        <Chip className={payload.source === "edited" ? "border-amber-300 text-amber-700 dark:text-amber-300" : ""}>{payload.source}</Chip>
        <span>{flagTotal} flags{Object.keys(flagCounts).length ? ` (${Object.entries(flagCounts).map(([k, v]) => `${k} ${v}`).join(", ")})` : ""}</span>
        <span className={diff.count ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>Unsaved edits: {diff.count}</span>
        <Button size="sm" onClick={save} disabled={saving || diff.count === 0}>{saving ? "Saving…" : "Save"}</Button>
        {payload.source === "edited" && diff.count === 0 && <Button size="sm" variant="outline" onClick={rebuild}>Rebuild book with this plan</Button>}
        {rebuildMsg && <span className="text-muted-foreground">{rebuildMsg}</span>}
      </div>
      {notice && <div className="border-b border-amber-300 px-3 py-1 text-xs text-amber-700 dark:text-amber-300">{notice}</div>}
      {saveError && <pre className="whitespace-pre-wrap border-b border-red-300 px-3 py-1 text-xs text-destructive">{saveError}</pre>}
      <div className="grid min-h-0 flex-1 grid-cols-[14rem_1fr_24rem]">
        <div className="overflow-auto border-r border-border p-2">
          <HoleList rows={[...groups].map(([h, list]) => ({ hole: h, shots: list.length }))} review={payload.review} selected={hole} onSelect={setHole} />
        </div>
        <div className="min-h-0">
          <StrategyMap hole={hole} polygonFC={polygonFC} centerlineFC={clFC} bbox={bbox} chain={chain} onTargetDrag={onDrag} />
        </div>
        <div className="overflow-auto border-l border-border p-2">
          <ShotPanel
            hole={hole} chain={chain} reviewHole={reviewHole} changes={payload.changes}
            onText={(id, text) => setNotes((ns) => setText(ns, id, text))}
            onAddLayup={onAdd}
            onDeleteLayup={(id) => setNotes((ns) => deleteLayup(ns, id))}
          />
        </div>
      </div>
    </div>
  );
}
