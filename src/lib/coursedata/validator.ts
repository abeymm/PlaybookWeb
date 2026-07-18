// validator.ts — client-side preflight validator.
//
// A faithful TypeScript mirror of the structured validator:
//   Training/segformer_green/golfapi_pipeline/validate_coursedata.py
// Produces the SAME canonical findings {level, code, path, msg} and the SAME finding CODES.
// Parity semantics (Addendum item 4): identical sets of (level, code, path) tuples at each
// level — NOT byte-identical messages.
//
// This is a SAVE PREFLIGHT ONLY (E10 / spec): it blocks the staging upload on any error-level
// finding so the round-trip fails fast, but the editor Lambda re-runs the authoritative
// validation server-side and remains the gate. Warnings (open-ring, non-contiguous holes) never
// block (R5).

import type { ValidationFinding } from "./types";

const RECOGNIZED_GOLF_TAGS = new Set([
  "hole",
  "green",
  "tee",
  "fairway",
  "rough",
  "bunker",
  "water",
  "water_hazard",
  "course",
  "tree",
]);

// --- predicates (mirror validate_coursedata.py:21-36) ---
const isNum = (v: unknown): v is number => typeof v === "number";
const isFinite_ = (v: unknown): v is number => isNum(v) && Number.isFinite(v);
const isLat = (v: unknown): boolean => isFinite_(v) && v >= -90 && v <= 90;
const isLng = (v: unknown): boolean => isFinite_(v) && v >= -180 && v <= 180;
const isStr = (v: unknown): v is string => typeof v === "string";
const isNonEmptyStr = (v: unknown): boolean => isStr(v) && v.trim() !== "";
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isInt = (v: unknown): boolean => typeof v === "number" && Number.isInteger(v);
const isHoleNumber = (v: unknown): boolean => isInt(v) && (v as number) >= 1;
const isPar = (v: unknown): boolean => isInt(v) && (v as number) >= 3 && (v as number) <= 6;
const isCacheVersion = (v: unknown): boolean => isStr(v) || isNum(v);
const isList = (v: unknown): v is unknown[] => Array.isArray(v);
const isDict = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isDictStrStr = (v: unknown): boolean =>
  isDict(v) && Object.entries(v).every(([k, x]) => typeof k === "string" && typeof x === "string");
const isListOfStr = (v: unknown): boolean => isList(v) && v.every((x) => typeof x === "string");
const isPointPair = (p: unknown): p is number[] =>
  Array.isArray(p) && p.length === 2 && isNum(p[0]) && isNum(p[1]);

type Spec = [string, (v: unknown) => boolean, string, string];
const f = (key: string, pred: (v: unknown) => boolean, desc: string, code = "bad-type"): Spec => [
  key,
  pred,
  desc,
  code,
];

const COURSE_REQUIRED: Spec[] = [
  f("osmId", isNonEmptyStr, "a non-empty str"),
  f("name", isNonEmptyStr, "a non-empty str"),
  f("latitude", isLat, "a float in -90..90", "lat-out-of-range"),
  f("longitude", isLng, "a float in -180..180", "lng-out-of-range"),
  f("tags", isDictStrStr, "a dict of str->str"),
];
const COURSE_OPTIONAL: Spec[] = [
  f("holeCount", isInt, "an int"),
  f("holes", isList, "a list"),
  f("features", isList, "a list"),
  f("needsHoleSelection", isBool, "a bool"),
  f("cacheVersion", isCacheVersion, "a str or number"),
];
const HOLE_REQUIRED: Spec[] = [
  f("id", isStr, "a str"),
  f("osmId", isStr, "a str"),
  f("courseId", isStr, "a str"),
  f("holeNumber", isHoleNumber, "an int >= 1", "bad-hole-number"),
  f("par", isPar, "a sensible int in 3..6", "bad-par"),
  f("tags", isDictStrStr, "a dict of str->str"),
  f("featureIds", isListOfStr, "a list of str"),
  f("teeIds", isListOfStr, "a list of str"),
  f("greenIds", isListOfStr, "a list of str"),
  f("fairwayIds", isListOfStr, "a list of str"),
  f("hasData", isBool, "a bool"),
];
const HOLE_OPTIONAL: Spec[] = [
  f("name", isStr, "a str"),
  f("centerlineId", isStr, "a str"),
  f("teeClassifications", isDict, "a dict"),
  f("length", isNum, "a number"),
];

const repr = (v: unknown): string => {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

class F {
  findings: ValidationFinding[] = [];
  err(path: string, msg: string, code: string) {
    this.findings.push({ level: "error", code, path, msg });
  }
  warn(path: string, msg: string, code: string) {
    this.findings.push({ level: "warning", code, path, msg });
  }
}

function checkRequired(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  F_: F,
  pred: (v: unknown) => boolean,
  typeDesc: string,
  code = "bad-type"
): unknown {
  if (!(key in obj)) {
    F_.err(`${path}.${key}`, "missing required field", "missing-required-field");
    return undefined;
  }
  const val = obj[key];
  if (!pred(val)) {
    F_.err(`${path}.${key}`, `must be ${typeDesc}, got ${repr(val)}`, code);
    return undefined;
  }
  return val;
}

function checkOptional(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  F_: F,
  pred: (v: unknown) => boolean,
  typeDesc: string,
  code = "bad-type"
): void {
  if (key in obj && obj[key] != null && !pred(obj[key])) {
    F_.err(`${path}.${key}`, `must be ${typeDesc}, got ${repr(obj[key])}`, code);
  }
}

function applyRequired(
  obj: Record<string, unknown>,
  specs: Spec[],
  path: string,
  F_: F
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, pred, desc, code] of specs) out[key] = checkRequired(obj, key, path, F_, pred, desc, code);
  return out;
}
function applyOptional(obj: Record<string, unknown>, specs: Spec[], path: string, F_: F): void {
  for (const [key, pred, desc, code] of specs) checkOptional(obj, key, path, F_, pred, desc, code);
}

function validateLatLng(
  obj: unknown,
  path: string,
  F_: F,
  latKey: "lat" | "latitude",
  lngKey: "lng" | "longitude"
): void {
  const [altLat, altLng] = latKey === "lat" ? ["latitude", "longitude"] : ["lat", "lng"];
  if (Array.isArray(obj))
    return F_.err(path, `must be an object with ${latKey}/${lngKey} keys, got an array`, "coord-not-object");
  if (!isDict(obj)) return F_.err(path, `must be an object, got ${repr(obj)}`, "coord-not-object");
  if (!(latKey in obj) || !(lngKey in obj)) {
    if (altLat in obj && altLng in obj)
      return F_.err(path, `uses ${altLat}/${altLng} keys, expected ${latKey}/${lngKey}`, "coord-key-mismatch");
    return F_.err(path, `missing ${latKey}/${lngKey} keys`, "coord-missing-keys");
  }
  if (!isLat(obj[latKey])) F_.err(`${path}.${latKey}`, `invalid latitude ${repr(obj[latKey])}`, "lat-out-of-range");
  if (!isLng(obj[lngKey])) F_.err(`${path}.${lngKey}`, `invalid longitude ${repr(obj[lngKey])}`, "lng-out-of-range");
}
const validateCoordinate = (obj: unknown, path: string, F_: F) => validateLatLng(obj, path, F_, "lat", "lng");
const validatePositionObj = (obj: unknown, path: string, F_: F) =>
  validateLatLng(obj, path, F_, "latitude", "longitude");

function* iterRings(node: unknown): Generator<unknown[]> {
  if (!Array.isArray(node) || node.length === 0) return;
  if (isPointPair(node[0])) {
    yield node;
    return;
  }
  for (const child of node) if (Array.isArray(child)) yield* iterRings(child);
}

function ringLooksSwappedVsCourse(
  validPts: number[][],
  courseLat: number | undefined,
  courseLng: number | undefined,
  tol = 1.0
): boolean {
  if (validPts.length === 0 || courseLat == null || courseLng == null) return false;
  const near = validPts.filter(([x, y]) => Math.abs(x - courseLat) < tol && Math.abs(y - courseLng) < tol);
  return near.length > validPts.length / 2;
}

function validateBoundary(
  boundary: unknown,
  path: string,
  F_: F,
  courseLat?: number,
  courseLng?: number
): void {
  let ri = 0;
  for (const ring of iterRings(boundary)) {
    const rpath = `${path}.boundary(ring ${ri})`;
    ri++;
    const validPts = ring.filter(isPointPair) as number[][];
    if (ring.length !== validPts.length)
      F_.err(rpath, `${ring.length - validPts.length} point(s) are not numeric [lng,lat] pairs`, "invalid-point-pair");
    for (const pt of validPts)
      if (!(Number.isFinite(pt[0]) && Number.isFinite(pt[1])))
        F_.err(rpath, `non-finite coordinate ${repr(pt)}`, "non-finite-coord");
    if (ring.length < 4) F_.err(rpath, `ring must have >= 4 points, got ${ring.length}`, "ring-too-small");
    if (validPts.length) {
      const swapCount = validPts.filter((p) => Math.abs(p[0]) <= 90 && Math.abs(p[1]) > 90).length;
      const isSwapped = swapCount > validPts.length / 2;
      if (isSwapped) {
        F_.err(rpath, "coordinate order looks like [lat, lng] instead of GeoJSON [lng, lat]", "coord-order-swap");
      } else if (courseLng != null && Math.abs(courseLng) <= 90 && ringLooksSwappedVsCourse(validPts, courseLat, courseLng)) {
        F_.warn(
          rpath,
          "ring coordinate order looks swapped relative to course latitude/longitude (eastern-US heuristic)",
          "coord-order-swap-suspected"
        );
      }
      const first = validPts[0];
      const last = validPts[validPts.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1])
        F_.warn(rpath, "ring is not closed (first point != last point)", "open-ring");
    }
  }
}

function validateFeature(
  feat: unknown,
  ci: number,
  fi: number,
  F_: F,
  strictTags: boolean
): string | null {
  const path = `courses[${ci}].features[${fi}]`;
  if (!isDict(feat)) {
    F_.err(path, "must be an object", "feature-not-object");
    return null;
  }
  const osmId = checkRequired(feat, "osmId", path, F_, isNonEmptyStr, "a non-empty str");
  const tags = (checkRequired(feat, "tags", path, F_, isDictStrStr, "a dict of str->str") as
    | Record<string, string>
    | undefined) ?? {};

  const golf = tags["golf"];
  if (golf == null || !RECOGNIZED_GOLF_TAGS.has(golf)) {
    const reason = golf == null ? "missing" : `unrecognized value ${repr(golf)}`;
    const code = golf == null ? "missing-golf-tag" : "unrecognized-golf-tag";
    const gmsg = `${reason} (not one of ${JSON.stringify([...RECOGNIZED_GOLF_TAGS].sort())})`;
    (strictTags ? F_.err : F_.warn).call(F_, `${path}.tags.golf`, gmsg, code);
  }

  const coords = feat["coordinates"];
  if (coords != null) {
    if (!Array.isArray(coords) || coords.length === 0) {
      F_.err(`${path}.coordinates`, "must be a non-empty list", "coordinates-invalid");
    } else {
      if (golf !== "hole" && coords.length < 3)
        F_.err(`${path}.coordinates`, `polygon feature must have >= 3 points, got ${coords.length}`, "polygon-too-few-points");
      coords.forEach((pt, pi) => validateCoordinate(pt, `${path}.coordinates[${pi}]`, F_));
    }
  }
  if (feat["centroid"] != null) validateCoordinate(feat["centroid"], `${path}.centroid`, F_);
  checkOptional(feat, "hasGeometry", path, F_, isBool, "a bool");
  return isNonEmptyStr(osmId) ? (osmId as string) : null;
}

function validateHole(
  hole: unknown,
  ci: number,
  hi: number,
  featureIds: Set<string>,
  F_: F
): number | null {
  const path = `courses[${ci}].holes[${hi}]`;
  if (!isDict(hole)) {
    F_.err(path, "must be an object", "hole-not-object");
    return null;
  }
  const vals = applyRequired(hole, HOLE_REQUIRED, path, F_);
  applyOptional(hole, HOLE_OPTIONAL, path, F_);

  const cc = hole["centerlineCoordinates"];
  if (cc != null) {
    if (!Array.isArray(cc)) F_.err(`${path}.centerlineCoordinates`, "must be a list", "centerline-invalid");
    else cc.forEach((pt, pi) => validateCoordinate(pt, `${path}.centerlineCoordinates[${pi}]`, F_));
  }
  for (const posKey of ["teePosition", "flagPosition"] as const)
    if (hole[posKey] != null) validatePositionObj(hole[posKey], `${path}.${posKey}`, F_);

  for (const listName of ["featureIds", "teeIds", "greenIds", "fairwayIds"] as const) {
    const idlist = vals[listName];
    if (Array.isArray(idlist))
      for (const fid of idlist)
        if (typeof fid === "string" && !featureIds.has(fid))
          F_.err(
            `${path}.${listName}`,
            `dangling reference ${repr(fid)} — no such feature osmId on this course`,
            "dangling-ref"
          );
  }

  const noFeatureIds = !vals["featureIds"] || (vals["featureIds"] as unknown[]).length === 0;
  const noCenterline = !hole["centerlineCoordinates"] && !hole["centerlineId"];
  if (hole["hasData"] === true && noFeatureIds && noCenterline)
    F_.warn(path, "hasData=true but featureIds is empty and no centerline data present", "hasdata-no-features");

  const holeNumber = vals["holeNumber"];
  return typeof holeNumber === "number" ? holeNumber : null;
}

function validateCourse(course: unknown, ci: number, F_: F, strictTags: boolean): void {
  const path = `courses[${ci}]`;
  if (!isDict(course)) {
    F_.err(path, "must be an object", "course-not-object");
    return;
  }
  applyRequired(course, COURSE_REQUIRED, path, F_);
  applyOptional(course, COURSE_OPTIONAL, path, F_);

  if (course["boundary"] != null) {
    if (!Array.isArray(course["boundary"])) F_.err(`${path}.boundary`, "must be a list", "boundary-invalid");
    else if ((course["boundary"] as unknown[]).length)
      validateBoundary(
        course["boundary"],
        path,
        F_,
        course["latitude"] as number | undefined,
        course["longitude"] as number | undefined
      );
  }

  const features = course["features"];
  const featureIds = new Set<string>();
  if (Array.isArray(features))
    features.forEach((feat, fi) => {
      const fid = validateFeature(feat, ci, fi, F_, strictTags);
      if (fid) featureIds.add(fid);
    });
  if (!features || (Array.isArray(features) && features.length === 0))
    F_.warn(path, "course has 0 features", "empty-course");

  const holes = course["holes"];
  if (Array.isArray(holes)) {
    const holeNumbers = holes
      .map((h, hi) => validateHole(h, ci, hi, featureIds, F_))
      .filter((hn): hn is number => typeof hn === "number");
    if (holeNumbers.length) {
      const uniq = new Set(holeNumbers);
      if (uniq.size !== holeNumbers.length) {
        F_.warn(path, `hole numbers not unique (${JSON.stringify([...holeNumbers].sort((a, b) => a - b))})`, "holes-not-unique");
      } else {
        const expected = new Set(Array.from({ length: holeNumbers.length }, (_, i) => i + 1));
        const same = uniq.size === expected.size && [...uniq].every((n) => expected.has(n));
        if (!same)
          F_.warn(
            path,
            `hole numbers not contiguous 1..N (${JSON.stringify([...holeNumbers].sort((a, b) => a - b))})`,
            "holes-not-contiguous"
          );
      }
    }
  }
}

/**
 * Canonical structured output: [{level,code,path,msg}, ...]. Empty = valid.
 * @param strictTags treat missing/unrecognized tags.golf as an ERROR (R6 pins true for parity).
 */
export function validateCourseData(data: unknown, strictTags = false): ValidationFinding[] {
  const F_ = new F();
  if (!Array.isArray(data)) {
    F_.err("root", "must be a JSON array of course objects ([OSMCourse])", "root-not-array");
    return F_.findings;
  }
  if (data.length < 1) {
    F_.err("root", "must contain at least 1 course", "root-empty");
    return F_.findings;
  }
  data.forEach((course, ci) => validateCourse(course, ci, F_, strictTags));
  return F_.findings;
}

/** Split findings into errors and warnings. */
export function splitFindings(findings: ValidationFinding[]): {
  errors: ValidationFinding[];
  warnings: ValidationFinding[];
} {
  return {
    errors: findings.filter((f_) => f_.level === "error"),
    warnings: findings.filter((f_) => f_.level === "warning"),
  };
}

/** True if any error-level finding is present (blocks save). */
export function hasErrors(findings: ValidationFinding[]): boolean {
  return findings.some((f_) => f_.level === "error");
}
