import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { toCandidates, normalizeScorecard, applyScorecard, assessScorecard, haversineMi } from "../scorecard";
import type { OSMCourse, OSMHole } from "@/lib/coursedata/types";

// Fixtures: trimmed live responses for Crosswater (OpenGolfAPI 3.6.1, 2026-09-09).
const fx = (name: string) => JSON.parse(readFileSync(path.join(__dirname, "fixtures", name), "utf8"));
const DETAIL = fx("opengolfapi_crosswater.json");
const SEARCH = fx("opengolfapi_search_crosswater.json");

function hole(n: number, par: number): OSMHole {
  return {
    id: `h${n}`, osmId: `way/${n}`, courseId: "relation/1", holeNumber: n, par, tags: {},
    featureIds: [], teeIds: [], greenIds: [], fairwayIds: [], hasData: true,
  };
}
function course(pars: number[]): OSMCourse {
  return {
    osmId: "relation/14236725", name: "Crosswater Golf Course", latitude: 43.85, longitude: -121.45,
    tags: { leisure: "golf_course" }, holes: pars.map((p, i) => hole(i + 1, p)), features: [],
    website: "https://example.test",
  };
}

describe("toCandidates", () => {
  it("maps the search envelope to candidates", () => {
    const c = toCandidates(SEARCH);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({
      id: "c48d3cf2-481d-4dde-9207-484122088ea9",
      name: "Crosswater At Sunriver Resort",
      city: "Sunriver", state: "OR", par: 72,
    });
    expect(c[0].lat).toBeCloseTo(43.8528, 3);
  });
  it("is empty for anything that is not a search envelope", () => {
    expect(toCandidates(null)).toEqual([]);
    expect(toCandidates({ courses: "nope" })).toEqual([]);
  });
});

describe("normalizeScorecard", () => {
  const sc = normalizeScorecard(DETAIL);
  it("reads 18 holes in order with par, handicap index, and the longest tee's yards", () => {
    expect(sc.holes).toHaveLength(18);
    expect(sc.holes.map((h) => h.number)).toEqual([...Array(18)].map((_, i) => i + 1));
    expect(sc.holes.reduce((a, h) => a + (h.par ?? 0), 0)).toBe(72);
    expect(sc.parTotal).toBe(72);
    expect(sc.holes[0]).toEqual({ number: 1, par: 4, handicap: 11, yards: 386 }); // Championship tee
  });
  it("merges per-gender tee records by name and fills per-hole lengths from the yardage keys", () => {
    const names = sc.tees.map((t) => t.name);
    expect(names).toHaveLength(7); // 9 API records → 7 names (White and Red carry both genders)
    const white = sc.tees.find((t) => t.name === "White")!;
    expect(white.ratingMen).not.toBeNull();
    expect(white.ratingWomen).not.toBeNull();
    const black = sc.tees.find((t) => t.name === "Black")!;
    expect(black.lengths[0]).toBe(371);
    expect(sc.tees.find((t) => t.name === "Championship")!.lengths[0]).toBe(386);
    expect(black.lengths).toHaveLength(18);
    expect(sc.tees[0].name).toBe("Championship"); // sorted longest first
    expect(sc.tees[0].totalYards).toBe(7683);
  });
  it("keeps identity fields and the ODbL attribution", () => {
    expect(sc.id).toBe("c48d3cf2-481d-4dde-9207-484122088ea9");
    expect(sc.phone).toBe("15415934402");
    expect(sc.postalCode).toBe("97770");
    expect(sc.license).toBe("ODbL-1.0");
    expect(sc.attribution).toMatch(/OpenGolfAPI/);
  });
  it("rejects a payload without holes", () => {
    expect(() => normalizeScorecard({ id: "x" })).toThrow(/holes_data/);
    expect(() => normalizeScorecard({})).toThrow(/no id/);
  });
});

describe("applyScorecard", () => {
  const sc = normalizeScorecard(DETAIL);
  it("sets par, handicap and length on every matched hole and records the changes", () => {
    const { course: next, changes, skipped } = applyScorecard(course(new Array(18).fill(0)), sc);
    expect(next.holes.map((h) => h.par)).toEqual(sc.holes.map((h) => h.par));
    expect(next.holes[0].handicap).toBe(11);
    expect(next.holes[0].length).toBe(386);
    expect(changes.filter((c) => c.startsWith("hole 1:"))).toHaveLength(3);
    expect(skipped.filter((x) => /no (scorecard|course) hole/.test(x))).toEqual([]);
  });
  it("never overwrites a valid par that disagrees — it records a check instead", () => {
    const { course: next, checks } = applyScorecard(course(new Array(18).fill(4)), sc);
    expect(next.holes.every((h) => h.par === 4)).toBe(true);
    const dis = checks.filter((c) => c.kind === "par-disagreement");
    expect(dis).toHaveLength(sc.holes.filter((h) => h.par !== 4).length); // Crosswater: 8 non-par-4 holes
    expect(dis[0]).toMatchObject({ status: "open", severity: "warning", current: 4, createdBy: "scorecard-merge" });
    expect(dis[0].candidates?.[0]).toMatchObject({ source: "opengolfapi", value: expect.any(Number) });
    expect(next.checks?.items.length).toBeGreaterThanOrEqual(dis.length);
    expect(checks.some((c) => c.kind === "total-par-mismatch")).toBe(false); // 18×4 = 72 equals the card's 72
  });
  it("adds the pipeline passthrough keys and the representative rating/slope", () => {
    const { course: next } = applyScorecard(course(new Array(18).fill(4)), sc);
    expect(next.parsMen).toHaveLength(18);
    expect(next.parsMen!.reduce((a, b) => a + b, 0)).toBe(72);
    expect(next.indexesMen).toHaveLength(18);
    expect(next.tees).toHaveLength(7);
    expect(next.measure).toBe("y");
    expect(next.rating).toBe(76.5);
    expect(next.slope).toBe(145);
    expect(next.tags["scorecard:source"]).toBe("opengolfapi");
    expect(next.tags["scorecard:license"]).toBe("ODbL-1.0");
  });
  it("does not report unchanged pars and skips holes the scorecard lacks", () => {
    const c = course(sc.holes.map((h) => h.par as number));
    c.holes.push(hole(19, 4));
    const { course: next, changes, skipped } = applyScorecard(c, sc);
    expect(changes.some((x) => /par/.test(x))).toBe(false);
    expect(skipped.filter((x) => /no (scorecard|course) hole/.test(x))).toEqual(["course hole 19 has no scorecard hole"]);
    expect(next.holes[18].par).toBe(4);
  });
  it("fills identity fields only where the course has none", () => {
    const { course: next, changes } = applyScorecard(course(new Array(18).fill(4)), sc);
    expect(next.phone).toBe("15415934402"); // was absent → filled
    expect(next.website).toBe("https://example.test"); // present → untouched
    expect(changes).toContain("phone: filled from scorecard");
    expect(changes.some((x) => x.startsWith("website"))).toBe(false);
  });
  it("leaves the input course object untouched", () => {
    const c = course(new Array(18).fill(0));
    applyScorecard(c, sc);
    expect(c.holes[0].par).toBe(0);
    expect(c.parsMen).toBeUndefined();
  });
});

describe("haversineMi", () => {
  it("Crosswater to Meadows is about 1.5 miles", () => {
    const d = haversineMi({ lat: 43.8535, lng: -121.4470 }, { lat: 43.8735, lng: -121.4390 });
    expect(d).toBeGreaterThan(1.2);
    expect(d).toBeLessThan(1.8);
  });
});

describe("placeholder cards (Woodlands at Sunriver: total 72 but a flat 4 on every hole)", () => {
  const flat = normalizeScorecard({
    id: "flat-1", course_name: "Woodlands Golf Course", par: 72,
    tees: [{ tee_key: "c", tee_name: "Championship", gender: "Male", course_rating: 73, slope: 131, yardage: 6880 }],
    holes_data: [...Array(18)].map((_, i) => ({ number: i + 1, par: 4, handicap_index: null, yardages: { championship: 300 + i } })),
  });
  const osmPars = [5, 4, 4, 4, 3, 5, 3, 4, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4];

  it("is detected as a placeholder card with no handicaps and one tee", () => {
    const q = assessScorecard(flat, 18);
    expect(q.placeholderPars).toBe(true);
    expect(q.hasHandicaps).toBe(false);
    expect(q.teeCount).toBe(1);
    expect(q.warnings.join(" ")).toMatch(/placeholder/);
  });
  it("keeps the course's real pars, still applies lengths and tees", () => {
    const { course: next, changes } = applyScorecard(course(osmPars), flat);
    expect(next.holes.map((h) => h.par)).toEqual(osmPars);
    expect(changes.some((c) => / par /.test(c))).toBe(false);
    expect(next.holes[0].length).toBe(300);
    expect(next.tees).toHaveLength(1);
    expect(next.parsMen).toEqual(osmPars); // arrays reflect the merged course, not the card
  });
  it("still fills holes whose par is missing (0) — the runbook's default-4 behaviour", () => {
    const { course: next, changes } = applyScorecard(course(new Array(18).fill(0)), flat);
    expect(next.holes.every((h) => h.par === 4)).toBe(true);
    expect(changes.filter((c) => /placeholder card/.test(c))).toHaveLength(18);
  });
  it("ignores hole records beyond the course and builds parsMen from matched holes only", () => {
    const card27 = normalizeScorecard({
      ...JSON.parse(JSON.stringify(DETAIL)),
      holes_data: [...DETAIL.holes_data, ...[...Array(9)].map((_, i) => ({ number: 19 + i, par: 4, handicap_index: null, yardages: {} }))],
    });
    const q = assessScorecard(card27, 18);
    expect(q.extraHoles).toBe(9);
    const { course: next } = applyScorecard(course(new Array(18).fill(0)), card27);
    expect(next.parsMen).toHaveLength(18);
    expect(next.indexesMen).toHaveLength(18);
  });
});
