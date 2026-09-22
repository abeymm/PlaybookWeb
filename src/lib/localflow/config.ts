// config.ts — SERVER-ONLY paths and gates for the /local flow (never import from a client
// component). Everything runs on this Mac against the sibling repos:
//
//   <root>/Scripts/regions/us/{osm_cohort.json,cache/}   course picker + pipeline input
//   <root>/Training/segformer_green/golfapi_pipeline     make_coursedata.py (+ ../.venv)
//   <root>/iOS                                           the archive export tool (test target)
//   <OUT_ROOT>/coursedata_<key>/                         run dir — the runbook's convention
//
// `<root>` defaults to the parent of the Web checkout; override with PLAYBOOK_ROOT.

import path from "node:path";

/** The flow is only reachable under `next dev` (or LOCAL_FLOW=1); hosted builds 404. */
export function isLocalFlowEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.LOCAL_FLOW === "1";
}

export const PLAYBOOK_ROOT = process.env.PLAYBOOK_ROOT ?? path.resolve(process.cwd(), "..");
export const OUT_ROOT = process.env.LOCAL_FLOW_OUT_ROOT ?? "/tmp";

export const LOCAL_PATHS = {
  cohortFile: path.join(PLAYBOOK_ROOT, "Scripts/regions/us/osm_cohort.json"),
  cacheDir: path.join(PLAYBOOK_ROOT, "Scripts/regions/us/cache"),
  pipelineDir: path.join(PLAYBOOK_ROOT, "Training/segformer_green/golfapi_pipeline"),
  python: path.join(PLAYBOOK_ROOT, "Training/.venv/bin/python"),
  iosDir: path.join(PLAYBOOK_ROOT, "iOS"),
} as const;

/** OSM cache keys: `way-123`, `relation-123`, and split sub-courses like `relation-1-hole1-2`. */
const COURSE_KEY_RE = /^[a-z]+-[0-9]+[A-Za-z0-9-]*$/;

export function isValidCourseKey(key: string): boolean {
  return COURSE_KEY_RE.test(key) && !key.includes("..");
}

export function runDir(key: string): string {
  return path.join(OUT_ROOT, `coursedata_${key}`);
}
export function cacheJsonPath(key: string): string {
  return path.join(LOCAL_PATHS.cacheDir, `${key}.json`);
}
export function courseJsonPath(key: string): string {
  return path.join(runDir(key), "cache", `${key}.json`);
}
/** The scorecard-merged copy of the OSM cache course; Generate prefers it when present. */
export function inputDir(key: string): string {
  return path.join(runDir(key), "input");
}
export function inputJsonPath(key: string): string {
  return path.join(inputDir(key), `${key}.json`);
}
export function reportJsonPath(key: string): string {
  return path.join(runDir(key), "cache", `${key}.report.json`);
}
export function playbookDir(key: string): string {
  return path.join(runDir(key), "playbook");
}
export function generateLogPath(key: string): string {
  return path.join(runDir(key), "generate.log");
}
export function exportLogPath(key: string): string {
  return path.join(runDir(key), "export.log");
}
