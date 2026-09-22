import { describe, it, expect } from "vitest";
import { parseCohort, searchCohort, type CohortEntry } from "../cohort";

// Shape of Scripts/regions/us/osm_cohort.json (osm_cohort.py, 2026-08-01): a dict with
// `courses: [{name, state, holeCount, n_holes, n_cl_holes, ..., tier, malformed, courseKey,
// anomalies: {..., exclude, fragmentOf}}]`.
const RAW = {
  cache: "/x/cache",
  generatedAt: "2026-08-01T07:51:12Z",
  tiers: 2,
  courses: [
    { name: "Crosswater Golf Course", state: null, holeCount: 18, n_holes: 18, n_cl_holes: 18,
      n_cl3_holes: 15, n_tee_holes: 18, n_flag_holes: 18, n_par_holes: 18, tier: "full",
      malformed: false, courseKey: "relation-14236725" },
    { name: "Presidio Golf Course", state: "CA", holeCount: 18, n_holes: 18, n_cl_holes: 18,
      n_cl3_holes: 16, n_tee_holes: 18, n_flag_holes: 18, n_par_holes: 18, tier: "full",
      malformed: false, courseKey: "way-16650363" },
    { name: "Crossings Golf Club", state: "TX", holeCount: 9, n_holes: 0, n_cl_holes: 0,
      n_cl3_holes: 0, n_tee_holes: 0, n_flag_holes: 0, n_par_holes: 0, tier: "none",
      malformed: false, courseKey: "way-99" },
    { name: "Water Valley Golf", state: "OR", holeCount: 18, n_holes: 18, n_cl_holes: 18,
      n_cl3_holes: 18, n_tee_holes: 18, n_flag_holes: 18, n_par_holes: 18, tier: "full",
      malformed: true, courseKey: "way-7" },
  ],
};

describe("parseCohort", () => {
  it("maps the cohort file's course records to entries", () => {
    const entries = parseCohort(RAW);
    expect(entries).toHaveLength(4);
    expect(entries[0]).toEqual<CohortEntry>({
      courseKey: "relation-14236725",
      name: "Crosswater Golf Course",
      state: null,
      holeCount: 18,
      centerlineHoles: 18,
      tier: "full",
      malformed: false,
      fragmentOf: null,
      exclude: [],
    });
  });

  it("rejects input without a courses list", () => {
    expect(() => parseCohort({ nope: [] })).toThrow(/courses/);
    expect(() => parseCohort(null)).toThrow(/courses/);
  });

  it("skips records with no courseKey or name rather than crashing", () => {
    const entries = parseCohort({ courses: [{ name: "x" }, { courseKey: "way-1" }, RAW.courses[1]] });
    expect(entries.map((e) => e.courseKey)).toEqual(["way-16650363"]);
  });

  it("defaults fragmentOf/exclude when the record has no `anomalies` object", () => {
    const entries = parseCohort({ courses: [RAW.courses[1]] });
    expect(entries[0].fragmentOf).toBeNull();
    expect(entries[0].exclude).toEqual([]);
  });

  it("reads fragmentOf and exclude from anomalies", () => {
    const entries = parseCohort({
      courses: [
        {
          name: "Par 3", state: null, holeCount: 9, courseKey: "relation-11015543-hole1-727824872", tier: "full",
          malformed: false,
          anomalies: { exclude: ["fragment-of-course"], fragmentOf: "relation-11015584" },
        },
      ],
    });
    expect(entries[0].fragmentOf).toBe("relation-11015584");
    expect(entries[0].exclude).toEqual(["fragment-of-course"]);
  });

  it("ignores a malformed anomalies object rather than crashing", () => {
    const entries = parseCohort({
      courses: [
        { name: "x", courseKey: "way-1", anomalies: { exclude: "not-an-array", fragmentOf: 42 } },
        { name: "y", courseKey: "way-2", anomalies: null },
      ],
    });
    expect(entries).toEqual([
      expect.objectContaining({ courseKey: "way-1", fragmentOf: null, exclude: [] }),
      expect.objectContaining({ courseKey: "way-2", fragmentOf: null, exclude: [] }),
    ]);
  });
});

describe("searchCohort", () => {
  const entries = parseCohort(RAW);

  it("matches case-insensitively on any word of the name", () => {
    const hits = searchCohort(entries, "crosswater");
    expect(hits.map((h) => h.courseKey)).toEqual(["relation-14236725"]);
  });

  it("requires every query token to appear in the name", () => {
    expect(searchCohort(entries, "cross golf").map((h) => h.name)).toEqual([
      "Crosswater Golf Course",
      "Crossings Golf Club",
    ]);
    expect(searchCohort(entries, "cross valley")).toEqual([]);
  });

  it("matches an exact courseKey too", () => {
    expect(searchCohort(entries, "way-16650363").map((h) => h.name)).toEqual(["Presidio Golf Course"]);
  });

  it("ranks full-tier (centerline-ready) courses before none-tier, then by name", () => {
    const hits = searchCohort(entries, "golf");
    expect(hits.map((h) => h.courseKey)).toEqual([
      "relation-14236725", // full, Crosswater
      "way-16650363",      // full, Presidio
      "way-7",             // full, Water Valley (malformed but still full)
      "way-99",            // none
    ]);
  });

  it("returns nothing for a blank query and honours the limit", () => {
    expect(searchCohort(entries, "   ")).toEqual([]);
    expect(searchCohort(entries, "golf", 2)).toHaveLength(2);
  });
});
