// geo.ts — THE single coordinate-conversion module.
//
// courseData mixes two coordinate conventions and conflating them is the #1 historical
// bug class (memory: "Fairway-model I/O contract" / Step 0E HOUR 2-3):
//   - Feature.coordinates / centroid / Hole.centerlineCoordinates: flat {lat,lng} OBJECTS
//   - Hole.teePosition / flagPosition: {latitude,longitude} OBJECTS
//   - Course.boundary / Hole.primaryCenterline: nested GeoJSON [lng,lat] ARRAYS
// MapLibre/GeoJSON is ALWAYS [lng,lat]. Every map/editor path MUST import from here — no
// ad hoc `[p.lng, p.lat]` inline anywhere else.

import type {
  Coordinate,
  LatLngPosition,
  Boundary,
  GeoJSONGeometry,
} from "./types";

/** A GeoJSON position: [lng, lat]. */
export type LngLat = [number, number];

// --------------------------------------------------------------------------
// Point conversions
// --------------------------------------------------------------------------

/** {lat,lng} object → GeoJSON [lng,lat]. */
export function coordToLngLat(c: Coordinate): LngLat {
  return [c.lng, c.lat];
}

/** GeoJSON [lng,lat] → {lat,lng} object. */
export function lngLatToCoord(p: LngLat | number[]): Coordinate {
  return { lat: p[1], lng: p[0] };
}

/** {latitude,longitude} position → GeoJSON [lng,lat]. */
export function positionToLngLat(p: LatLngPosition): LngLat {
  return [p.longitude, p.latitude];
}

/** GeoJSON [lng,lat] → {latitude,longitude} position. */
export function lngLatToPosition(p: LngLat | number[]): LatLngPosition {
  return { latitude: p[1], longitude: p[0] };
}

// --------------------------------------------------------------------------
// Ring / line conversions
// --------------------------------------------------------------------------

/** Flat {lat,lng}[] → GeoJSON ring [lng,lat][]. */
export function coordsToRing(coords: Coordinate[]): LngLat[] {
  return coords.map(coordToLngLat);
}

/** GeoJSON ring [lng,lat][] → flat {lat,lng}[]. */
export function ringToCoords(ring: Array<LngLat | number[]>): Coordinate[] {
  return ring.map(lngLatToCoord);
}

/** Close a GeoJSON ring (append first point if not already closed). */
export function closeRing(ring: LngLat[]): LngLat[] {
  if (ring.length < 2) return ring;
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  return fx === lx && fy === ly ? ring : [...ring, [fx, fy]];
}

// --------------------------------------------------------------------------
// Boundary (nested, view-only) — flatten to terminal rings for rendering.
// Mirrors validate_coursedata.py:iter_rings — walk down until [num,num] pairs.
// --------------------------------------------------------------------------

function isPointPair(v: unknown): v is number[] {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number"
  );
}

/** Yield every terminal ring ([lng,lat] pairs) found anywhere under a nested boundary node. */
export function boundaryRings(boundary: Boundary | undefined | null): LngLat[][] {
  if (!boundary) return [];
  // GeoJSON geometry object → use its coordinates.
  const node =
    typeof boundary === "object" && !Array.isArray(boundary)
      ? (boundary as GeoJSONGeometry).coordinates
      : boundary;
  const out: LngLat[][] = [];
  const walk = (n: unknown): void => {
    if (!Array.isArray(n) || n.length === 0) return;
    if (isPointPair(n[0])) {
      out.push(n as LngLat[]);
      return;
    }
    for (const child of n) walk(child);
  };
  walk(node);
  return out;
}

// --------------------------------------------------------------------------
// Validation guards (swapped-order detection) — used by the editor + tests.
// --------------------------------------------------------------------------

/**
 * True if a [lng,lat] ring looks swapped (magnitude heuristic, mirrors
 * validate_coursedata.py:169): >half the points have |x|<=90 AND |y|>90, i.e. the
 * array is really [lat,lng]. Blind for |lng|<=90 (eastern-US) — see ringLooksSwappedVsCourse.
 */
export function ringLooksSwapped(ring: Array<LngLat | number[]>): boolean {
  const valid = ring.filter(isPointPair);
  if (valid.length === 0) return false;
  const swapped = valid.filter((p) => Math.abs(p[0]) <= 90 && Math.abs(p[1]) > 90);
  return swapped.length > valid.length / 2;
}

/**
 * Reference-based swap check (E6, mirrors validate_coursedata.py:_ring_looks_swapped_vs_course).
 * True when ring x-values cluster near course.latitude AND y-values near course.longitude —
 * catches swaps the magnitude heuristic misses when |lng|<=90.
 */
export function ringLooksSwappedVsCourse(
  ring: Array<LngLat | number[]>,
  courseLat: number,
  courseLng: number,
  tol = 1.0
): boolean {
  const valid = ring.filter(isPointPair);
  if (valid.length === 0) return false;
  const near = valid.filter(
    (p) => Math.abs(p[0] - courseLat) < tol && Math.abs(p[1] - courseLng) < tol
  );
  return near.length > valid.length / 2;
}

// --------------------------------------------------------------------------
// Bounds — fit-to-hole / fit-to-course.
// --------------------------------------------------------------------------

/** A [[minLng,minLat],[maxLng,maxLat]] bbox for MapLibre fitBounds, or null if empty. */
export type Bbox = [[number, number], [number, number]];

/** Accumulate a bbox over any number of [lng,lat] points. */
export function bboxOfLngLats(points: Array<LngLat | number[]>): Bbox | null {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  let n = 0;
  for (const p of points) {
    if (!isPointPair(p)) continue;
    const [lng, lat] = p;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
    n++;
  }
  if (n === 0) return null;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/** Merge two bboxes (either may be null). */
export function mergeBbox(a: Bbox | null, b: Bbox | null): Bbox | null {
  if (!a) return b;
  if (!b) return a;
  return [
    [Math.min(a[0][0], b[0][0]), Math.min(a[0][1], b[0][1])],
    [Math.max(a[1][0], b[1][0]), Math.max(a[1][1], b[1][1])],
  ];
}

// --------------------------------------------------------------------------
// courseKey ⇄ osmId (T5) — ONE definition shared by every path. Mirrors the resolver's
// inline `osmId.replace(/\//g,'-')` (appsync-handler.ts:288) and cache-manager's reverse
// regex (cache-manager.ts:424). Do not re-inline these anywhere.
// --------------------------------------------------------------------------

/** "way/16650363" → "way-16650363" (the mlgen/S3 courseKey). */
export function courseKeyFor(osmId: string): string {
  return osmId.replace(/\//g, "-");
}

/** "way-16650363" → "way/16650363" (only the leading type token is un-dashed; suffixes survive). */
export function osmIdFromKey(courseKey: string): string {
  return courseKey.replace(/^(way|relation|node)-(\d+)/, "$1/$2");
}
