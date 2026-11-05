// types.ts — response shapes shared by the /local route handlers and the page. Pure types:
// safe to import from client components (server.ts / config.ts are not).

import type { CohortEntry } from "./cohort";
import type { JobRecord } from "./jobs";
import type { Scorecard, ScorecardCandidate } from "./scorecard";
import type { ReviewStatus } from "./reviewStatus";

export type { CohortEntry, JobRecord, Scorecard, ScorecardCandidate, ReviewStatus };

export interface FileInfo {
  exists: boolean;
  size?: number;
  mtime?: string;
}

export interface PlaybookFile {
  name: string;
  size: number;
  mtime: string;
}

export interface JobView {
  job: JobRecord | null;
  logTail: string;
}

/** GET /local/api/generated item: a cohort course whose generated courseData exists on disk. */
export interface GeneratedEntry extends CohortEntry {
  generatedAt: string;
  /** Whether a generation report (`<key>.report.json`) exists. */
  valid: boolean;
  /** Distinct anomaly `kind`s from the report (empty when there's no report, or none were found). */
  anomalies: string[];
  status: ReviewStatus;
}

/** GET /local/api/generated */
export interface GeneratedResponse {
  items: GeneratedEntry[];
  total: number;
}

/** GET /local/api/status/<key> */
export interface StatusResponse {
  key: string;
  cache: FileInfo;
  generated: FileInfo;
  report: FileInfo;
  playbooks: PlaybookFile[];
  /** The scorecard-merged copy of the cache course that Generate prefers when present. */
  input: FileInfo;
  /** Course centre from the generated JSON (or the cache file), for proximity-ranked searches. */
  center: { lat: number; lng: number } | null;
  /** Provenance tags of an attached scorecard, from the generated JSON (or the input copy). */
  scorecard: { source: string; id: string } | null;
  /** Open items in the course's `checks` section (generated JSON, else the input copy). */
  checksOpen: number;
  jobs: { generate: JobView; export: JobView };
  paths: { runDir: string; courseJson: string; inputJson: string; playbookDir: string };
}
