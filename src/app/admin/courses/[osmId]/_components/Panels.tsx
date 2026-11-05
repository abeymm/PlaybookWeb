"use client";

// Docked right-panel tabs for the course detail screen: Feature props / Info / QC / Versions /
// Publish. Kept in one file (cohesive panel set); each is a small presentational component driven
// by callbacks from CourseDetail.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip, Dialog, Switch } from "../../../_components/ui";
import { EmptyState } from "../../../_components/states";
import { ALL_CLASSES, isDisabledClass, classFromTags } from "@/lib/coursedata/featureTags";
import { reviewChip } from "@/lib/coursedata/colors";
import { flipAudience, flipLabel, canFlipServing, type ServeFlip } from "@/lib/coursedata/publish";
import type {
  OSMCourse,
  OSMFeature,
  OSMHole,
  FeatureClass,
  ValidationFinding,
  CourseDataVersion,
  QcReport,
  CourseIndexRow,
  ReviewStatus,
} from "@/lib/coursedata/types";

// ---- Feature props ----
export function FeaturePropsPanel({
  course,
  feature,
  onChangeClass,
  onAssign,
  onUnassign,
  onDelete,
}: {
  course: OSMCourse;
  feature: OSMFeature | null;
  onChangeClass: (fid: string, cls: FeatureClass) => void;
  onAssign: (fid: string, holeNumber: number) => void;
  onUnassign: (fid: string, holeNumber: number) => void;
  onDelete: (fid: string) => void;
}) {
  if (!feature)
    return (
      <EmptyState title="No feature selected" hint="Click a polygon on the map to edit its class, hole, or geometry." />
    );
  const cls = classFromTags(feature.tags);
  const assignedHoles = course.holes.filter((h) => h.featureIds.includes(feature.osmId));
  return (
    <div className="space-y-4 p-4 text-sm">
      <div>
        <div className="text-xs text-muted-foreground">Feature</div>
        <div className="font-mono text-xs break-all">{feature.osmId}</div>
      </div>
      <label className="block">
        <div className="mb-1 text-xs font-medium text-muted-foreground">Class</div>
        <select
          value={cls ?? ""}
          onChange={(e) => onChangeClass(feature.osmId, e.target.value as FeatureClass)}
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
        >
          {!cls && <option value="">(unknown)</option>}
          {ALL_CLASSES.map((c) => (
            <option key={c} value={c} disabled={isDisabledClass(c)}>
              {c}
              {isDisabledClass(c) ? " (not rendered by iOS)" : ""}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">Assigned holes</div>
        <div className="flex flex-wrap gap-1">
          {assignedHoles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
          {assignedHoles.map((h) => (
            <Chip key={h.holeNumber} className="border-border bg-muted">
              #{h.holeNumber}
              <button
                className="ml-1 text-muted-foreground hover:text-destructive"
                onClick={() => onUnassign(feature.osmId, h.holeNumber)}
                aria-label={`Unassign from hole ${h.holeNumber}`}
              >
                ×
              </button>
            </Chip>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Assign to hole</span>
          <select
            className="h-7 rounded-md border border-input bg-background px-2 text-xs"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onAssign(feature.osmId, Number(e.target.value));
              e.currentTarget.value = "";
            }}
          >
            <option value="">…</option>
            {course.holes.map((h) => (
              <option key={h.holeNumber} value={h.holeNumber}>
                #{h.holeNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {feature.areaM2 != null && <>Area: {Math.round(feature.areaM2)} m² · </>}
        {feature.coordinates?.length ?? 0} vertices
      </div>

      <Button variant="destructive" size="sm" onClick={() => onDelete(feature.osmId)}>
        Delete feature
      </Button>
    </div>
  );
}

// ---- Info / scorecard ----
export function InfoPanel({
  course,
  hole,
  onCourseField,
  onHoleField,
}: {
  course: OSMCourse;
  hole: OSMHole | undefined;
  onCourseField: (field: keyof OSMCourse, value: string | number) => void;
  onHoleField: (holeNumber: number, field: keyof OSMHole, value: string | number) => void;
}) {
  return (
    <div className="space-y-4 p-4 text-sm">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Course</h3>
        <div className="space-y-2">
          <TextField label="Name" value={course.name ?? ""} onChange={(v) => onCourseField("name", v)} />
          <TextField label="Address" value={course.address ?? ""} onChange={(v) => onCourseField("address", v)} />
          <TextField label="Phone" value={course.phone ?? ""} onChange={(v) => onCourseField("phone", v)} />
          <TextField label="Website" value={course.website ?? ""} onChange={(v) => onCourseField("website", v)} />
          <NumField label="Hole count" value={course.holeCount ?? 0} onChange={(v) => onCourseField("holeCount", v)} />
        </div>
      </section>

      {hole && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hole #{hole.holeNumber}
          </h3>
          <div className="space-y-2">
            <NumField label="Par" value={hole.par} onChange={(v) => onHoleField(hole.holeNumber, "par", v)} />
            <NumField
              label="Hole number"
              value={hole.holeNumber}
              onChange={(v) => onHoleField(hole.holeNumber, "holeNumber", v)}
            />
            <NumField
              label="Length (yd)"
              value={hole.length ?? 0}
              onChange={(v) => onHoleField(hole.holeNumber, "length", v)}
            />
          </div>
          {hole.teeClassifications && Object.keys(hole.teeClassifications).length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">Tee classifications</div>
              <ul className="space-y-0.5 text-xs">
                {Object.entries(hole.teeClassifications).map(([teeId, tc]) => (
                  <li key={teeId} className="flex justify-between gap-2">
                    <span className="truncate font-mono">{teeId}</span>
                    <span className="text-muted-foreground">
                      {tc.color} / {tc.type}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="mb-0.5 text-xs text-muted-foreground">{label}</div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8" />
    </label>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="mb-0.5 text-xs text-muted-foreground">{label}</div>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-28"
      />
    </label>
  );
}

// ---- QC ----
export function QcPanel({
  report,
  preflight,
  onRevalidate,
  onSelectPath,
}: {
  report: QcReport | null;
  preflight: ValidationFinding[] | null;
  onRevalidate: () => void;
  onSelectPath: (path: string) => void;
}) {
  const reportFindings = [
    ...(report?.validator?.errors ?? []),
    ...(report?.validator?.warnings ?? []),
  ];
  return (
    <div className="space-y-4 p-4 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          QC report
        </h3>
        <Button size="sm" variant="outline" onClick={onRevalidate}>
          Re-validate (preflight)
        </Button>
      </div>

      {!report ? (
        <EmptyState title="No QC report" hint="No report.json was found for this course." />
      ) : (
        <>
          <div className="text-xs text-muted-foreground">
            {report.pipelineVersion && <>Pipeline {report.pipelineVersion} · </>}
            {report.generatedAt && new Date(report.generatedAt).toLocaleString()}
          </div>
          {report.models && (
            <div className="text-xs">
              <span className="text-muted-foreground">Models: </span>
              {Object.entries(report.models)
                .map(([k, v]) => `${k}=${v ?? "—"}`)
                .join(", ")}
            </div>
          )}
          {report.counts && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(report.counts).map(([k, v]) => (
                <Chip key={k} className="border-border bg-muted text-xs">
                  {k}: {v}
                </Chip>
              ))}
            </div>
          )}
          <FindingList findings={reportFindings} onSelectPath={onSelectPath} emptyLabel="No findings in report." />
        </>
      )}

      {preflight && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preflight (current edits)
          </h3>
          <FindingList findings={preflight} onSelectPath={onSelectPath} emptyLabel="Preflight clean — no findings." />
        </div>
      )}
    </div>
  );
}

export function FindingList({
  findings,
  onSelectPath,
  emptyLabel,
}: {
  findings: ValidationFinding[];
  onSelectPath: (path: string) => void;
  emptyLabel: string;
}) {
  if (findings.length === 0)
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  return (
    <ul className="space-y-1">
      {findings.map((f, i) => (
        <li key={i}>
          <button
            onClick={() => onSelectPath(f.path)}
            className="w-full rounded-md border border-border px-2 py-1 text-left text-xs hover:bg-muted"
          >
            <span
              className={
                f.level === "error"
                  ? "font-semibold text-destructive"
                  : "font-semibold text-amber-600 dark:text-amber-400"
              }
            >
              {f.level} · {f.code}
            </span>
            <div className="font-mono text-[11px] text-muted-foreground">{f.path}</div>
            <div className="text-[11px]">{f.msg}</div>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---- Versions ----
export function VersionsPanel({
  versions,
  loading,
  onRestore,
}: {
  versions: CourseDataVersion[];
  loading: boolean;
  onRestore: (versionId: string) => Promise<void>;
}) {
  const [confirm, setConfirm] = useState<CourseDataVersion | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2 p-4 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Versions</h3>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading versions…</p>
      ) : versions.length === 0 ? (
        <EmptyState title="No versions" hint="This object has no version history yet." />
      ) : (
        <ul className="space-y-1">
          {versions.map((v) => (
            <li
              key={v.versionId}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1"
            >
              <div className="min-w-0">
                <div className="truncate font-mono text-[11px]">
                  {v.versionId === "null" ? "(pre-versioning)" : v.versionId}
                  {v.isDeleteMarker ? (
                    <span className="ml-1 text-muted-foreground">(deleted)</span>
                  ) : (
                    v.isLatest && <span className="ml-1 text-primary">· latest</span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {v.lastModified ? new Date(v.lastModified).toLocaleString() : "—"}
                  {!v.isDeleteMarker && v.size != null && ` · ${(v.size / 1024).toFixed(0)} KB`}
                  {v.metadata?.["edited-by"] && ` · ${v.metadata["edited-by"]}`}
                </div>
              </div>
              {/* A delete marker is not a stored object — there is nothing to CopyObject-restore
                  from, so it never gets a Restore button regardless of isLatest (C14). */}
              {!v.isLatest && !v.isDeleteMarker && (
                <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => setConfirm(v)}>
                  Restore
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Restore this version?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirm(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={busy}
              onClick={async () => {
                if (!confirm) return;
                setBusy(true);
                try {
                  await onRestore(confirm.versionId);
                  setConfirm(null);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Restoring…" : "Restore"}
            </Button>
          </>
        }
      >
        <p>
          Restore version{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">{confirm?.versionId}</code> as the
          new current object? A new version is created; the current one stays in history.
        </p>
      </Dialog>
    </div>
  );
}

// ---- Publish ----
export function PublishPanel({
  row,
  onSetStatus,
  onFlip,
  note,
  onNote,
}: {
  row: CourseIndexRow | null;
  onSetStatus: (status: ReviewStatus, note: string) => void;
  onFlip: (flip: ServeFlip, enabling: boolean) => void;
  note: string;
  onNote: (v: string) => void;
}) {
  const [confirm, setConfirm] = useState<{ flip: ServeFlip; enabling: boolean } | null>(null);
  const status = row?.reviewStatus ?? "unreviewed";
  const rc = reviewChip(status);
  const flipsEnabled = canFlipServing(status);
  return (
    <div className="space-y-4 p-4 text-sm">
      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">Review status</div>
        <Chip className={rc.className}>{rc.label}</Chip>
      </div>

      <label className="block">
        <div className="mb-1 text-xs text-muted-foreground">Review note</div>
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onSetStatus("approved", note)}>
          Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => onSetStatus("needs_fix", note)}>
          Needs fix
        </Button>
        <Button size="sm" variant="outline" onClick={() => onSetStatus("rejected", note)}>
          Reject
        </Button>
      </div>

      <div className="space-y-3 rounded-md border border-border p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Serving
        </div>
        {!flipsEnabled && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Approve this course before changing what clients are served.
          </p>
        )}
        {(["mlgenAvailable", "mlgenServeAll"] as ServeFlip[]).map((flip) => {
          const enabled = flip === "mlgenAvailable" ? !!row?.mlgenAvailable : !!row?.mlgenServeAll;
          return (
            <div key={flip} className="flex items-center justify-between gap-2">
              <span className="text-xs">{flipLabel(flip)}</span>
              <Switch
                checked={enabled}
                disabled={!flipsEnabled}
                onChange={(v) => setConfirm({ flip, enabling: v })}
                label={flipLabel(flip)}
              />
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Confirm serving change"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (confirm) onFlip(confirm.flip, confirm.enabling);
                setConfirm(null);
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        {confirm && <p>{flipAudience(confirm.flip, confirm.enabling)}</p>}
      </Dialog>
    </div>
  );
}
