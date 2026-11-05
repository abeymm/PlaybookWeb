import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { centerlineYards, buildScorecardChecks, mergeChecks, openChecks } from "../checks";
import { normalizeScorecard, assessScorecard } from "../scorecard";
import type { OSMCourse, OSMHole, ChecksSection } from "@/lib/coursedata/types";

const DETAIL = JSON.parse(readFileSync(path.join(__dirname, "fixtures", "opengolfapi_crosswater.json"), "utf8"));
const sc = normalizeScorecard(DETAIL);
const quality = assessScorecard(sc, 18);

// A north-south centerline: 0.001° of latitude ≈ 111.2 m ≈ 121.6 yd per point step.
function hole(n: number, par: number, steps = 3): OSMHole {
  return {
    id: `h${n}`, osmId: `way/${n}`, courseId: "relation/1", holeNumber: n, par, tags: {},
    centerlineCoordinates: [...Array(steps + 1)].map((_, i) => ({ lat: 43.85 + i * 0.001, lng: -121.45 })),
    featureIds: [], teeIds: [], greenIds: [], fairwayIds: [], hasData: true,
  };
}
function course(pars: number[], stepsPerHole = 3): OSMCourse {
  return {
    osmId: "relation/14236725", name: "Crosswater Golf Course", latitude: 43.85, longitude: -121.45,
    tags: {}, holes: pars.map((p, i) => hole(i + 1, p, stepsPerHole)), features: [], phone: "+1 541-593-4402",
  };
}

describe("centerlineYards", () => {
  it("measures the polyline in yards", () => {
    expect(centerlineYards(hole(1, 4, 3))).toBeGreaterThan(360);
    expect(centerlineYards(hole(1, 4, 3))).toBeLessThan(370);
    expect(centerlineYards({ ...hole(1, 4), centerlineCoordinates: [] })).toBe(0);
  });
});

describe("buildScorecardChecks", () => {
  it("raises a par-disagreement with current, candidate, and evidence — and never for a placeholder card", () => {
    const items = buildScorecardChecks(course(new Array(18).fill(4)), sc, quality, "2026-09-10T00:00:00Z");
    const dis = items.filter((i) => i.kind === "par-disagreement");
    expect(dis.map((i) => i.path)).toContain("holes[1].par"); // hole 2 is a par 5 on the card
    expect(dis[0]).toMatchObject({ severity: "warning", status: "open", current: 4, createdAt: "2026-09-10T00:00:00Z" });
    expect(dis[0].candidates).toEqual([{ source: "opengolfapi", id: sc.id, value: 5 }]);
    expect(dis[0].evidence).toContain("scorecard:course-website");
    const flat = { ...quality, placeholderPars: true };
    expect(buildScorecardChecks(course(new Array(18).fill(4)), sc, flat).some((i) => i.kind === "par-disagreement")).toBe(false);
    expect(buildScorecardChecks(course(new Array(18).fill(4)), sc, flat).some((i) => i.kind === "par-placeholder-card")).toBe(true);
  });
  it("flags card yardage that is far from the drawn centerline, in either direction", () => {
    // Every drawn hole is ~365 yd; Crosswater's card ranges 171..687 yd, so long and short holes both trip.
    const items = buildScorecardChecks(course(sc.holes.map((h) => h.par as number)), sc, quality);
    const yd = items.filter((i) => i.kind === "yardage-vs-centerline");
    expect(yd.length).toBeGreaterThan(5);
    const long = yd.find((i) => i.path === "holes[11].length")!; // hole 12: 687 yd on the card
    expect(long.msg).toMatch(/dogleg/);
    expect(long.current).toBeGreaterThan(300);
    const short = yd.find((i) => i.path === "holes[12].length")!; // hole 13: 171 yd
    expect(short.msg).toMatch(/shorter/);
    // A hole whose card length matches the drawn line is not flagged.
    const ok = items.find((i) => i.kind === "yardage-vs-centerline" && i.path === "holes[0].length"); // 386 vs ~365 → within 15%
    expect(ok).toBeUndefined();
  });
  it("raises total-par-mismatch, hole-count-mismatch, and identity disagreements", () => {
    const c = course(new Array(18).fill(4)); // 72 — matches Crosswater's 72, so no total mismatch by itself
    c.holes.push(hole(19, 4));               // 19×4 = 76 ≠ 72
    c.phone = "+1 541-555-0100";             // digits differ from the card's 15415934402
    const items = buildScorecardChecks(c, sc, quality);
    expect(items.some((i) => i.kind === "hole-count-mismatch")).toBe(true);
    expect(items.some((i) => i.kind === "total-par-mismatch")).toBe(true);
    expect(items.filter((i) => i.kind === "identity-disagreement").map((i) => i.path)).toContain("phone");
  });
  it("does not raise identity-disagreement when phone digits match", () => {
    const c = course(new Array(18).fill(4));
    c.phone = "+1 (541) 593-4402";
    const items = buildScorecardChecks(c, sc, quality);
    expect(items.filter((i) => i.kind === "identity-disagreement" && i.path === "phone")).toEqual([]);
  });
});

describe("mergeChecks", () => {
  const fresh = (id: string, msg = "m") => ({
    id, kind: id.split(":")[0], path: id.split(":")[1], severity: "warning" as const, status: "open" as const,
    msg, createdAt: "t", createdBy: "scorecard-merge",
  });
  it("replaces the producer's open items, keeps resolved ones, leaves other producers alone", () => {
    const existing: ChecksSection = {
      version: 1,
      items: [
        { ...fresh("par-disagreement:holes[0].par"), status: "resolved", resolution: "course website confirms 4" },
        fresh("par-disagreement:holes[1].par", "stale"),
        { ...fresh("boundary:course"), createdBy: "boundary-check" },
      ],
    };
    const merged = mergeChecks(existing, [fresh("par-disagreement:holes[0].par", "new"), fresh("par-disagreement:holes[2].par")], "scorecard-merge");
    const ids = merged.items.map((i) => `${i.id}/${i.status}`);
    expect(ids).toContain("par-disagreement:holes[0].par/resolved"); // kept, not reopened
    expect(ids).not.toContain("par-disagreement:holes[1].par/open");  // stale open item dropped
    expect(ids).toContain("par-disagreement:holes[2].par/open");
    expect(ids).toContain("boundary:course/open");                     // other producer untouched
    expect(openChecks(merged)).toHaveLength(2);
  });
});
