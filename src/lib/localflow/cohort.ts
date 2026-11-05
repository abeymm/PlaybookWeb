// cohort.ts — pure logic over Scripts/regions/us/osm_cohort.json (written by osm_cohort.py):
// parse the course records and search them by name for the /local course picker.
//
// The cohort file is the local answer to "which OSM courses are centerline-ready": `tier`
// is `full` when EVERY hole has an OSM centerline (the pipeline's input requirement) and
// `none` otherwise. No filesystem access here — the route handler loads the file.

export interface CohortEntry {
  /** OSM cache key, e.g. "relation-14236725" (the cache file is `<courseKey>.json`). */
  courseKey: string;
  name: string;
  state: string | null;
  holeCount: number;
  /** Holes that carry an OSM centerline (`n_cl_holes`). */
  centerlineHoles: number;
  tier: "full" | "none";
  /** Flagged by the cohort scanner: a bad centerline point that would crash generation. */
  malformed: boolean;
  /** Set when the cohort scanner marked this record as a split-off fragment of another course
   *  (`anomalies.fragmentOf`, the other course's key). */
  fragmentOf: string | null;
  /** Exclusion reasons from the cohort scanner (`anomalies.exclude`), e.g. "fragment-of-course",
   *  "no-naip-coverage". Empty when the record isn't excluded from anything. */
  exclude: string[];
}

interface RawCohortCourse {
  courseKey?: unknown;
  name?: unknown;
  state?: unknown;
  holeCount?: unknown;
  n_cl_holes?: unknown;
  tier?: unknown;
  malformed?: unknown;
  anomalies?: unknown;
}

/** Parse the cohort file's JSON object into entries; records without a key or name are skipped. */
export function parseCohort(raw: unknown): CohortEntry[] {
  const courses = (raw as { courses?: unknown } | null)?.courses;
  if (!Array.isArray(courses)) {
    throw new Error("cohort file has no `courses` list");
  }
  const out: CohortEntry[] = [];
  for (const rec of courses as RawCohortCourse[]) {
    if (typeof rec?.courseKey !== "string" || typeof rec.name !== "string") continue;
    const anomalies = rec.anomalies as { fragmentOf?: unknown; exclude?: unknown } | null | undefined;
    const exclude = Array.isArray(anomalies?.exclude)
      ? anomalies.exclude.filter((x): x is string => typeof x === "string")
      : [];
    out.push({
      courseKey: rec.courseKey,
      name: rec.name,
      state: typeof rec.state === "string" ? rec.state : null,
      holeCount: typeof rec.holeCount === "number" ? rec.holeCount : 0,
      centerlineHoles: typeof rec.n_cl_holes === "number" ? rec.n_cl_holes : 0,
      tier: rec.tier === "full" ? "full" : "none",
      malformed: rec.malformed === true,
      fragmentOf: typeof anomalies?.fragmentOf === "string" ? anomalies.fragmentOf : null,
      exclude,
    });
  }
  return out;
}

/**
 * Case-insensitive name search: every whitespace-separated token of `query` must occur in the
 * name, or the query must equal a courseKey. Centerline-ready (`full`) courses rank first,
 * then by name. A blank query returns nothing.
 */
export function searchCohort(entries: CohortEntry[], query: string, limit = 20): CohortEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const hits = entries.filter((e) => {
    if (e.courseKey.toLowerCase() === q) return true;
    const name = e.name.toLowerCase();
    return tokens.every((t) => name.includes(t));
  });
  hits.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === "full" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return hits.slice(0, limit);
}
