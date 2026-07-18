"use client";

// CourseDetail — the core review/edit screen. Layout (Design DT4): QC summary strip on top,
// map as the dominant flex-1 canvas, docked right panel with tabs. Non-card layout (viewer.html
// precedent). Desktop-only.

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Undo2Icon,
  Redo2Icon,
  SaveIcon,
  PencilIcon,
  PlusIcon,
  EyeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Chip, Tabs } from "../../../_components/ui";
import { LoadingState, ErrorState } from "../../../_components/states";
import { Dialog } from "../../../_components/ui";
import {
  FeaturePropsPanel,
  InfoPanel,
  QcPanel,
  VersionsPanel,
  PublishPanel,
} from "./Panels";
import {
  holeByNumber,
  holeFeatureGeos,
  toPolygonFC,
  centerlineFC,
  boundaryFC,
  holeBbox,
  classCountDelta,
} from "./mapdata";
import {
  downloadMlgen,
  downloadLegacy,
  downloadReport,
  listCourseDataVersions,
  getCourse,
  updateCourseIndex,
  uploadStaging,
  saveCourseData,
  restoreCourseDataVersion,
  courseKeyFor,
} from "@/lib/coursedata/api";
import { validateCourseData, splitFindings } from "@/lib/coursedata/validator";
import { shouldBlockSave, classifyVerdict } from "@/lib/coursedata/saveFlow";
import { ALL_CLASSES, ACTIVE_CLASSES } from "@/lib/coursedata/featureTags";
import { classSwatch } from "@/lib/coursedata/colors";
import {
  changeFeatureClass,
  assignFeatureToHole,
  unassignFeatureFromHole,
  deleteFeature,
  updateFeatureGeometry,
  addFeature,
} from "@/lib/coursedata/edit";
import { saveDraft, loadDraft, clearDraft, isDraftStale, debounce } from "@/lib/coursedata/autosave";
import type {
  OSMCourse,
  OSMHole,
  FeatureClass,
  ValidationFinding,
  CourseDataVersion,
  QcReport,
  CourseIndexRow,
  ReviewStatus,
  SaveVerdict,
} from "@/lib/coursedata/types";

const CourseMap = dynamic(() => import("./CourseMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-black text-sm text-white/60">Loading map…</div>,
});

type TabId = "feature" | "info" | "qc" | "versions" | "publish";

export default function CourseDetail({ osmId }: { osmId: string }) {
  const courseKey = courseKeyFor(osmId);

  // Loaded data
  const [course, setCourse] = useState<OSMCourse | null>(null);
  const [legacyCourse, setLegacyCourse] = useState<OSMCourse | null>(null);
  const [row, setRow] = useState<CourseIndexRow | null>(null);
  const [report, setReport] = useState<QcReport | null>(null);
  const [versions, setVersions] = useState<CourseDataVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [baseEtag, setBaseEtag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);

  // Edit state
  const pastRef = useRef<OSMCourse[]>([]);
  const futureRef = useRef<OSMCourse[]>([]);
  const [, forceStacks] = useState(0);
  const [dirty, setDirty] = useState(false);

  // View state
  const [holeIndex, setHoleIndex] = useState(0);
  const [rendition, setRendition] = useState<"mlgen" | "legacy">("mlgen");
  const [diff, setDiff] = useState(false);
  const [basemap, setBasemap] = useState<"naip" | "osm">("naip");
  const [naipFailed, setNaipFailed] = useState(false);
  const [visibleClasses, setVisibleClasses] = useState<Set<FeatureClass>>(new Set(ALL_CLASSES));
  const [selectedFid, setSelectedFid] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"view" | "edit" | "draw">("view");
  const [drawClass, setDrawClass] = useState<FeatureClass>("bunker");
  const [tab, setTab] = useState<TabId>("qc");

  // Save/preflight
  const [preflight, setPreflight] = useState<ValidationFinding[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveVerdict, setSaveVerdict] = useState<SaveVerdict | null>(null);
  const [conflict, setConflict] = useState<SaveVerdict | null>(null);
  const [note, setNote] = useState("");

  // Draft restore
  const [draftPrompt, setDraftPrompt] = useState<OSMCourse | null>(null);
  const [regenBanner, setRegenBanner] = useState(false);

  // ---- load ----
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const [mlgen, versionsRes, indexRow, rep] = await Promise.all([
          downloadMlgen(courseKey),
          listCourseDataVersions(courseKey).catch(() => [] as CourseDataVersion[]),
          getCourse(osmId).catch(() => null),
          downloadReport(courseKey).catch(() => null),
        ]);
        if (cancelled) return;
        const c = mlgen[0] ?? null;
        setCourse(c);
        setRow(indexRow);
        setReport(rep);
        setNote(indexRow?.reviewNote ?? "");
        setVersions(versionsRes);
        setVersionsLoading(false);
        const latest = versionsRes.find((v) => v.isLatest) ?? versionsRes[0];
        const etag = latest?.etag ?? null;
        setBaseEtag(etag);

        // Draft restore-on-open + stale-vs-regenerated (R9).
        const draft = loadDraft(courseKey);
        if (draft) {
          if (isDraftStale(draft, etag)) setRegenBanner(true);
          else if (c && JSON.stringify(draft.course) !== JSON.stringify(c)) setDraftPrompt(draft.course);
        }

        // Legacy rendition (optional — mlgen-only courses 404 here).
        downloadLegacy(courseKey)
          .then((lg) => !cancelled && setLegacyCourse(lg[0] ?? null))
          .catch(() => !cancelled && setLegacyCourse(null));
      } catch (e) {
        if (!cancelled) setLoadError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseKey, osmId]);

  // ---- edit apply (with undo/redo) ----
  const applyEdit = useCallback(
    (next: OSMCourse) => {
      setCourse((cur) => {
        if (cur) pastRef.current.push(cur);
        futureRef.current = [];
        return next;
      });
      setDirty(true);
      forceStacks((n) => n + 1);
    },
    []
  );
  const undo = useCallback(() => {
    setCourse((cur) => {
      const prev = pastRef.current.pop();
      if (!prev || !cur) return cur;
      futureRef.current.push(cur);
      return prev;
    });
    forceStacks((n) => n + 1);
  }, []);
  const redo = useCallback(() => {
    setCourse((cur) => {
      const nxt = futureRef.current.pop();
      if (!nxt || !cur) return cur;
      pastRef.current.push(cur);
      return nxt;
    });
    forceStacks((n) => n + 1);
  }, []);

  // ---- autosave draft (debounced) + beforeunload guard ----
  const autosave = useMemo(
    () =>
      debounce((c: OSMCourse, etag: string | null) => saveDraft(courseKey, c, etag), 800),
    [courseKey]
  );
  useEffect(() => {
    if (dirty && course) autosave(course, baseEtag);
  }, [course, dirty, baseEtag, autosave]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const hole: OSMHole | undefined = course?.holes[holeIndex];

  // ---- hole navigation via ←/→ (ignore while typing) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") setHoleIndex((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setHoleIndex((i) => Math.min((course?.holes.length ?? 1) - 1, i + 1));
      else if (e.key === "Escape") {
        setSelectedFid(null);
        setEditMode("view");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [course]);

  // ---- map data ----
  const mlgenGeos = useMemo(() => (course ? holeFeatureGeos(course, hole) : []), [course, hole]);
  const legacyGeos = useMemo(
    () => (legacyCourse ? holeFeatureGeos(legacyCourse, holeByNumber(legacyCourse, hole?.holeNumber ?? -1)) : []),
    [legacyCourse, hole]
  );
  const mlgenFC = useMemo(() => toPolygonFC(mlgenGeos), [mlgenGeos]);
  const legacyFC = useMemo(() => toPolygonFC(legacyGeos), [legacyGeos]);
  const clFC = useMemo(() => centerlineFC(hole), [hole]);
  const bFC = useMemo(() => (course ? boundaryFC(course) : { type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection), [course]);
  const bbox = useMemo(() => holeBbox(mlgenGeos, clFC), [mlgenGeos, clFC]);
  const countDelta = useMemo(() => classCountDelta(mlgenGeos, legacyGeos), [mlgenGeos, legacyGeos]);

  const selectedFeature = useMemo(
    () => course?.features.find((f) => f.osmId === selectedFid) ?? null,
    [course, selectedFid]
  );

  // ---- edit callbacks ----
  const onChangeClass = (fid: string, cls: FeatureClass) => course && applyEdit(changeFeatureClass(course, fid, cls));
  const onAssign = (fid: string, h: number) => course && applyEdit(assignFeatureToHole(course, fid, h));
  const onUnassign = (fid: string, h: number) => course && applyEdit(unassignFeatureFromHole(course, fid, h));
  const onDelete = (fid: string) => {
    if (!course) return;
    applyEdit(deleteFeature(course, fid));
    setSelectedFid(null);
    setEditMode("view");
  };
  const onGeometryChange = (fid: string, coords: { lat: number; lng: number }[]) =>
    course && applyEdit(updateFeatureGeometry(course, fid, coords));
  const onDrawComplete = (coords: { lat: number; lng: number }[]) => {
    if (!course) return;
    const { course: next } = addFeature(course, drawClass, coords, hole?.holeNumber);
    applyEdit(next);
    setEditMode("view");
  };
  const onCourseField = (field: keyof OSMCourse, value: string | number) => {
    if (!course) return;
    applyEdit({ ...course, [field]: value });
  };
  const onHoleField = (holeNumber: number, field: keyof OSMHole, value: string | number) => {
    if (!course) return;
    applyEdit({
      ...course,
      holes: course.holes.map((h) => (h.holeNumber === holeNumber ? { ...h, [field]: value } : h)),
    });
  };

  // QC finding path → select the feature it names (and jump to its hole).
  const onSelectPath = (path: string) => {
    if (!course) return;
    const m = path.match(/features\[(\d+)\]/);
    if (!m) return;
    const feat = course.features[Number(m[1])];
    if (!feat) return;
    setSelectedFid(feat.osmId);
    const hi = course.holes.findIndex((h) => h.featureIds.includes(feat.osmId));
    if (hi >= 0) setHoleIndex(hi);
    setTab("feature");
  };

  // ---- save flow (E1/N2) ----
  const revalidate = () => {
    if (!course) return;
    setPreflight(validateCourseData([course], true));
  };
  const onSave = async () => {
    if (!course) return;
    const findings = validateCourseData([course], true);
    setPreflight(findings);
    if (shouldBlockSave(findings)) {
      setSaveVerdict({ ok: false, errors: splitFindings(findings).errors, code: "preflight-failed" });
      setTab("qc");
      return;
    }
    setSaving(true);
    setSaveVerdict(null);
    try {
      const stagingKey = await uploadStaging(courseKey, [course]);
      const verdict = await saveCourseData(courseKey, "mlgen", stagingKey, baseEtag);
      setSaveVerdict(verdict);
      const kind = classifyVerdict(verdict);
      if (kind === "ok") {
        setDirty(false);
        clearDraft(courseKey);
        if (verdict.etag) setBaseEtag(verdict.etag);
        // refresh version list
        listCourseDataVersions(courseKey).then(setVersions).catch(() => {});
      } else if (kind === "conflict") {
        setConflict(verdict);
      }
    } catch (e) {
      setSaveVerdict({ ok: false, code: "save-failed", errors: [{ level: "error", code: "save-failed", path: "root", msg: e instanceof Error ? e.message : String(e) }] });
    } finally {
      setSaving(false);
    }
  };

  const reloadFromServer = async () => {
    setConflict(null);
    const mlgen = await downloadMlgen(courseKey);
    setCourse(mlgen[0] ?? null);
    pastRef.current = [];
    futureRef.current = [];
    setDirty(false);
    const vs = await listCourseDataVersions(courseKey);
    setVersions(vs);
    const latest = vs.find((v) => v.isLatest) ?? vs[0];
    setBaseEtag(latest?.etag ?? null);
    forceStacks((n) => n + 1);
  };

  // ---- publish callbacks ----
  const onSetStatus = async (status: ReviewStatus, noteVal: string) => {
    if (!row) return;
    const updated = await updateCourseIndex({
      osmId,
      reviewStatus: status,
      reviewNote: noteVal || null,
      reviewedAt: new Date().toISOString(),
    });
    setRow(updated);
  };
  const onFlip = async (flip: "mlgenAvailable" | "mlgenServeAll", enabling: boolean) => {
    if (!row) return;
    const updated = await updateCourseIndex({ osmId, [flip]: enabling });
    setRow(updated);
  };
  const onRestore = async (versionId: string) => {
    const verdict = await restoreCourseDataVersion(courseKey, versionId);
    if (verdict.ok) await reloadFromServer();
  };

  if (loading) return <LoadingState label="Loading course…" />;
  if (loadError) return <ErrorState error={loadError} onRetry={() => location.reload()} />;
  if (!course) return <ErrorState error="No mlgen course data found for this key." />;

  const errorCount = (row?.qcErrors ?? report?.validator?.errors?.length ?? 0) as number;
  const warnCount = (row?.qcWarnings ?? report?.validator?.warnings?.length ?? 0) as number;

  return (
    <div className="flex h-screen flex-col">
      {/* QC summary strip */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2 text-sm">
        <span className="font-semibold">{course.name}</span>
        <Chip className="border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {errorCount} errors
        </Chip>
        <Chip className="border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {warnCount} warnings
        </Chip>
        {row?.batchId && <span className="text-xs text-muted-foreground">batch {row.batchId}</span>}
        {report?.pipelineVersion && (
          <span className="text-xs text-muted-foreground">{report.pipelineVersion}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-600 dark:text-amber-400">unsaved</span>}
          <Button size="sm" variant="ghost" onClick={undo} disabled={pastRef.current.length === 0} aria-label="Undo">
            <Undo2Icon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={redo} disabled={futureRef.current.length === 0} aria-label="Redo">
            <Redo2Icon className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving || !dirty}>
            <SaveIcon className="mr-1 h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {regenBanner && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-1.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          This course was regenerated after your last local edit — your draft is based on older data.
          Review before saving.
        </div>
      )}
      {naipFailed && basemap === "osm" && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-1.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          NAIP imagery failed to load — switched to OpenStreetMap basemap.
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Left rail: class toggles + centerline legend */}
        <aside className="w-44 shrink-0 overflow-auto border-r border-border bg-card p-3">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Classes
          </h3>
          {ALL_CLASSES.map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-2 py-0.5 text-xs">
              <input
                type="checkbox"
                checked={visibleClasses.has(c)}
                onChange={(e) =>
                  setVisibleClasses((s) => {
                    const n = new Set(s);
                    if (e.target.checked) n.add(c);
                    else n.delete(c);
                    return n;
                  })
                }
              />
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: classSwatch(c) }} />
              {c}
            </label>
          ))}

          <h3 className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Rendition
          </h3>
          <div className="flex flex-col gap-1 text-xs">
            <label className="flex items-center gap-2">
              <input type="radio" checked={rendition === "mlgen"} onChange={() => setRendition("mlgen")} /> mlgen (filled)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={rendition === "legacy"} onChange={() => setRendition("legacy")} /> legacy (dashed)
            </label>
            <label className="mt-1 flex items-center gap-2">
              <input type="checkbox" checked={diff} onChange={(e) => setDiff(e.target.checked)} /> overlay diff
            </label>
          </div>

          <h3 className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Basemap
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setBasemap("naip")}
              className={cn("rounded border px-2 py-1 text-xs", basemap === "naip" ? "border-primary bg-primary/10 text-primary" : "border-border")}
            >
              NAIP
            </button>
            <button
              onClick={() => setBasemap("osm")}
              className={cn("rounded border px-2 py-1 text-xs", basemap === "osm" ? "border-primary bg-primary/10 text-primary" : "border-border")}
            >
              OSM
            </button>
          </div>
        </aside>

        {/* Map canvas */}
        <div className="relative min-w-0 flex-1">
          {/* Hole strip + edit controls */}
          <div className="absolute left-2 top-2 z-10 flex items-center gap-2 rounded-md bg-black/70 px-2 py-1 text-white">
            <button onClick={() => setHoleIndex((i) => Math.max(0, i - 1))} aria-label="Previous hole" disabled={holeIndex <= 0}>
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <span className="min-w-[72px] text-center text-xs font-semibold">
              Hole {hole?.holeNumber ?? "—"}
              {hole?.par ? ` · par ${hole.par}` : ""}
            </span>
            <button
              onClick={() => setHoleIndex((i) => Math.min(course.holes.length - 1, i + 1))}
              aria-label="Next hole"
              disabled={holeIndex >= course.holes.length - 1}
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Count-delta badges above map (diff mode) */}
          {diff && (
            <div className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 gap-1">
              {Object.entries(countDelta)
                .filter(([, d]) => d !== 0)
                .map(([cls, d]) => (
                  <Chip key={cls} className="border-white/30 bg-black/70 text-white">
                    {cls} {d > 0 ? `+${d}` : d}
                  </Chip>
                ))}
            </div>
          )}

          {/* Edit-mode controls */}
          <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-white">
            <button
              onClick={() => setEditMode("view")}
              className={cn("rounded px-2 py-1 text-xs", editMode === "view" && "bg-white/20")}
              title="View"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditMode(selectedFid ? "edit" : "view")}
              className={cn("rounded px-2 py-1 text-xs", editMode === "edit" && "bg-white/20")}
              disabled={!selectedFid}
              title={selectedFid ? "Edit selected geometry" : "Select a feature first"}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <select
              value={drawClass}
              onChange={(e) => setDrawClass(e.target.value as FeatureClass)}
              className="rounded bg-black/50 px-1 text-xs text-white"
            >
              {ACTIVE_CLASSES.map((c) => (
                <option key={c} value={c} className="text-black">
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={() => setEditMode("draw")}
              className={cn("rounded px-2 py-1 text-xs", editMode === "draw" && "bg-white/20")}
              title="Draw new feature"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <CourseMap
            mlgenFC={mlgenFC}
            legacyFC={legacyFC}
            centerlineFC={clFC}
            boundaryFC={bFC}
            bbox={bbox}
            visibleClasses={visibleClasses}
            rendition={rendition}
            diff={diff}
            basemap={basemap}
            selectedFid={selectedFid}
            editMode={editMode}
            drawClass={drawClass}
            onSelectFeature={(fid) => {
              setSelectedFid(fid);
              if (fid) setTab("feature");
            }}
            onGeometryChange={onGeometryChange}
            onDrawComplete={onDrawComplete}
            onNaipError={() => {
              setNaipFailed(true);
              setBasemap("osm");
            }}
          />
        </div>

        {/* Right docked panel */}
        <aside className="flex w-96 shrink-0 flex-col border-l border-border bg-card">
          <Tabs
            active={tab}
            onChange={(id) => setTab(id as TabId)}
            tabs={[
              { id: "feature", label: "Feature" },
              { id: "info", label: "Info" },
              { id: "qc", label: "QC" },
              { id: "versions", label: "Versions" },
              { id: "publish", label: "Publish" },
            ]}
          />
          <div className="min-h-0 flex-1 overflow-auto">
            {tab === "feature" && (
              <FeaturePropsPanel
                course={course}
                feature={selectedFeature}
                onChangeClass={onChangeClass}
                onAssign={onAssign}
                onUnassign={onUnassign}
                onDelete={onDelete}
              />
            )}
            {tab === "info" && (
              <InfoPanel course={course} hole={hole} onCourseField={onCourseField} onHoleField={onHoleField} />
            )}
            {tab === "qc" && (
              <QcPanel report={report} preflight={preflight} onRevalidate={revalidate} onSelectPath={onSelectPath} />
            )}
            {tab === "versions" && (
              <VersionsPanel versions={versions} loading={versionsLoading} onRestore={onRestore} />
            )}
            {tab === "publish" && (
              <PublishPanel row={row} onSetStatus={onSetStatus} onFlip={onFlip} note={note} onNote={setNote} />
            )}
          </div>
        </aside>
      </div>

      {/* Save verdict banner */}
      {saveVerdict && !saveVerdict.ok && !conflict && (
        <div className="border-t border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          Save blocked ({saveVerdict.code}):{" "}
          {(saveVerdict.errors ?? []).map((e) => `${e.code} @ ${e.path}`).join("; ")}
          <button className="ml-2 underline" onClick={() => setSaveVerdict(null)}>
            dismiss
          </button>
        </div>
      )}
      {saveVerdict?.ok && (
        <div className="border-t border-emerald-400/40 bg-emerald-50 px-4 py-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          Saved. {saveVerdict.indexSyncWarning && "(index counters lagged — will reconcile on next save)"}
          <button className="ml-2 underline" onClick={() => setSaveVerdict(null)}>
            dismiss
          </button>
        </div>
      )}

      {/* Draft restore prompt */}
      <Dialog
        open={!!draftPrompt}
        onClose={() => setDraftPrompt(null)}
        title="Restore unsaved draft?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => { clearDraft(courseKey); setDraftPrompt(null); }}>
              Discard draft
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (draftPrompt) {
                  setCourse(draftPrompt);
                  setDirty(true);
                }
                setDraftPrompt(null);
              }}
            >
              Restore draft
            </Button>
          </>
        }
      >
        <p>You have unsaved local edits for this course from a previous session. Restore them?</p>
      </Dialog>

      {/* Etag conflict recovery */}
      <Dialog
        open={!!conflict}
        onClose={() => setConflict(null)}
        title="Course changed since you loaded it"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConflict(null)}>
              Keep my edits
            </Button>
            <Button size="sm" onClick={reloadFromServer}>
              Reload from server
            </Button>
          </>
        }
      >
        <p>
          The canonical object was modified after you loaded it (version conflict). Reload the latest
          data (discarding your unsaved edits) or keep editing and re-save to try again.
        </p>
      </Dialog>
    </div>
  );
}
