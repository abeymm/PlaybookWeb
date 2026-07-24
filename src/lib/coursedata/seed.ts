// seed.ts — manual course-seeding data model + pure logic for /admin/seed.
//
// A "seed" is a hand-clicked skeleton of a course: per hole, an ordered list of centerline points
// where the FIRST point is the tee and the LAST is the green center. The ML pipeline
// (make_coursedata.py) consumes it to bootstrap a brand-new course that has no OSM/GolfAPI data.
//
// COORDINATE CONVENTION — this file emits the pipeline's exact contract, including a DELIBERATE key
// asymmetry (do NOT normalize):
//   - centerlineCoordinates points use {lat,lng}
//   - teePosition / flagPosition use {latitude,longitude}
// Internally we edit points as {lat,lng} (Coordinate); the mirroring to {latitude,longitude} happens
// only in buildSeedJson. See geo.ts for the wider coordinate discussion.

import type { Coordinate, LatLngPosition, ValidationFinding } from "./types";

// ---------------------------------------------------------------------------
// Editor-state types (internal — points are {lat,lng} Coordinates throughout).
// ---------------------------------------------------------------------------

/** One hole being edited: ordered points (first=tee, last=green), optional par. */
export interface SeedHole {
  holeNumber: number;
  /** 3–6; omitted from output when undefined (user never set it). */
  par?: number;
  /** Ordered centerline points; [0]=tee, [n-1]=green, middle=dogleg waypoints. */
  points: Coordinate[];
}

/** The full editable draft. */
export interface SeedDraft {
  name: string;
  /** lowercase-kebab key stem; the S3 file is seeds/manual-<slug>.json. */
  slug: string;
  holes: SeedHole[];
}

// ---------------------------------------------------------------------------
// Output contract (exact — a parallel Backend agent implements saveCourseSeed).
// ---------------------------------------------------------------------------

/** Centerline point in the seed JSON ({lat,lng} — the asymmetric half). */
export interface SeedCenterlinePoint {
  lat: number;
  lng: number;
}

/** One hole in the seed JSON. par is omitted when unset. */
export interface SeedJsonHole {
  holeNumber: number;
  par?: number;
  centerlineCoordinates: SeedCenterlinePoint[];
  teePosition: LatLngPosition;
  flagPosition: LatLngPosition;
}

/** The seed JSON written to seeds/manual-<slug>.json. */
export interface SeedJson {
  osmId: string;
  name: string;
  latitude: number;
  longitude: number;
  holeCount: number;
  boundary: [];
  tags: { golf: string; source: string };
  holes: SeedJsonHole[];
}

/** Result of the saveCourseSeed mutation (structured findings on failure — DX parity). */
export interface SeedSaveResult {
  ok: boolean;
  key?: string;
  cacheKey?: string;
  findings?: ValidationFinding[];
  error?: string;
}

/** Distance beyond which a hole is flagged as a likely misclick. */
export const FAR_HOLE_METERS = 15_000;

// ---------------------------------------------------------------------------
// slugify — lowercase kebab (a-z0-9-), collapse repeats, trim.
// ---------------------------------------------------------------------------

/** "Pebble Beach (Old)!" → "pebble-beach-old". Returns "" for input with no usable chars. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // any run of non-alphanumerics → single dash
    .replace(/-+/g, "-") // collapse repeats (defensive; the run-collapse above mostly covers it)
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}

/** "manual/pebble-beach" → "pebble-beach"; passthrough if the prefix is absent. */
export function slugFromOsmId(osmId: string): string {
  return osmId.replace(/^manual\//, "");
}

// ---------------------------------------------------------------------------
// buildSeedJson — draft → the exact pipeline contract.
// ---------------------------------------------------------------------------

/**
 * Build the seed JSON. Assumes the draft passes validation (every hole ≥2 points); still guards
 * degenerate holes so it never throws. Emits the deliberate {lat,lng} / {latitude,longitude}
 * asymmetry unchanged.
 */
export function buildSeedJson(draft: SeedDraft): SeedJson {
  const allPoints = draft.holes.flatMap((h) => h.points);
  const centroid = centroidOf(allPoints);

  const holes: SeedJsonHole[] = draft.holes.map((h) => {
    const first = h.points[0];
    const last = h.points[h.points.length - 1];
    const hole: SeedJsonHole = {
      holeNumber: h.holeNumber,
      centerlineCoordinates: h.points.map((p) => ({ lat: p.lat, lng: p.lng })),
      // tee = first point, flag = last point — mirrored into {latitude,longitude}.
      teePosition: { latitude: first?.lat ?? 0, longitude: first?.lng ?? 0 },
      flagPosition: { latitude: last?.lat ?? 0, longitude: last?.lng ?? 0 },
    };
    if (h.par !== undefined) hole.par = h.par; // omit when unset
    return hole;
  });

  return {
    osmId: `manual/${draft.slug}`,
    name: draft.name,
    latitude: centroid.lat,
    longitude: centroid.lng,
    holeCount: draft.holes.length,
    boundary: [],
    tags: { golf: "course", source: "manual-seed" },
    holes,
  };
}

/** Hydrate an editor draft from a previously-saved seed JSON (for the "fix" flow). */
export function draftFromSeed(seed: SeedJson): SeedDraft {
  return {
    name: seed.name,
    slug: slugFromOsmId(seed.osmId),
    holes: seed.holes.map((h) => ({
      holeNumber: h.holeNumber,
      par: h.par,
      points: (h.centerlineCoordinates ?? []).map((c) => ({ lat: c.lat, lng: c.lng })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Validation — mirrors the schema; blocks Save on errors, surfaces warnings inline.
// ---------------------------------------------------------------------------

/** Client-side validation. Errors block Save; warnings are advisory. */
export function validateDraft(draft: SeedDraft): ValidationFinding[] {
  const out: ValidationFinding[] = [];

  if (!draft.name.trim()) {
    out.push({ level: "error", code: "name-required", path: "name", msg: "Course name is required." });
  }
  if (!draft.slug || slugify(draft.slug) !== draft.slug) {
    out.push({
      level: "error",
      code: "slug-invalid",
      path: "slug",
      msg: "Slug must be lowercase kebab-case (a–z, 0–9, single dashes).",
    });
  }
  if (draft.holes.length === 0) {
    out.push({ level: "error", code: "no-holes", path: "holes", msg: "Add at least one hole." });
  }

  draft.holes.forEach((h, i) => {
    if (h.points.length < 2) {
      out.push({
        level: "error",
        code: "hole-min-points",
        path: `holes[${i}]`,
        msg: `Hole ${h.holeNumber} needs at least 2 points (tee + green).`,
      });
    }
  });

  // Duplicate hole numbers — advisory (pipeline tolerates gaps, but duplicates are usually a slip).
  const seen = new Map<number, number>();
  draft.holes.forEach((h) => seen.set(h.holeNumber, (seen.get(h.holeNumber) ?? 0) + 1));
  for (const [num, count] of seen) {
    if (count > 1) {
      out.push({
        level: "warning",
        code: "hole-duplicate-number",
        path: "holes",
        msg: `Hole number ${num} is used ${count} times.`,
      });
    }
  }

  // Far-hole misclick guard: a hole whose centroid is >15 km from the other holes' centroid.
  if (draft.holes.length > 1) {
    draft.holes.forEach((h, i) => {
      if (h.points.length === 0) return;
      const others = draft.holes.filter((_, j) => j !== i).flatMap((o) => o.points);
      if (others.length === 0) return;
      const d = haversineMeters(centroidOf(h.points), centroidOf(others));
      if (d > FAR_HOLE_METERS) {
        out.push({
          level: "warning",
          code: "hole-far",
          path: `holes[${i}]`,
          msg: `Hole ${h.holeNumber} is ${(d / 1000).toFixed(1)} km from the other holes — likely a misclick.`,
        });
      }
    });
  }

  return out;
}

/** True when the draft has no error-level findings (Save is allowed). */
export function isSaveable(draft: SeedDraft): boolean {
  return !validateDraft(draft).some((f) => f.level === "error");
}

// ---------------------------------------------------------------------------
// parseGoToInput — "lat, lng" or "lat lng" pasted from Google/Apple Maps.
// ---------------------------------------------------------------------------

/**
 * Parse a "go to" string into a Coordinate, or null if it is not two in-range numbers.
 * Accepts comma- and/or whitespace-separated pairs (e.g. "37.77, -122.41", "37.77 -122.41").
 */
export function parseGoToInput(input: string): Coordinate | null {
  const tokens = input.trim().split(/[\s,]+/).filter(Boolean);
  if (tokens.length !== 2) return null;
  const lat = Number(tokens[0]);
  const lng = Number(tokens[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

// ---------------------------------------------------------------------------
// Geometry helpers (local — seed-specific; geo.ts has no distance/centroid).
// ---------------------------------------------------------------------------

/** Arithmetic mean of {lat,lng} points; {lat:0,lng:0} for an empty list. */
export function centroidOf(points: Coordinate[]): Coordinate {
  if (points.length === 0) return { lat: 0, lng: 0 };
  let lat = 0;
  let lng = 0;
  for (const p of points) {
    lat += p.lat;
    lng += p.lng;
  }
  return { lat: lat / points.length, lng: lng / points.length };
}

/** Great-circle distance in metres between two {lat,lng} points. */
export function haversineMeters(a: Coordinate, b: Coordinate): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
