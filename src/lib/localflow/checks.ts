// checks.ts — pure producers for the course's `checks` section: instead of overwriting data on a
// disagreement, the scorecard merge records what needs verifying, with the current value, the
// candidate and its source, and the kinds of evidence that would settle it. A later step (distance
// checks, a scorecard from the course website, …) resolves items; ids are stable per (kind, path)
// so re-running a producer refreshes its open items and leaves resolved/dismissed ones alone.

import type { Coordinate, OSMCourse, OSMHole, CheckItem, ChecksSection } from "@/lib/coursedata/types";
import type { Scorecard, ScorecardQuality } from "./scorecard";

export const CHECKS_PRODUCER_SCORECARD = "scorecard-merge";
/** A card yardage this far from the centerline length (relative AND absolute) is flagged. */
export const YARDAGE_TOLERANCE_RATIO = 0.15;
export const YARDAGE_TOLERANCE_YARDS = 25;

const M_TO_YD = 1.0936133;
const isPar = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 3 && (v as number) <= 6;

function haversineM(a: Coordinate, b: Coordinate): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Length of a hole's centerline polyline in yards (0 when it has fewer than 2 points). */
export function centerlineYards(hole: OSMHole): number {
  const pts = hole.centerlineCoordinates ?? [];
  let m = 0;
  for (let i = 1; i < pts.length; i++) m += haversineM(pts[i - 1], pts[i]);
  return Math.round(m * M_TO_YD);
}

function item(
  kind: string, path: string, severity: CheckItem["severity"], msg: string,
  extra: Partial<Pick<CheckItem, "current" | "candidates" | "evidence">>, now: string,
): CheckItem {
  return { id: `${kind}:${path}`, kind, path, severity, status: "open", msg, ...extra, createdAt: now, createdBy: CHECKS_PRODUCER_SCORECARD };
}

const digits = (s: string | undefined) => (s ?? "").replace(/\D+/g, "");
const host = (s: string | undefined) => {
  try {
    return new URL((s ?? "").startsWith("http") ? (s ?? "") : `https://${s ?? ""}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
const norm = (s: string | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Checks raised by comparing a (post-fill) course with a scorecard. Assumes `course` is the merged
 * result: filled values are reported as `par-filled` (verify), disagreements as `*-disagreement`
 * (not applied), and every hole gets the distance check against its centerline.
 */
export function buildScorecardChecks(
  course: OSMCourse, sc: Scorecard, quality: ScorecardQuality, now = new Date().toISOString(),
): CheckItem[] {
  const out: CheckItem[] = [];
  const cand = (value: unknown) => [{ source: sc.source, id: sc.id, value }];
  const byNumber = new Map(sc.holes.map((h) => [h.number, h]));

  if (quality.placeholderPars) {
    out.push(item("par-placeholder-card", "course", "info",
      "scorecard's per-hole pars are a flat placeholder — course pars were not compared against it",
      { candidates: cand(sc.holes.map((h) => h.par)), evidence: ["scorecard:course-website", "scorecard:other-db"] }, now));
  }
  if (!quality.hasHandicaps) {
    out.push(item("handicap-missing", "course", "info", "scorecard carries no handicap indexes",
      { evidence: ["scorecard:course-website"] }, now));
  }
  if (sc.holes.length !== course.holes.length) {
    out.push(item("hole-count-mismatch", "course", "warning",
      `scorecard has ${sc.holes.length} hole records, course has ${course.holes.length}`,
      { current: course.holes.length, candidates: cand(sc.holes.length), evidence: ["scorecard:course-website", "osm:hole-ways"] }, now));
  }

  const sortedHoles = [...course.holes].sort((a, b) => a.holeNumber - b.holeNumber);
  sortedHoles.forEach((h) => {
    const idx = course.holes.indexOf(h);
    const s = byNumber.get(h.holeNumber);
    if (!s) return;
    const parPath = `holes[${idx}].par`;
    if (isPar(s.par) && isPar(h.par) && s.par !== h.par && !quality.placeholderPars) {
      out.push(item("par-disagreement", parPath, "warning",
        `hole ${h.holeNumber}: course par ${h.par}, scorecard par ${s.par}`,
        { current: h.par, candidates: cand(s.par), evidence: ["scorecard:course-website", "distance:centerline-vs-par"] }, now));
    }
    if (s.handicap != null && h.handicap != null && s.handicap !== h.handicap) {
      out.push(item("handicap-disagreement", `holes[${idx}].handicap`, "info",
        `hole ${h.holeNumber}: course handicap ${h.handicap}, scorecard ${s.handicap}`,
        { current: h.handicap, candidates: cand(s.handicap), evidence: ["scorecard:course-website"] }, now));
    }
    const cl = centerlineYards(h);
    if (cl > 0 && s.yards != null && s.yards > 0) {
      const diff = Math.abs(s.yards - cl);
      if (diff > YARDAGE_TOLERANCE_YARDS && diff / cl > YARDAGE_TOLERANCE_RATIO) {
        const shorter = s.yards < cl;
        out.push(item("yardage-vs-centerline", `holes[${idx}].length`, "warning",
          `hole ${h.holeNumber}: scorecard ${s.yards} yd vs centerline ${cl} yd (${shorter ? "card shorter than the drawn line" : "card longer — dogleg or a different tee?"})`,
          { current: cl, candidates: cand(s.yards), evidence: ["distance:centerline", "centerline:dogleg-review", "scorecard:course-website"] }, now));
      }
    }
  });

  const mergedPars = sortedHoles.map((h) => h.par);
  if (sc.parTotal != null && mergedPars.every(isPar)) {
    const total = mergedPars.reduce((a, b) => a + b, 0);
    if (total !== sc.parTotal) {
      out.push(item("total-par-mismatch", "course", "warning",
        `course pars sum to ${total}, scorecard total is ${sc.parTotal}`,
        { current: total, candidates: cand(sc.parTotal), evidence: ["scorecard:course-website"] }, now));
    }
  }

  if (sc.phone && course.phone && digits(sc.phone) !== digits(course.phone)) {
    out.push(item("identity-disagreement", "phone", "info", `course phone ${course.phone}, scorecard ${sc.phone}`,
      { current: course.phone, candidates: cand(sc.phone), evidence: ["course-website"] }, now));
  }
  if (sc.website && course.website && host(sc.website) !== host(course.website)) {
    out.push(item("identity-disagreement", "website", "info", `course website ${course.website}, scorecard ${sc.website}`,
      { current: course.website, candidates: cand(sc.website), evidence: ["course-website"] }, now));
  }
  if (sc.name && norm(sc.name) !== norm(course.name) && !norm(sc.name).includes(norm(course.name).replace(/ golf (course|club)$/, ""))) {
    out.push(item("identity-disagreement", "name", "info", `course name "${course.name}", scorecard "${sc.name}"`,
      { current: course.name, candidates: cand(sc.name), evidence: ["course-website", "osm:name"] }, now));
  }
  return out;
}

/**
 * Merge a producer's fresh items into an existing section: the producer's OPEN items are replaced
 * wholesale (stale ones drop out), items already resolved/dismissed keep their status, and other
 * producers' items are untouched.
 */
export function mergeChecks(existing: ChecksSection | undefined, fresh: CheckItem[], producer: string): ChecksSection {
  const kept = (existing?.items ?? []).filter((i) => !(i.status === "open" && i.createdBy === producer));
  const byId = new Map(kept.map((i) => [i.id, i]));
  for (const f of fresh) {
    const prev = byId.get(f.id);
    if (prev && prev.status !== "open") continue;
    byId.set(f.id, f);
  }
  return { version: 1, items: [...byId.values()] };
}

export function openChecks(section: ChecksSection | undefined): CheckItem[] {
  return (section?.items ?? []).filter((i) => i.status === "open");
}
