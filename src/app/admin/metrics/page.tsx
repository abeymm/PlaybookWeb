"use client";

// /admin/metrics — coverage + hazard counters (Spec §W2.6 + Design D6/DT8).
// Primary glanceable stats: queue depth + unreviewed-but-served hazard count. Everything else is
// secondary detail. Computed on demand, client-side; index/storage scans are capped (item 13).

import { PageHeader } from "../_components/PageHeader";
import { ErrorState, LoadingState } from "../_components/states";
import { useAsync } from "../_components/hooks";
import { listAllCourses, listStorage, PREFIX } from "@/lib/coursedata/api";
import { isUnreviewedButServed } from "@/lib/coursedata/publish";
import { cn } from "@/lib/utils";
import type { CourseIndexRow, ReviewStatus } from "@/lib/coursedata/types";

const INDEX_PAGE_CAP = 20; // ≤20 pages/1000 (item 13)
const STORAGE_PREFIXES = [PREFIX.legacy, PREFIX.mlgen, PREFIX.reports];

interface Metrics {
  total: number;
  truncated: boolean;
  byStatus: Record<string, number>;
  withMlgen: number;
  approved: number;
  served: number;
  hazard: number;
  qcErrorCourses: number;
  qcWarningCourses: number;
  qcCleanCourses: number;
  storageBytes: Record<string, { bytes: number; count: number }>;
}

async function computeMetrics(): Promise<Metrics> {
  const rows: CourseIndexRow[] = [];
  let nextToken: string | null | undefined = undefined;
  let pages = 0;
  do {
    const page = await listAllCourses({ limit: 1000, nextToken });
    rows.push(...page.items);
    nextToken = page.nextToken;
    pages++;
  } while (nextToken && pages < INDEX_PAGE_CAP);
  const truncated = !!nextToken;

  const byStatus: Record<string, number> = {};
  let withMlgen = 0,
    approved = 0,
    served = 0,
    hazard = 0,
    qcErrorCourses = 0,
    qcWarningCourses = 0,
    qcCleanCourses = 0;
  for (const r of rows) {
    const s = (r.reviewStatus ?? "unreviewed") as ReviewStatus;
    byStatus[s] = (byStatus[s] ?? 0) + 1;
    if (r.mlgenVersion || r.mlgenAvailable || r.mlgenServeAll) withMlgen++;
    if (s === "approved") approved++;
    if (r.mlgenServeAll || r.mlgenAvailable) served++;
    if (isUnreviewedButServed(r)) hazard++;
    const e = r.qcErrors ?? 0;
    const w = r.qcWarnings ?? 0;
    if (e > 0) qcErrorCourses++;
    else if (w > 0) qcWarningCourses++;
    else qcCleanCourses++;
  }

  const storageBytes: Record<string, { bytes: number; count: number }> = {};
  for (const p of STORAGE_PREFIXES) {
    try {
      const objs = await listStorage(p);
      storageBytes[p] = {
        bytes: objs.reduce((s2, o) => s2 + (o.size ?? 0), 0),
        count: objs.length,
      };
    } catch {
      storageBytes[p] = { bytes: 0, count: 0 };
    }
  }

  return {
    total: rows.length,
    truncated,
    byStatus,
    withMlgen,
    approved,
    served,
    hazard,
    qcErrorCourses,
    qcWarningCourses,
    qcCleanCourses,
    storageBytes,
  };
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function Stat({
  label,
  value,
  tone,
  big,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "hazard" | "good";
  big?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        tone === "hazard"
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
          : tone === "good"
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
            : "border-border bg-card"
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 font-semibold tabular-nums",
          big ? "text-3xl" : "text-xl",
          tone === "hazard" && "text-red-600 dark:text-red-400"
        )}
      >
        {value}
      </div>
    </div>
  );
}

export default function MetricsPage() {
  const { data: m, loading, error, reload } = useAsync<Metrics>(computeMetrics, []);

  return (
    <div className="flex flex-col">
      <PageHeader title="Metrics" subtitle="Coverage, review-queue depth, and serving hazards." />
      <div className="px-6 py-4">
        {loading ? (
          <LoadingState label="Aggregating the index…" />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : m ? (
          <div className="space-y-6">
            {m.truncated && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Index scan truncated at {INDEX_PAGE_CAP}k rows — totals below are a lower bound.
              </p>
            )}

            {/* Primary glanceable row */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Stat
                label="Review queue depth"
                value={(m.byStatus["unreviewed"] ?? 0) + (m.byStatus["needs_fix"] ?? 0)}
                big
              />
              <Stat
                label="Unreviewed but served (hazard)"
                value={m.hazard}
                tone={m.hazard > 0 ? "hazard" : "good"}
                big
              />
              <Stat label="Approved" value={m.approved} tone="good" big />
            </div>

            {/* Coverage */}
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Coverage
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat label="Total courses" value={m.total} />
                <Stat label="With mlgen" value={m.withMlgen} />
                <Stat label="Approved" value={m.approved} />
                <Stat label="Served (any client)" value={m.served} />
              </div>
            </section>

            {/* Review status distribution */}
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Review status
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {(["unreviewed", "in_review", "needs_fix", "approved", "rejected"] as ReviewStatus[]).map(
                  (s) => (
                    <Stat key={s} label={s} value={m.byStatus[s] ?? 0} />
                  )
                )}
              </div>
            </section>

            {/* QC distribution */}
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                QC distribution
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <Stat label="Courses with errors" value={m.qcErrorCourses} tone={m.qcErrorCourses > 0 ? "hazard" : "default"} />
                <Stat label="Warnings only" value={m.qcWarningCourses} />
                <Stat label="Clean" value={m.qcCleanCourses} tone="good" />
              </div>
            </section>

            {/* Storage */}
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Storage bytes per prefix
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {STORAGE_PREFIXES.map((p) => (
                  <Stat
                    key={p}
                    label={p}
                    value={`${fmtBytes(m.storageBytes[p]?.bytes ?? 0)} · ${m.storageBytes[p]?.count ?? 0} obj`}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
