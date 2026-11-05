// queue.ts — pure review-queue ranking/filtering logic (Spec §W2 review + F4).
//
// Queue = index rows with reviewStatus unreviewed|needs_fix, DEFAULT filtered to the latest
// batchId, ranked by (demand desc, qcErrors desc, qcWarnings desc). null qc/demand sorts LAST
// (never crashes — Finding K).

import type { CourseIndexRow, ReviewStatus } from "./types";

/** reviewStatus values that land in the queue. */
export const QUEUE_STATUSES: ReviewStatus[] = ["unreviewed", "needs_fix"];

/** True if a row belongs in the review queue (unreviewed or needs_fix, incl. null=unreviewed). */
export function isQueued(row: CourseIndexRow): boolean {
  const s = row.reviewStatus ?? "unreviewed";
  return QUEUE_STATUSES.includes(s);
}

/** The latest (lexicographically-max) non-null batchId across rows, or null if none carry one. */
export function latestBatchId(rows: CourseIndexRow[]): string | null {
  let latest: string | null = null;
  for (const r of rows) {
    if (r.batchId != null && (latest === null || r.batchId > latest)) latest = r.batchId;
  }
  return latest;
}

// null demand/qc sorts AFTER any real value (treat as -Infinity so desc puts it last).
const n = (v: number | null | undefined): number => (v == null ? -Infinity : v);

/**
 * Rank rows by (demand desc, qcErrors desc, qcWarnings desc). Stable, non-mutating.
 * Courses real users play (demand) are triaged first; then most-broken first.
 */
export function rankQueue(rows: CourseIndexRow[]): CourseIndexRow[] {
  return [...rows].sort((a, b) => {
    const d = n(b.demandCount) - n(a.demandCount);
    if (d !== 0) return d;
    const e = n(b.qcErrors) - n(a.qcErrors);
    if (e !== 0) return e;
    return n(b.qcWarnings) - n(a.qcWarnings);
  });
}

export interface QueueOptions {
  /** When set, only include rows with this batchId. Use latestBatchId() for the default view. */
  batchId?: string | null;
}

/** Build the ranked queue: filter to queued statuses (+ optional batch), then rank. */
export function buildQueue(rows: CourseIndexRow[], opts: QueueOptions = {}): CourseIndexRow[] {
  let filtered = rows.filter(isQueued);
  if (opts.batchId != null) filtered = filtered.filter((r) => r.batchId === opts.batchId);
  return rankQueue(filtered);
}

/** True if a row is eligible for bulk-approve: no errors AND no warnings (clean rows only, DT3). */
export function isBulkApproveEligible(row: CourseIndexRow): boolean {
  return (row.qcErrors ?? 0) === 0 && (row.qcWarnings ?? 0) === 0;
}
