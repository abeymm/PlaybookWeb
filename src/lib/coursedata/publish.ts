// publish.ts — pure logic for the publish panel: serving-flip audience wording + guards.
//
// The two flips (Spec §W2 publish panel) are the only things that change what clients receive.
// Their confirm dialogs MUST state exactly who starts seeing what:
//   mlgenAvailable → v2 clients (new app builds sending contentVersion:"v2")
//   mlgenServeAll  → ALL clients, including old iOS (the backward-compat flip)
// Flips are disabled while reviewStatus !== "approved".

import type { CourseIndexRow, ReviewStatus } from "./types";

export type ServeFlip = "mlgenAvailable" | "mlgenServeAll";

/** Human wording naming the exact audience for a flip (both directions). */
export function flipAudience(flip: ServeFlip, enabling: boolean): string {
  if (flip === "mlgenAvailable") {
    return enabling
      ? "v2 clients (new app builds that request contentVersion \"v2\") will start receiving the mlgen data for this course."
      : "v2 clients will stop receiving the mlgen data; they fall back to the legacy data.";
  }
  return enabling
    ? "ALL clients — including old iOS builds that do not send a content version — will start receiving the mlgen data for this course."
    : "ALL clients will stop receiving the mlgen data; every client falls back to the legacy data.";
}

/** Short label for the flip toggle. */
export function flipLabel(flip: ServeFlip): string {
  return flip === "mlgenAvailable" ? "Available to v2 clients" : "Serve to ALL clients";
}

/** Serving flips are only allowed once the course is approved. */
export function canFlipServing(status: ReviewStatus | null | undefined): boolean {
  return status === "approved";
}

/** Whether a course is currently being served the mlgen rendition to anyone. */
export function isServingMlgen(row: CourseIndexRow): boolean {
  return row.mlgenServeAll === true || row.mlgenAvailable === true;
}

/**
 * "Unreviewed but served" hazard (Finding A / N1): a row is a hazard when it is being served
 * the mlgen rendition while NOT approved. A nonzero count on the metrics page is an alarm.
 */
export function isUnreviewedButServed(row: CourseIndexRow): boolean {
  return isServingMlgen(row) && (row.reviewStatus ?? "unreviewed") !== "approved";
}

/** Bulk actions permitted from the queue: reviewStatus-only writes (never a serving flip). */
export const BULK_ACTIONS: ReviewStatus[] = ["approved", "needs_fix", "rejected"];

/** True if a reviewStatus write is a safe bulk action (never a serve-flag mutation, B5.3). */
export function isBulkSafeStatus(status: ReviewStatus): boolean {
  return BULK_ACTIONS.includes(status);
}
