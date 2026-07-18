// edit.ts — PURE reducers for editor mutations.
//
// Every function takes a course and returns a NEW course (inputs untouched — immutability per
// coding-style rules). They keep the per-hole id lists consistent, which is the invariant the
// validator's dangling-ref / class checks depend on:
//   featureIds  = ALL features on the hole
//   teeIds/greenIds/fairwayIds = the tee/green/fairway SUBSET of featureIds (by tags.golf class)
// bunker/water/rough/tree live only in featureIds (no dedicated class list — matches the fixture).
//
// class change rewrites tags.golf via FEATURE_TAGS (iOS decodes tags.golf, not the top-level
// golfFeatureType string — coursedata_common.py docstring).

import type { OSMCourse, OSMHole, OSMFeature, Coordinate, FeatureClass } from "./types";
import { tagsForClass, classFromTags } from "./featureTags";
import { courseKeyFor, coordsToRing } from "./geo";

const clone = <T>(v: T): T =>
  typeof structuredClone === "function" ? structuredClone(v) : (JSON.parse(JSON.stringify(v)) as T);

/** Which per-hole class-list a feature class belongs to (null = featureIds only). */
export function classListKey(cls: FeatureClass | null): "teeIds" | "greenIds" | "fairwayIds" | null {
  if (cls === "tee") return "teeIds";
  if (cls === "green") return "greenIds";
  if (cls === "fairway") return "fairwayIds";
  return null;
}

/** Vertex-mean centroid (matches coursedata_common.py ring_centroid). */
export function centroidOf(coords: Coordinate[]): Coordinate | undefined {
  if (!coords.length) return undefined;
  const n = coords.length;
  return {
    lat: coords.reduce((s, c) => s + c.lat, 0) / n,
    lng: coords.reduce((s, c) => s + c.lng, 0) / n,
  };
}

function featuresById(course: OSMCourse): Map<string, OSMFeature> {
  return new Map(course.features.map((f) => [f.osmId, f]));
}

/** Recompute teeIds/greenIds/fairwayIds for a hole from its featureIds + feature classes. */
function rebuildHoleClassLists(hole: OSMHole, byId: Map<string, OSMFeature>): void {
  const tee: string[] = [];
  const green: string[] = [];
  const fairway: string[] = [];
  for (const fid of hole.featureIds) {
    const cls = classFromTags(byId.get(fid)?.tags);
    if (cls === "tee") tee.push(fid);
    else if (cls === "green") green.push(fid);
    else if (cls === "fairway") fairway.push(fid);
  }
  hole.teeIds = tee;
  hole.greenIds = green;
  hole.fairwayIds = fairway;
}

function findHole(course: OSMCourse, holeNumber: number): OSMHole | undefined {
  return course.holes.find((h) => h.holeNumber === holeNumber);
}

// --------------------------------------------------------------------------
// Class change
// --------------------------------------------------------------------------

/** Change a feature's class: rewrite tags.golf + surfaceType/golfFeatureType, resync hole lists. */
export function changeFeatureClass(
  course: OSMCourse,
  featureOsmId: string,
  newClass: FeatureClass
): OSMCourse {
  const next = clone(course);
  const feat = next.features.find((f) => f.osmId === featureOsmId);
  if (!feat) return next;
  feat.tags = tagsForClass(newClass, feat.tags);
  feat.surfaceType = newClass;
  feat.golfFeatureType = FEATURE_GOLF_TYPE[newClass];
  const byId = featuresById(next);
  for (const hole of next.holes)
    if (hole.featureIds.includes(featureOsmId)) rebuildHoleClassLists(hole, byId);
  return next;
}

// tags.golf value → golfFeatureType string (kept for consumers that still read it).
const FEATURE_GOLF_TYPE: Record<FeatureClass, string> = {
  green: "green",
  tee: "tee",
  bunker: "bunker",
  water: "water_hazard",
  fairway: "fairway",
  rough: "rough",
  tree: "tree",
};

// --------------------------------------------------------------------------
// Assign / unassign / reassign feature ↔ hole
// --------------------------------------------------------------------------

/** Add a feature to a hole (featureIds + matching class list). No-op if already assigned. */
export function assignFeatureToHole(
  course: OSMCourse,
  featureOsmId: string,
  holeNumber: number
): OSMCourse {
  const next = clone(course);
  const hole = findHole(next, holeNumber);
  if (!hole) return next;
  if (!hole.featureIds.includes(featureOsmId)) hole.featureIds = [...hole.featureIds, featureOsmId];
  rebuildHoleClassLists(hole, featuresById(next));
  return next;
}

/** Remove a feature from a hole (featureIds + every class list). */
export function unassignFeatureFromHole(
  course: OSMCourse,
  featureOsmId: string,
  holeNumber: number
): OSMCourse {
  const next = clone(course);
  const hole = findHole(next, holeNumber);
  if (!hole) return next;
  hole.featureIds = hole.featureIds.filter((id) => id !== featureOsmId);
  rebuildHoleClassLists(hole, featuresById(next));
  return next;
}

/** Move a feature from one hole to another (unassign then assign), keeping all id lists consistent. */
export function reassignFeatureToHole(
  course: OSMCourse,
  featureOsmId: string,
  fromHoleNumber: number,
  toHoleNumber: number
): OSMCourse {
  return assignFeatureToHole(
    unassignFeatureFromHole(course, featureOsmId, fromHoleNumber),
    featureOsmId,
    toHoleNumber
  );
}

// --------------------------------------------------------------------------
// Delete
// --------------------------------------------------------------------------

/** Delete a feature from the course AND from every hole's id lists (no dangling refs). */
export function deleteFeature(course: OSMCourse, featureOsmId: string): OSMCourse {
  const next = clone(course);
  next.features = next.features.filter((f) => f.osmId !== featureOsmId);
  for (const hole of next.holes) {
    if (hole.featureIds.includes(featureOsmId))
      hole.featureIds = hole.featureIds.filter((id) => id !== featureOsmId);
    hole.teeIds = hole.teeIds.filter((id) => id !== featureOsmId);
    hole.greenIds = hole.greenIds.filter((id) => id !== featureOsmId);
    hole.fairwayIds = hole.fairwayIds.filter((id) => id !== featureOsmId);
  }
  return next;
}

// --------------------------------------------------------------------------
// Geometry
// --------------------------------------------------------------------------

/** Replace a feature's ring (flat {lat,lng}[]) and recompute its centroid. */
export function updateFeatureGeometry(
  course: OSMCourse,
  featureOsmId: string,
  coords: Coordinate[]
): OSMCourse {
  const next = clone(course);
  const feat = next.features.find((f) => f.osmId === featureOsmId);
  if (!feat) return next;
  feat.coordinates = coords;
  feat.centroid = centroidOf(coords);
  return next;
}

/** Generate a unique feature id for a newly drawn feature. */
export function newFeatureId(course: OSMCourse, cls: FeatureClass): string {
  const key = courseKeyFor(course.osmId);
  const existing = new Set(course.features.map((f) => f.osmId));
  let i = 0;
  let id = `mlgen:${key}:manual:${cls}:${i}`;
  while (existing.has(id)) {
    i++;
    id = `mlgen:${key}:manual:${cls}:${i}`;
  }
  return id;
}

/** Add a newly drawn feature (optionally assigned to a hole). */
export function addFeature(
  course: OSMCourse,
  cls: FeatureClass,
  coords: Coordinate[],
  holeNumber?: number
): { course: OSMCourse; featureOsmId: string } {
  const next = clone(course);
  const featureOsmId = newFeatureId(next, cls);
  const feat: OSMFeature = {
    osmId: featureOsmId,
    tags: tagsForClass(cls),
    coordinates: coords,
    centroid: centroidOf(coords),
    surfaceType: cls,
    golfFeatureType: FEATURE_GOLF_TYPE[cls],
    hasGeometry: true,
    sourceKind: "manual",
  };
  next.features = [...next.features, feat];
  const withAssign =
    holeNumber != null ? assignFeatureToHole(next, featureOsmId, holeNumber) : next;
  return { course: withAssign, featureOsmId };
}

// --------------------------------------------------------------------------
// Centerline
// --------------------------------------------------------------------------

/** Replace a hole's primary centerline (updates both centerlineCoordinates and primaryCenterline). */
export function setHoleCenterline(
  course: OSMCourse,
  holeNumber: number,
  coords: Coordinate[]
): OSMCourse {
  const next = clone(course);
  const hole = findHole(next, holeNumber);
  if (!hole) return next;
  hole.centerlineCoordinates = coords;
  hole.primaryCenterline = { type: "LineString", coordinates: coordsToRing(coords) };
  return next;
}

/** Replace one per-tee centerline's points (by index in hole.centerlines). */
export function setPerTeeCenterline(
  course: OSMCourse,
  holeNumber: number,
  teeIndex: number,
  coords: Coordinate[]
): OSMCourse {
  const next = clone(course);
  const hole = findHole(next, holeNumber);
  if (!hole || !hole.centerlines || !hole.centerlines[teeIndex]) return next;
  hole.centerlines[teeIndex] = { ...hole.centerlines[teeIndex], coordinates: coords };
  return next;
}
