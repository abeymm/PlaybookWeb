// bookTypes.ts — response shapes for /local/api/book, safe for client imports (no node: modules).

import type { JobRecord } from "./jobs";

export interface RunSummary {
  runId: string;
  status: string;
  failedStage: string | null;
  buildId: string | null;
  revision: number | null;
  variant: string | null;
  edition: string | null;
  finishedAt: string | null;
  pages: number | null;
  marginViolations: number | null;
  warnings: string[];
  qrTarget: string | null;
  hasPdf: boolean;
  hasContact: boolean;
  hasReview: boolean;
  released: boolean;
  /** `strategy/final` exists: the review/edit page can open. */
  hasStrategy: boolean;
  /** `strategy/edited` exists: a human-edited plan is on disk. */
  hasEdited: boolean;
}

export interface BookStatusResponse {
  key: string;
  canBuild: boolean;
  golfapiCourseId: string | null;
  secretAvailable: boolean;
  job: JobRecord | null;
  logTail: string;
  runs: RunSummary[];
  printDir: string;
}
