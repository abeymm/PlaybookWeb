// scorecard.ts — pure mapping from OpenGolfAPI payloads (ODbL) onto the course JSON. No I/O.
//
// Targets two consumers at once:
//   - the app: OSMHole.par / handicap / length (yards) are what CourseHole decodes;
//   - the pipeline: course-level parsMen/indexesMen/tees/rating/slope/measure are passthrough keys
//     (build_coursedata_nosam._COURSE_PASSTHROUGH), so a merge into the INPUT course survives
//     generation and feeds per-tee centerlines; a merge into a GENERATED course is equivalent for
//     the app-facing fields.
// Identity freshness follows the runbook: fill address/phone/website/zipcode/city/state only when
// the course lacks them. Provenance + the ODbL attribution go into `tags` (also a passthrough key).

import type { OSMCourse, OSMHole, ScorecardTeeRecord, CheckItem } from "@/lib/coursedata/types";
import { buildScorecardChecks, mergeChecks, CHECKS_PRODUCER_SCORECARD } from "./checks";

export interface ScorecardCandidate {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  par: number | null;
  type: string | null;
  distanceMi: number | null;
}

export interface ScorecardHole {
  number: number;
  par: number | null;
  handicap: number | null;
  /** Longest tee's yardage for the hole. */
  yards: number | null;
}

export interface Scorecard {
  source: "opengolfapi";
  id: string;
  name: string;
  clubName: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  parTotal: number | null;
  yardage: number | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  postalCode: string | null;
  holes: ScorecardHole[];
  tees: ScorecardTeeRecord[];
  license: string;
  attribution: string;
}

export const OPENGOLFAPI_LICENSE = "ODbL-1.0";
export const OPENGOLFAPI_ATTRIBUTION =
  "© OpenStreetMap contributors (ODbL 1.0) via OpenGolfAPI — https://opengolfapi.org/attribution";

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const int = (v: unknown): number | null => (Number.isInteger(v) ? (v as number) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const isPar = (v: number | null): v is number => v != null && v >= 3 && v <= 6;

/** `GET /courses/search` → candidates (the API already sorts by distance when lat/lng are given). */
export function toCandidates(raw: unknown): ScorecardCandidate[] {
  const list = rec(raw)?.courses;
  if (!Array.isArray(list)) return [];
  const out: ScorecardCandidate[] = [];
  for (const item of list) {
    const c = rec(item);
    const id = str(c?.id);
    if (!c || !id) continue;
    out.push({
      id,
      name: str(c.course_name) ?? str(c.name) ?? id,
      city: str(c.city),
      state: str(c.state),
      lat: num(c.latitude) ?? num(c.lat),
      lng: num(c.longitude) ?? num(c.lng),
      par: int(c.par) ?? int(c.par_total),
      type: str(c.type) ?? str(c.course_type),
      distanceMi: num(c.distance_mi),
    });
  }
  return out;
}

/** Merge the API's per-gender tee records (e.g. "White"/Male + "White"/Female) into one per name. */
function mergeTees(rawTees: unknown, holes: Rec[]): ScorecardTeeRecord[] {
  const byName = new Map<string, ScorecardTeeRecord>();
  if (!Array.isArray(rawTees)) return [];
  const holeNumbers = holes.map((h) => int(h.number)).filter((n): n is number => n != null);
  const maxHole = holeNumbers.length ? Math.max(...holeNumbers) : 0;
  for (const item of rawTees) {
    const t = rec(item);
    const name = t ? str(t.tee_name) : null;
    if (!t || !name) continue;
    const key = name.toLowerCase();
    let tee = byName.get(key);
    if (!tee) {
      const lengths = new Array<number>(maxHole).fill(0);
      for (const h of holes) {
        const n = int(h.number);
        const yards = num(rec(h.yardages)?.[key]);
        if (n != null && n >= 1 && n <= maxHole && yards != null) lengths[n - 1] = Math.round(yards);
      }
      tee = {
        teeId: str(t.tee_key) ?? key,
        name,
        color: str(t.tee_color),
        lengths,
        totalYards: int(t.yardage) ?? lengths.reduce((a, b) => a + b, 0),
        ratingMen: null,
        slopeMen: null,
        ratingWomen: null,
        slopeWomen: null,
      };
      byName.set(key, tee);
    }
    const gender = (str(t.gender) ?? "").toLowerCase();
    if (gender.startsWith("f") || gender.startsWith("w")) {
      tee.ratingWomen = num(t.course_rating);
      tee.slopeWomen = num(t.slope);
    } else {
      tee.ratingMen = num(t.course_rating);
      tee.slopeMen = num(t.slope);
    }
  }
  return [...byName.values()].sort((a, b) => b.totalYards - a.totalYards);
}

/** `GET /courses/{id}` (CourseDetail) → a normalized scorecard. Throws when it has no hole data. */
export function normalizeScorecard(raw: unknown): Scorecard {
  const d = rec(raw);
  const id = d ? str(d.id) : null;
  const holesRaw = d?.holes_data ?? rec(d?.holes)?.holes; // detail, or the /holes envelope
  if (!d || !id) throw new Error("OpenGolfAPI course detail has no id");
  if (!Array.isArray(holesRaw) || holesRaw.length === 0) throw new Error(`OpenGolfAPI course ${id} has no holes_data`);
  const holeRecs = holesRaw.map(rec).filter((h): h is Rec => h != null);
  const holes: ScorecardHole[] = holeRecs
    .map((h) => {
      const yardages = rec(h.yardages) ?? {};
      const yards = Object.values(yardages).map(num).filter((y): y is number => y != null && y > 0);
      return {
        number: int(h.number) ?? 0,
        par: int(h.par),
        handicap: int(h.handicap_index) ?? int(h.handicap),
        yards: yards.length ? Math.max(...yards) : null,
      };
    })
    .filter((h) => h.number >= 1)
    .sort((a, b) => a.number - b.number);
  return {
    source: "opengolfapi",
    id,
    name: str(d.course_name) ?? str(d.name) ?? id,
    clubName: str(d.club_name),
    city: str(d.city),
    state: str(d.state),
    lat: num(d.lat) ?? num(d.latitude),
    lng: num(d.lng) ?? num(d.longitude),
    parTotal: int(d.par) ?? int(d.par_total),
    yardage: int(d.yardage) ?? int(d.total_yardage),
    phone: str(d.phone),
    website: str(d.website),
    address: str(d.address),
    postalCode: str(d.postal_code),
    holes,
    tees: mergeTees(d.tees, holeRecs),
    license: OPENGOLFAPI_LICENSE,
    attribution: OPENGOLFAPI_ATTRIBUTION,
  };
}

export interface ScorecardQuality {
  /** Every hole carries the same par — a filler card (e.g. all 4s summing to the total). */
  placeholderPars: boolean;
  hasHandicaps: boolean;
  teeCount: number;
  /** Hole records beyond the course's hole count (27-hole facilities, duplicated nines). */
  extraHoles: number;
  warnings: string[];
}

/** Data-quality facts about a card, relative to a course with `courseHoleCount` holes. */
export function assessScorecard(sc: Scorecard, courseHoleCount: number): ScorecardQuality {
  const pars = sc.holes.map((h) => h.par).filter(isPar);
  const placeholderPars = sc.holes.length >= 9 && pars.length === sc.holes.length && new Set(pars).size === 1;
  const hasHandicaps = sc.holes.some((h) => h.handicap != null);
  const extraHoles = Math.max(0, sc.holes.filter((h) => h.number > courseHoleCount).length);
  const warnings: string[] = [];
  if (placeholderPars) warnings.push(`per-hole pars are all ${pars[0]} — placeholder card; existing pars are kept`);
  if (!hasHandicaps) warnings.push("no handicap indexes");
  if (sc.tees.length <= 1) warnings.push(`${sc.tees.length} tee${sc.tees.length === 1 ? "" : "s"} only`);
  if (extraHoles) warnings.push(`${extraHoles} hole record(s) beyond the course's ${courseHoleCount} holes are ignored`);
  return { placeholderPars, hasHandicaps, teeCount: sc.tees.length, extraHoles, warnings };
}

export interface ApplyResult {
  course: OSMCourse;
  /** Human-readable list of what changed (empty when the course already matched). */
  changes: string[];
  /** Scorecard holes with no course hole, course holes with no scorecard hole, quality warnings. */
  skipped: string[];
  /** Items written into `course.checks` by this merge (open ones only). */
  checks: CheckItem[];
}

/**
 * Apply a scorecard to a course — CROSS-CHECK semantics: missing/invalid values are filled from the
 * card, existing values are never overwritten; every disagreement, every fill, and a per-hole
 * distance check land in `course.checks` for a later verification step. Course-level passthrough
 * keys (parsMen/indexesMen/tees/rating/slope) and identity fills as before.
 */
export function applyScorecard(course: OSMCourse, sc: Scorecard): ApplyResult {
  const changes: string[] = [];
  const skipped: string[] = [];
  const byNumber = new Map(sc.holes.map((h) => [h.number, h]));
  const seen = new Set<number>();
  const quality = assessScorecard(sc, course.holes.length);

  const holes: OSMHole[] = course.holes.map((h) => {
    const s = byNumber.get(h.holeNumber);
    if (!s) {
      skipped.push(`course hole ${h.holeNumber} has no scorecard hole`);
      return h;
    }
    seen.add(h.holeNumber);
    const next: OSMHole = { ...h };
    // Fill only: a missing/invalid par takes the card's (a flat card gives the runbook's default 4);
    // a valid par that disagrees is left alone and recorded as a check.
    if (isPar(s.par) && !isPar(h.par)) {
      changes.push(`hole ${h.holeNumber}: par ${h.par} → ${s.par}${quality.placeholderPars ? " (placeholder card)" : ""}`);
      next.par = s.par;
    }
    if (s.handicap != null && s.handicap >= 1 && s.handicap <= 18 && h.handicap == null) {
      changes.push(`hole ${h.holeNumber}: handicap — → ${s.handicap}`);
      next.handicap = s.handicap;
    }
    if (s.yards != null && s.yards > 0 && !(h.length != null && h.length > 0)) {
      changes.push(`hole ${h.holeNumber}: length — → ${s.yards} yd`);
      next.length = s.yards;
    }
    return next;
  });
  for (const s of sc.holes) if (!seen.has(s.number)) skipped.push(`scorecard hole ${s.number} has no course hole`);

  const next: OSMCourse = { ...course, holes };
  const matched = holes.filter((h) => seen.has(h.holeNumber)).sort((a, b) => a.holeNumber - b.holeNumber);
  if (matched.length && matched.every((h) => isPar(h.par))) {
    next.parsMen = matched.map((h) => h.par);
  }
  if (matched.length && matched.every((h) => h.handicap != null)) {
    next.indexesMen = matched.map((h) => h.handicap as number);
  }
  skipped.push(...quality.warnings);
  if (sc.tees.length) {
    next.tees = sc.tees;
    next.measure = "y";
    const rated = sc.tees.filter((t) => t.ratingMen != null);
    const rep = rated.length ? rated.reduce((a, b) => (b.totalYards > a.totalYards ? b : a)) : null;
    next.rating = rep?.ratingMen ?? null;
    next.slope = rep?.slopeMen != null ? Math.round(rep.slopeMen) : null;
    changes.push(`tees: ${sc.tees.length} attached${rep ? ` · rating/slope ${rep.ratingMen}/${next.slope} (${rep.name})` : ""}`);
  }

  // Identity fill: only where the course has nothing (the runbook's field-level rule).
  const fill: Array<[keyof OSMCourse, string | null]> = [
    ["address", sc.address], ["phone", sc.phone], ["website", sc.website],
    ["zipcode", sc.postalCode], ["city", sc.city], ["state", sc.state],
  ];
  for (const [field, value] of fill) {
    if (value && !str(course[field])) {
      (next as unknown as Rec)[field] = value;
      changes.push(`${field}: filled from scorecard`);
    }
  }

  next.tags = {
    ...course.tags,
    "scorecard:source": sc.source,
    "scorecard:id": sc.id,
    "scorecard:license": sc.license,
    "scorecard:attribution": sc.attribution,
  };

  // Record filled pars as items to verify, then everything the comparison raises.
  const now = new Date().toISOString();
  const filled: CheckItem[] = holes.flatMap((h, idx) => {
    const before = course.holes[idx];
    if (before.par === h.par || !isPar(h.par)) return [];
    return [{
      id: `par-filled:holes[${idx}].par`, kind: "par-filled", path: `holes[${idx}].par`, severity: "info" as const,
      status: "open" as const, msg: `hole ${h.holeNumber}: par ${before.par} was missing — filled with ${h.par} from the scorecard`,
      current: h.par, candidates: [{ source: sc.source, id: sc.id, value: h.par }],
      evidence: ["scorecard:course-website"], createdAt: now, createdBy: CHECKS_PRODUCER_SCORECARD,
    }];
  });
  const raised = [...filled, ...buildScorecardChecks(next, sc, quality, now)];
  next.checks = mergeChecks(course.checks, raised, CHECKS_PRODUCER_SCORECARD);
  const checks = next.checks.items.filter((i) => i.status === "open" && i.createdBy === CHECKS_PRODUCER_SCORECARD);
  return { course: next, changes, skipped, checks };
}

/** Great-circle distance in miles. */
export function haversineMi(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
