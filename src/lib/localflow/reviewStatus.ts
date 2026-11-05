// reviewStatus.ts — pure classification of a generated course's review state, combining the
// generation report's anomalies with the cohort scanner's fragment/exclude flags. Backs the
// grouping in GET /local/api/generated, which browses the ~5.6k generated courses by status.

export type ReviewStatus = "clean" | "needs-review" | "fragment" | "invalid";

export interface ReviewStatusInput {
  /** Whether the course's generation report (`<key>.report.json`) exists. */
  valid: boolean;
  /** Distinct anomaly `kind`s from the report (empty when there's no report, or none were found). */
  anomalies: string[];
  /** Set when the cohort scanner marked this record as a split-off fragment of another course
   *  (`CohortEntry.fragmentOf`). */
  fragmentOf: string | null;
  /** Exclusion reasons from the cohort scanner (`CohortEntry.exclude`). */
  exclude: string[];
}

/**
 * Classifies a generated course for review triage:
 * - "fragment": the cohort scanner flagged this record (`fragmentOf` set or `exclude` non-empty)
 *   — regardless of validity, since these were never meant to be served on their own.
 * - "invalid": the generated JSON exists but no report was produced.
 * - "needs-review": has a report, and it flagged one or more anomaly kinds.
 * - "clean": has a report with no anomalies, and isn't a fragment/exclusion.
 */
export function reviewStatus(entry: ReviewStatusInput): ReviewStatus {
  if (entry.fragmentOf !== null || entry.exclude.length > 0) return "fragment";
  if (!entry.valid) return "invalid";
  if (entry.anomalies.length > 0) return "needs-review";
  return "clean";
}
