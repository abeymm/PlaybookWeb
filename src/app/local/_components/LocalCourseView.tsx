"use client";

// LocalCourseView — the generated course on the same NAIP-true map the admin editor uses, with
// the same per-hole derivation (mapdata.ts), the same pure edit reducers (edit.ts), and the same
// feature panel. Saves go to the local run directory via PUT /local/api/course/<key>.

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip, Tabs } from "@/app/admin/_components/ui";
import CourseMap from "@/app/admin/courses/[osmId]/_components/CourseMap";
import { FeaturePropsPanel, InfoPanel } from "@/app/admin/courses/[osmId]/_components/Panels";
import {
  holeFeatureGeos, toPolygonFC, centerlineFC, boundaryFC, holeBbox,
} from "@/app/admin/courses/[osmId]/_components/mapdata";
import {
  changeFeatureClass, assignFeatureToHole, unassignFeatureFromHole, deleteFeature, updateFeatureGeometry,
} from "@/lib/coursedata/edit";
import { ACTIVE_CLASSES } from "@/lib/coursedata/featureTags";
import { classSwatch } from "@/lib/coursedata/colors";
import { cn } from "@/lib/utils";
import type { OSMCourse, OSMHole, FeatureClass, Coordinate, ValidationFinding, CheckItem } from "@/lib/coursedata/types";

type PanelTab = "feature" | "info" | "checks";
const PANEL_TABS: { id: PanelTab; label: string }[] = [
  { id: "feature", label: "Feature" },
  { id: "info", label: "Info" },
  { id: "checks", label: "Checks" },
];

const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
// Most batch-generated courses still carry golf=rough polygons that blanket the map, so default
// them off here (unlike /admin, which defaults every class on). Toggleable via the class row below.
const DEFAULT_VISIBLE = new Set<FeatureClass>(ACTIVE_CLASSES.filter((c) => c !== "rough"));

// Single-button basemap toggle: cycle NAIP -> OSM streets (not imagery) -> NAIP.
type Basemap = "naip" | "osm";
const BASEMAP_CYCLE: Record<Basemap, Basemap> = { naip: "osm", osm: "naip" };
const BASEMAP_LABEL: Record<Basemap, string> = { naip: "NAIP", osm: "OSM" };

export interface LocalCourseViewProps {
  course: OSMCourse;
  dirty: boolean;
  saving: boolean;
  /** Findings from the last save attempt (errors block, warnings are advisory). */
  saveFindings: ValidationFinding[] | null;
  onChange: (next: OSMCourse) => void;
  onSave: () => void;
}

export default function LocalCourseView(props: LocalCourseViewProps) {
  const { course, dirty, saving, saveFindings, onChange, onSave } = props;
  const [holeIndex, setHoleIndex] = useState(0);
  const [selectedFid, setSelectedFid] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"view" | "edit">("view");
  const [basemap, setBasemap] = useState<Basemap>("naip");
  const [tab, setTab] = useState<PanelTab>("feature");
  const [visibleClasses, setVisibleClasses] = useState<Set<FeatureClass>>(DEFAULT_VISIBLE);

  const hole: OSMHole | undefined = course.holes[holeIndex];
  const geos = useMemo(() => holeFeatureGeos(course, hole), [course, hole]);
  const polygonFC = useMemo(() => toPolygonFC(geos), [geos]);
  const clFC = useMemo(() => centerlineFC(hole), [hole]);
  const bFC = useMemo(() => boundaryFC(course), [course]);
  const bbox = useMemo(() => holeBbox(geos, clFC), [geos, clFC]);
  const selectedFeature = useMemo(
    () => course.features.find((f) => f.osmId === selectedFid) ?? null,
    [course, selectedFid]
  );

  // Same field updates as the admin editor (CourseDetail.onCourseField / onHoleField) — e.g. the
  // OSM-sourced par 0 that strict validation rejects gets corrected here before saving.
  const onCourseField = (field: keyof OSMCourse, value: string | number) =>
    onChange({ ...course, [field]: value });
  const onHoleField = (holeNumber: number, field: keyof OSMHole, value: string | number) =>
    onChange({
      ...course,
      holes: course.holes.map((h) => (h.holeNumber === holeNumber ? { ...h, [field]: value } : h)),
    });

  const onGeometryChange = useCallback(
    (fid: string, coords: Coordinate[]) => onChange(updateFeatureGeometry(course, fid, coords)),
    [course, onChange]
  );

  const openChecks = useMemo(
    () => (course.checks?.items ?? []).filter((i) => i.status === "open"),
    [course.checks]
  );
  const errors = saveFindings?.filter((f) => f.level === "error") ?? [];
  const warnings = saveFindings?.filter((f) => f.level === "warning") ?? [];

  return (
    <section className="flex flex-col border-b border-border">
      <div className="flex items-center gap-3 px-6 py-2">
        <div>
          <div className="text-sm font-semibold">{course.name}</div>
          <div className="font-mono text-xs text-muted-foreground">
            {course.osmId} · {course.holes.length} holes · {course.features.length} features
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant={editMode === "edit" ? "default" : "outline"}
            onClick={() => setEditMode((m) => (m === "edit" ? "view" : "edit"))}>
            {editMode === "edit" ? "Editing vertices" : "Edit vertices"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBasemap((b) => BASEMAP_CYCLE[b])}>
            {BASEMAP_LABEL[basemap]}
          </Button>
          {openChecks.length > 0 && (
            <button onClick={() => setTab("checks")} title="open verification items">
              <Chip className="border-amber-300 text-amber-700 dark:text-amber-300">{openChecks.length} checks</Chip>
            </button>
          )}
          {dirty && <Chip className="border-amber-300 text-amber-700 dark:text-amber-300">unsaved</Chip>}
          <Button size="sm" onClick={onSave} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save to disk"}
          </Button>
        </div>
      </div>
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="max-h-28 overflow-auto border-t border-border px-6 py-1.5 text-xs">
          {errors.map((f, i) => (
            <div key={`e${i}`} className="text-destructive">
              <code className="font-mono text-[11px]">{f.path}</code> {f.msg}
            </div>
          ))}
          {warnings.map((f, i) => (
            <div key={`w${i}`} className="text-amber-600 dark:text-amber-400">
              <code className="font-mono text-[11px]">{f.path}</code> {f.msg}
            </div>
          ))}
        </div>
      )}
      <div className="flex h-[70vh] min-h-[480px] border-t border-border">
        <aside className="w-44 shrink-0 overflow-auto border-r border-border bg-card">
          <ul>
            {course.holes.map((h, i) => (
              <li key={h.osmId ?? i}>
                <button
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-muted/40",
                    i === holeIndex && "bg-primary/10"
                  )}
                  onClick={() => {
                    setHoleIndex(i);
                    setSelectedFid(null);
                  }}
                  aria-current={i === holeIndex ? "true" : undefined}
                >
                  <span>Hole {h.holeNumber}</span>
                  <span className="text-xs text-muted-foreground">
                    par {h.par ?? "—"} · {h.featureIds.length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-card px-3 py-1.5">
            {ACTIVE_CLASSES.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-1.5 text-xs">
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
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: classSwatch(c) }} />
                {c}
              </label>
            ))}
          </div>
          <div className="relative min-h-0 flex-1">
          <CourseMap
            mlgenFC={polygonFC}
            legacyFC={EMPTY_FC}
            centerlineFC={clFC}
            boundaryFC={bFC}
            bbox={bbox}
            visibleClasses={visibleClasses}
            rendition="mlgen"
            diff={false}
            basemap={basemap}
            selectedFid={selectedFid}
            editMode={editMode}
            drawClass="bunker"
            onSelectFeature={(fid) => {
              setSelectedFid(fid);
              if (fid) setTab("feature");
            }}
            onGeometryChange={onGeometryChange}
            onDrawComplete={() => {}}
            onNaipError={() => setBasemap("osm")}
          />
          </div>
        </div>
        <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-card">
          <Tabs tabs={PANEL_TABS} active={tab} onChange={(id) => setTab(id as PanelTab)} />
          <div className="min-h-0 flex-1 overflow-auto">
            {tab === "feature" ? (
              <FeaturePropsPanel
                course={course}
                feature={selectedFeature}
                onChangeClass={(fid, cls) => onChange(changeFeatureClass(course, fid, cls))}
                onAssign={(fid, h) => onChange(assignFeatureToHole(course, fid, h))}
                onUnassign={(fid, h) => onChange(unassignFeatureFromHole(course, fid, h))}
                onDelete={(fid) => {
                  onChange(deleteFeature(course, fid));
                  setSelectedFid(null);
                }}
              />
            ) : tab === "info" ? (
              <InfoPanel course={course} hole={hole} onCourseField={onCourseField} onHoleField={onHoleField} />
            ) : (
              <ChecksPanel items={course.checks?.items ?? []} onJumpHole={(idx) => { setHoleIndex(idx); setSelectedFid(null); }} />
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

const SEVERITY_CHIP: Record<CheckItem["severity"], string> = {
  error: "border-red-300 text-red-700 dark:text-red-300",
  warning: "border-amber-300 text-amber-700 dark:text-amber-300",
  info: "border-border text-muted-foreground",
};

/** Read-only list of the course's `checks` (open first). Resolution is a later step. */
function ChecksPanel({ items, onJumpHole }: { items: CheckItem[]; onJumpHole: (holeIndex: number) => void }) {
  if (items.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No checks recorded. Attach a scorecard to raise them.</div>;
  }
  const ordered = [...items].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1));
  return (
    <ul className="divide-y divide-border text-xs">
      {ordered.map((it) => {
        const m = it.path.match(/^holes\[(\d+)\]/);
        return (
          <li key={it.id} className={cn("space-y-1 p-3", it.status !== "open" && "opacity-50")}>
            <div className="flex items-center gap-2">
              <Chip className={SEVERITY_CHIP[it.severity]}>{it.kind}</Chip>
              {it.status !== "open" && <Chip>{it.status}</Chip>}
              {m ? (
                <button className="ml-auto font-mono text-[11px] underline" onClick={() => onJumpHole(Number(m[1]))}>{it.path}</button>
              ) : (
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">{it.path}</span>
              )}
            </div>
            <div>{it.msg}</div>
            {(it.candidates?.length ?? 0) > 0 && (
              <div className="text-muted-foreground">
                current <span className="font-mono">{String(it.current ?? "—")}</span>
                {it.candidates!.map((c, i) => (
                  <span key={i}> · {c.source}: <span className="font-mono">{String(c.value)}</span></span>
                ))}
              </div>
            )}
            {(it.evidence?.length ?? 0) > 0 && (
              <div className="text-[11px] text-muted-foreground">verify via: {it.evidence!.join(", ")}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
