"use client";

// SeedEditor — the click-to-seed screen: name/slug, a full-height NAIP map, a hole rail, the
// capture flow (click tee → waypoints → finish=green → auto-advance), validation, and Save.
//
// The map is loaded via next/dynamic (ssr:false) — MapLibre touches `window`.

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  CornerUpLeftIcon,
  FlagIcon,
  MapPinIcon,
  SaveIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import HoleRail from "./HoleRail";
import type { MapFocus } from "./SeedMap";
import { bboxOfLngLats, coordsToRing } from "@/lib/coursedata/geo";
import type { Coordinate, ValidationFinding } from "@/lib/coursedata/types";
import {
  slugify,
  validateDraft,
  isSaveable,
  buildSeedJson,
  parseGoToInput,
  type SeedDraft,
  type SeedHole,
  type SeedSaveResult,
} from "@/lib/coursedata/seed";
import { saveCourseSeed, storageBucket } from "@/lib/coursedata/api";
import NextSteps from "./NextSteps";

const SeedMap = dynamic(() => import("./SeedMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-black text-sm text-white/60">
      Loading map…
    </div>
  ),
});

function emptyHole(holeNumber: number): SeedHole {
  return { holeNumber, points: [] };
}

export interface SeedEditorProps {
  initial: SeedDraft;
  /** Storage key if this seed was already saved (slug becomes immutable). */
  savedKey: string | null;
  onBack: () => void;
}

export default function SeedEditor({ initial, savedKey: initialKey, onBack }: SeedEditorProps) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugEdited, setSlugEdited] = useState(false);
  const [holes, setHoles] = useState<SeedHole[]>(
    initial.holes.length > 0 ? initial.holes : [emptyHole(1)]
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [savedKey, setSavedKey] = useState<string | null>(initialKey);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [goTo, setGoTo] = useState("");
  const [goToError, setGoToError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SeedSaveResult | null>(null);

  const slugLocked = savedKey !== null;
  const nonceRef = useRef(0);
  const nextFocus = useCallback((f: Omit<MapFocus, "nonce">) => {
    nonceRef.current += 1;
    setFocus({ ...f, nonce: nonceRef.current });
  }, []);

  // Auto-derive slug from name until the user overrides it or the seed is saved (slug immutable).
  useEffect(() => {
    if (!slugLocked && !slugEdited) setSlug(slugify(name));
  }, [name, slugLocked, slugEdited]);

  const draft: SeedDraft = useMemo(() => ({ name, slug, holes }), [name, slug, holes]);
  const findings = useMemo(() => validateDraft(draft), [draft]);
  const saveable = useMemo(() => isSaveable(draft), [draft]);
  const activeHole = holes[activeIdx];

  // Latest holes for handlers that must read + branch atomically (e.g. the double-click finish,
  // which can otherwise fire with an invalid point count).
  const holesRef = useRef(holes);
  holesRef.current = holes;

  // -- capture handlers --
  const handleMapClick = useCallback(
    (coord: Coordinate) => {
      setHoles((prev) => {
        if (activeIdx >= prev.length) return prev;
        const next = prev.slice();
        const h = next[activeIdx];
        next[activeIdx] = { ...h, points: [...h.points, coord] };
        return next;
      });
    },
    [activeIdx]
  );

  const handleFinishHole = useCallback(() => {
    // Guard against an invalid finish (e.g. a stray double-click with <2 points) before advancing.
    const cur = holesRef.current[activeIdx];
    if (!cur || cur.points.length < 2) return;
    setHoles((prev) => {
      // Only append a fresh hole when finishing the last one; otherwise just advance.
      if (activeIdx + 1 < prev.length) return prev;
      const number = prev.reduce((m, h) => Math.max(m, h.holeNumber), 0) + 1;
      return [...prev, emptyHole(number)]; // 36+ clicks, no menu friction
    });
    setActiveIdx(activeIdx + 1);
  }, [activeIdx]);

  const handleUndo = useCallback(() => {
    setHoles((prev) => {
      if (activeIdx >= prev.length || prev[activeIdx].points.length === 0) return prev;
      const next = prev.slice();
      const h = next[activeIdx];
      next[activeIdx] = { ...h, points: h.points.slice(0, -1) };
      return next;
    });
  }, [activeIdx]);

  const handlePointDrag = useCallback((hi: number, pi: number, coord: Coordinate) => {
    setHoles((prev) => {
      const next = prev.slice();
      const pts = next[hi].points.slice();
      pts[pi] = coord;
      next[hi] = { ...next[hi], points: pts };
      return next;
    });
  }, []);

  const handlePointDelete = useCallback((hi: number, pi: number) => {
    setHoles((prev) => {
      const next = prev.slice();
      next[hi] = { ...next[hi], points: next[hi].points.filter((_, k) => k !== pi) };
      return next;
    });
  }, []);

  const handleAddHole = useCallback(() => {
    setHoles((prev) => [...prev, emptyHole(prev.reduce((m, h) => Math.max(m, h.holeNumber), 0) + 1)]);
    setActiveIdx(holes.length);
  }, [holes.length]);

  const handleDeleteHole = useCallback(
    (i: number) => {
      setHoles((prev) => {
        if (prev.length <= 1) return [emptyHole(1)]; // keep at least one empty hole
        return prev.filter((_, k) => k !== i);
      });
      setActiveIdx((cur) => (cur >= i && cur > 0 ? cur - 1 : cur));
    },
    []
  );

  const handleSetPar = useCallback((i: number, par: number | undefined) => {
    setHoles((prev) => {
      const next = prev.slice();
      next[i] = { ...next[i], par };
      return next;
    });
  }, []);

  const handleSelectHole = useCallback(
    (i: number) => {
      setActiveIdx(i);
      const bbox = bboxOfLngLats(coordsToRing(holes[i]?.points ?? []));
      if (bbox) nextFocus({ bbox });
    },
    [holes, nextFocus]
  );

  const handleGoTo = useCallback(() => {
    const parsed = parseGoToInput(goTo);
    if (!parsed) {
      setGoToError(true);
      return;
    }
    setGoToError(false);
    nextFocus({ fly: parsed });
  }, [goTo, nextFocus]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      const seed = buildSeedJson({ name, slug, holes });
      const res = await saveCourseSeed(seed);
      setSaveResult(res);
      if (res.ok && res.key) setSavedKey(res.key); // lock the slug on first success
    } catch (e) {
      setSaveResult({ ok: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  }, [name, slug, holes]);

  const errorFindings = findings.filter((f) => f.level === "error");
  const warningFindings = findings.filter((f) => f.level === "warning");

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar: back, name/slug, go-to, save */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
        <Button size="sm" variant="ghost" onClick={onBack} className="gap-1.5">
          <ArrowLeftIcon className="h-4 w-4" />
          Seeds
        </Button>
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Course name"
            className="h-8 w-56"
            aria-label="Course name"
          />
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">manual/</span>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugEdited(true);
              }}
              disabled={slugLocked}
              placeholder="slug"
              className="h-8 w-44 font-mono text-xs"
              aria-label="Slug"
              title={slugLocked ? "Slug is locked after the first save" : "Editable until first save"}
            />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Input
              value={goTo}
              onChange={(e) => {
                setGoTo(e.target.value);
                setGoToError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGoTo();
              }}
              placeholder="lat, lng"
              aria-label="Go to coordinates"
              className={cn("h-8 w-40 font-mono text-xs", goToError && "border-destructive")}
            />
            <Button size="sm" variant="outline" onClick={handleGoTo} className="h-8 gap-1 px-2">
              <MapPinIcon className="h-3.5 w-3.5" />
              Go
            </Button>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!saveable || saving}
            className="gap-1.5"
            title={saveable ? undefined : "Every hole needs at least 2 points"}
          >
            <SaveIcon className="h-4 w-4" />
            {saving ? "Saving…" : savedKey ? "Save (overwrite)" : "Save seed"}
          </Button>
        </div>
      </div>

      {/* Capture toolbar */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-1.5 text-xs">
        <span className="text-muted-foreground">
          {activeHole
            ? `Active: Hole ${activeHole.holeNumber} — ${
                activeHole.points.length === 0
                  ? "click the LONGEST (back) tee"
                  : activeHole.points.length === 1
                    ? "click waypoints, then Finish for the green"
                    : "add waypoints or Finish (last point = green)"
              }`
            : "Add a hole to start"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleUndo}
            disabled={!activeHole || activeHole.points.length === 0}
            className="h-7 gap-1 px-2"
          >
            <CornerUpLeftIcon className="h-3.5 w-3.5" />
            Undo click
          </Button>
          <Button
            size="sm"
            onClick={handleFinishHole}
            disabled={!activeHole || activeHole.points.length < 2}
            className="h-7 gap-1 px-2"
          >
            <FlagIcon className="h-3.5 w-3.5" />
            Finish hole
          </Button>
        </div>
      </div>

      {/* Body: rail + map */}
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
          <HoleRail
            holes={holes}
            activeIdx={activeIdx}
            onSelect={handleSelectHole}
            onAddHole={handleAddHole}
            onDeleteHole={handleDeleteHole}
            onSetPar={handleSetPar}
          />
          {(errorFindings.length > 0 || warningFindings.length > 0) && (
            <div className="max-h-52 shrink-0 overflow-auto border-t border-border p-2 text-xs">
              {errorFindings.map((f, i) => (
                <FindingRow key={`e${i}`} f={f} />
              ))}
              {warningFindings.map((f, i) => (
                <FindingRow key={`w${i}`} f={f} />
              ))}
            </div>
          )}
        </aside>
        <div className="relative min-w-0 flex-1">
          <SeedMap
            holes={holes}
            activeIdx={activeIdx}
            focus={focus}
            onMapClick={handleMapClick}
            onFinishHole={handleFinishHole}
            onPointDrag={handlePointDrag}
            onPointDelete={handlePointDelete}
          />
        </div>
      </div>

      {saveResult && (
        <NextSteps
          result={saveResult}
          slug={slug}
          bucket={storageBucket()}
          onDismiss={() => setSaveResult(null)}
        />
      )}
    </div>
  );
}

function FindingRow({ f }: { f: ValidationFinding }) {
  const err = f.level === "error";
  return (
    <div className="flex items-start gap-1.5 py-0.5">
      <span
        className={cn(
          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
          err ? "bg-destructive" : "bg-amber-500"
        )}
      />
      <span className={cn(err ? "text-destructive" : "text-amber-600 dark:text-amber-400")}>
        {f.msg}
      </span>
    </div>
  );
}
