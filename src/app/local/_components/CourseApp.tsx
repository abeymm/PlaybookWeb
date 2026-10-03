"use client";

// CourseApp — the per-course flow for one key: status polling, generate/export jobs, scorecard
// attach, the map/editor (LocalCourseView), save. Everything that used to be lifted into
// LocalApp/page.tsx for the selected course now lives here, keyed off the URL's `courseKey`
// instead of a picker's in-memory selection.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import RunPanel from "./RunPanel";
import LocalCourseView from "./LocalCourseView";
import ScorecardPanel from "./ScorecardPanel";
import { ErrorState, LoadingState } from "@/app/admin/_components/states";
import type { CohortEntry, StatusResponse } from "@/lib/localflow/types";
import type { OSMCourse, ValidationFinding } from "@/lib/coursedata/types";

const POLL_MS = 2000;

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `${res.status} ${res.statusText}`);
  return body as T;
}

function formatBytes(n: number | undefined): string {
  if (n == null) return "";
  return n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.round(n / 1000)} KB`;
}

export interface CourseAppProps {
  /** Already shape-validated by the server wrapper (page.tsx) — still just a string here. */
  courseKey: string;
}

export default function CourseApp({ courseKey }: CourseAppProps) {
  // Cohort record (name/state/holeCount) for the header and panel defaults, before generation.
  const [entry, setEntry] = useState<CohortEntry | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [course, setCourse] = useState<OSMCourse | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFindings, setSaveFindings] = useState<ValidationFinding[] | null>(null);
  const loadedMtime = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const body = await getJson<{ items: CohortEntry[] }>(
          `/local/api/search?q=${encodeURIComponent(courseKey)}`
        );
        const match = body.items.find((it) => it.courseKey === courseKey) ?? null;
        if (cancelled) return;
        setEntry(match);
        setEntryError(match ? null : `'${courseKey}' isn't in the local cohort`);
      } catch (e) {
        if (!cancelled) setEntryError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseKey]);

  const refresh = useCallback(async () => {
    try {
      const s = await getJson<StatusResponse>(`/local/api/status/${encodeURIComponent(courseKey)}`);
      setStatus(s);
      setFatal(null);
    } catch (e) {
      setFatal(e instanceof Error ? e.message : String(e));
    }
  }, [courseKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Poll while either job runs.
  const running =
    status?.jobs.generate.job?.status === "running" || status?.jobs.export.job?.status === "running";
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [running, refresh]);

  // Load (or reload) the generated course when the file appears or changes — unless there are
  // unsaved edits, which must not be clobbered by a re-run finishing underneath them.
  useEffect(() => {
    const gen = status?.generated;
    if (!gen?.exists || !gen.mtime || gen.mtime === loadedMtime.current || dirty) return;
    (async () => {
      try {
        const data = await getJson<OSMCourse[]>(`/local/api/course/${encodeURIComponent(courseKey)}`);
        setCourse(data[0] ?? null);
        loadedMtime.current = gen.mtime ?? null;
      } catch (e) {
        setFatal(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [courseKey, status?.generated, dirty]);

  const startGenerate = async () => {
    try {
      await getJson(`/local/api/generate/${encodeURIComponent(courseKey)}`, { method: "POST" });
    } catch (e) {
      setFatal(e instanceof Error ? e.message : String(e));
    }
    void refresh();
  };

  const startExport = async () => {
    try {
      await getJson(`/local/api/export/${encodeURIComponent(courseKey)}`, { method: "POST" });
    } catch (e) {
      setFatal(e instanceof Error ? e.message : String(e));
    }
    void refresh();
  };

  const save = async () => {
    if (!course) return;
    setSaving(true);
    try {
      const res = await fetch(`/local/api/course/${encodeURIComponent(courseKey)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify([course]),
      });
      const body = (await res.json()) as { ok?: boolean; findings?: ValidationFinding[]; error?: string };
      setSaveFindings(body.findings ?? null);
      if (res.ok && body.ok) {
        setDirty(false);
        // The file's mtime moved; make the next status load pick it up without a reload loop.
        loadedMtime.current = null;
        void refresh();
      } else if (body.error) {
        setFatal(body.error);
      }
    } catch (e) {
      setFatal(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const gen = status?.generated;
  const canExport = !!gen?.exists && !dirty;
  const displayName = course?.name ?? entry?.name ?? courseKey;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-3">
        <Link href="/local" className="text-xs text-muted-foreground underline hover:text-foreground">
          ← all courses
        </Link>
        <div>
          <div className="text-sm font-semibold">{displayName}</div>
          <div className="font-mono text-xs text-muted-foreground">
            {courseKey}
            {entry?.state ? ` · ${entry.state}` : ""}
          </div>
        </div>
      </div>

      {entryError && !status && (
        <div className="px-6 py-3">
          <ErrorState error={new Error(entryError)} />
        </div>
      )}
      {fatal && (
        <div className="px-6 py-3">
          <ErrorState
            error={new Error(fatal)}
            onRetry={() => {
              setFatal(null);
              void refresh();
            }}
          />
        </div>
      )}
      {!status && !fatal && <LoadingState label="Loading course status…" />}

      {status && (
        <>
          <RunPanel
            title={`Generate — ${displayName}`}
            hint={`generate_course.py --course-key ${courseKey} (local backend; US → GolfAPI, else OSM) → ${status.paths.courseJson}`}
            view={status.jobs.generate}
            actionLabel={gen?.exists ? "Regenerate" : "Generate"}
            actionDisabled={!status.cache.exists}
            onAction={startGenerate}
          >
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>
                cache input: {status.cache.exists ? `present (${formatBytes(status.cache.size)})` : "MISSING"}
              </span>
              <span>
                input source: {status.input.exists ? "scorecard-merged copy" : "OSM cache file"}
              </span>
              <span>
                generated:{" "}
                {gen?.exists
                  ? `${formatBytes(gen.size)} · ${gen.mtime ? new Date(gen.mtime).toLocaleString() : ""}`
                  : "not yet"}
              </span>
              <span>report: {status.report.exists ? "present" : "—"}</span>
            </div>
          </RunPanel>

          <ScorecardPanel
            courseKey={courseKey}
            courseName={displayName}
            center={status.center}
            attached={status.scorecard}
            blocked={dirty}
            generatedExists={!!gen?.exists}
            holeCount={course?.holes.length ?? entry?.holeCount ?? 0}
            onApplied={() => {
              // Both files may have changed on disk; drop the loaded mtime so the course reloads.
              loadedMtime.current = null;
              void refresh();
            }}
          />

          {course && (
            <LocalCourseView
              course={course}
              dirty={dirty}
              saving={saving}
              saveFindings={saveFindings}
              onChange={(next) => {
                setCourse(next);
                setDirty(true);
              }}
              onSave={save}
            />
          )}

          <RunPanel
            title="Export .playbook"
            hint={`iOS PlaybookArchiveExportTool (the app's own import + export code) → ${status.paths.playbookDir}`}
            view={status.jobs.export}
            actionLabel="Export archive"
            actionDisabled={!canExport}
            onAction={startExport}
          >
            {dirty && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                Save your edits first — the export reads the file on disk.
              </div>
            )}
            {status.playbooks.length > 0 && (
              <ul className="flex flex-wrap gap-3 text-xs">
                {status.playbooks.map((p) => (
                  <li key={p.name}>
                    <a
                      className="underline"
                      href={`/local/api/export/${encodeURIComponent(courseKey)}/file?name=${encodeURIComponent(p.name)}`}
                    >
                      {p.name}
                    </a>{" "}
                    <span className="text-muted-foreground">
                      {formatBytes(p.size)} · {new Date(p.mtime).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </RunPanel>
        </>
      )}
    </div>
  );
}
