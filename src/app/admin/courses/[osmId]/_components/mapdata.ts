// mapdata.ts — build GeoJSON for the map from course data. All coordinate conversion goes
// through geo.ts (never inline [lng,lat] here).

import type { OSMCourse, OSMHole, OSMFeature, FeatureClass } from "@/lib/coursedata/types";
import { classFromTags } from "@/lib/coursedata/featureTags";
import {
  coordsToRing,
  closeRing,
  boundaryRings,
  bboxOfLngLats,
  mergeBbox,
  type Bbox,
  type LngLat,
} from "@/lib/coursedata/geo";

export interface HoleFeatureGeo {
  fid: string;
  cls: FeatureClass;
  ring: LngLat[];
}

export function featuresById(course: OSMCourse): Map<string, OSMFeature> {
  return new Map(course.features.map((f) => [f.osmId, f]));
}

export function holeByNumber(course: OSMCourse, holeNumber: number): OSMHole | undefined {
  return course.holes.find((h) => h.holeNumber === holeNumber);
}

/** Geo for every feature referenced by a hole (skips features with no/degenerate geometry). */
export function holeFeatureGeos(course: OSMCourse, hole: OSMHole | undefined): HoleFeatureGeo[] {
  if (!hole) return [];
  const byId = featuresById(course);
  const out: HoleFeatureGeo[] = [];
  for (const fid of hole.featureIds) {
    const feat = byId.get(fid);
    const cls = classFromTags(feat?.tags);
    if (!feat?.coordinates || feat.coordinates.length < 3 || !cls) continue;
    out.push({ fid, cls, ring: closeRing(coordsToRing(feat.coordinates)) });
  }
  return out;
}

/** GeoJSON polygon FeatureCollection for a set of hole features (props: fid, cls). */
export function toPolygonFC(geos: HoleFeatureGeo[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: geos.map((g) => ({
      type: "Feature",
      properties: { fid: g.fid, cls: g.cls },
      geometry: { type: "Polygon", coordinates: [g.ring] },
    })),
  };
}

/** Primary + per-tee centerlines for a hole as a LineString FC (props: kind = primary|tee). */
export function centerlineFC(hole: OSMHole | undefined): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  if (hole?.centerlineCoordinates && hole.centerlineCoordinates.length > 1) {
    features.push({
      type: "Feature",
      properties: { kind: "primary" },
      geometry: { type: "LineString", coordinates: coordsToRing(hole.centerlineCoordinates) },
    });
  }
  for (const ct of hole?.centerlines ?? []) {
    if (ct.coordinates && ct.coordinates.length > 1)
      features.push({
        type: "Feature",
        properties: { kind: "tee", teeId: ct.teeId ?? "" },
        geometry: { type: "LineString", coordinates: coordsToRing(ct.coordinates) },
      });
  }
  return { type: "FeatureCollection", features };
}

/** View-only boundary rings as a LineString FC. */
export function boundaryFC(course: OSMCourse): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: boundaryRings(course.boundary).map((ring) => ({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: ring },
    })),
  };
}

/** Bbox over a hole's features + centerline (fit-to-hole). */
export function holeBbox(geos: HoleFeatureGeo[], centerline: GeoJSON.FeatureCollection): Bbox | null {
  let bbox: Bbox | null = null;
  for (const g of geos) bbox = mergeBbox(bbox, bboxOfLngLats(g.ring));
  for (const f of centerline.features) {
    if (f.geometry.type === "LineString") bbox = mergeBbox(bbox, bboxOfLngLats(f.geometry.coordinates as LngLat[]));
  }
  return bbox;
}

/** Per-class count delta (mlgen − legacy) for a hole. */
export function classCountDelta(
  mlgen: HoleFeatureGeo[],
  legacy: HoleFeatureGeo[]
): Record<string, number> {
  const count = (gs: HoleFeatureGeo[]) => {
    const m: Record<string, number> = {};
    for (const g of gs) m[g.cls] = (m[g.cls] ?? 0) + 1;
    return m;
  };
  const a = count(mlgen);
  const b = count(legacy);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: Record<string, number> = {};
  for (const k of keys) out[k] = (a[k] ?? 0) - (b[k] ?? 0);
  return out;
}
