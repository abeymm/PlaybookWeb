// courseData [OSMCourse] TypeScript contract.
//
// Ported from Backend/amplify/functions/osm-proxy-function/types.ts (the single source
// derived from iOS OSMModelsV2.swift) and extended with the emitter-only fields observed
// in the golden fixture:
//   Training/segformer_green/golfapi_pipeline/fixtures/coursedata_way-16650363_mlgen.json
// Extra emitter fields (areaM2, sourceKind, generator, primaryCenterline) are additive and
// optional — iOS ignores unknown keys; they exist so the dashboard can render/QC them.
//
// COORDINATE CONVENTION (the #1 historical bug class — see geo.ts):
//   - Feature.coordinates / centroid / Hole.centerlineCoordinates use flat {lat,lng} OBJECTS.
//   - Hole.teePosition / flagPosition use {latitude,longitude} OBJECTS.
//   - Course.boundary + Hole.primaryCenterline use nested GeoJSON [lng,lat] ARRAYS.
// Never mix them outside geo.ts.

/** Flattened lat/lng point (iOS Coordinate). */
export interface Coordinate {
  lat: number;
  lng: number;
}

/** Position object used by teePosition / flagPosition (distinct key names from Coordinate). */
export interface LatLngPosition {
  latitude: number;
  longitude: number;
}

/** GeoJSON geometry as emitted for boundary / primaryCenterline (coordinates in [lng,lat]). */
export interface GeoJSONGeometry {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coordinates: any;
}

/** Course boundary: real OSM data nests polygon → rings → [lng,lat] points. View-only (E11). */
export type Boundary = number[][][][] | number[][][] | GeoJSONGeometry;

/** A single course feature (green/tee/bunker/water/fairway/rough/tree). */
export interface OSMFeature {
  osmId: string;
  tags: Record<string, string>;
  /** Single flat ring of {lat,lng} (emitter drops donut holes v1 — E11: fully editable). */
  coordinates?: Coordinate[];
  centroid?: Coordinate;
  surfaceType?: string;
  golfFeatureType?: string;
  ref?: number;
  name?: string;
  hasGeometry?: boolean;
  teeColor?: string;
  teeType?: string;
  // Emitter-only (fixture): planar area (m²) and provenance ("model" | "osm" | ...).
  areaM2?: number;
  sourceKind?: string;
}

/** Per-tee centerline entry (added by the per-tee-centerline pipeline; absent in older fixtures). */
export interface PerTeeCenterline {
  teeId?: string;
  color?: string;
  coordinates: Coordinate[];
}

/** A single hole. */
/** Per-hole elevation grid embedded in courseData (see OSMHole.elevation). */
export interface HoleElevationGrid {
  cellM: number;
  width: number;
  height: number;
  /** Outer north-west corner of cell (0, 0). */
  origin: Coordinate;
  /** Degrees per row (rows run south) / per column (east). */
  latStep: number;
  lngStep: number;
  baseM: number;
  nodata: number;
  /** "int16le-dm,deflate-raw,base64" */
  encoding: string;
  source?: string;
  values: string;
}

export interface OSMHole {
  id: string;
  osmId: string;
  courseId: string;
  holeNumber: number;
  par: number;
  handicap?: number;
  name?: string;
  length?: number;
  tags: Record<string, string>;
  /** Primary centerline as flat {lat,lng} — what iOS consumes. Editable. */
  centerlineCoordinates?: Coordinate[];
  centerlineId?: string;
  /** GeoJSON LineString mirror of centerlineCoordinates ([lng,lat]). Kept in sync on edit. */
  primaryCenterline?: GeoJSONGeometry;
  /** Per-tee centerlines (newer pipeline). */
  centerlines?: PerTeeCenterline[];
  teePosition?: LatLngPosition;
  flagPosition?: LatLngPosition;
  /**
   * Embedded 3DEP elevation over the hole's window (centerline bbox + margin). Row-major int16
   * decimetres above `baseM`, raw DEFLATE, base64; `nodata` marks voids. Cell centres sit at
   * origin + (i + 0.5) * step; consumers sample bilinearly. Written by embed_elevation.py.
   */
  elevation?: HoleElevationGrid;
  featureIds: string[];
  teeIds: string[];
  greenIds: string[];
  fairwayIds: string[];
  teeClassifications?: { [teeId: string]: { color: string; type: string } };
  hasData: boolean;
}

/** One per-tee scorecard record in the pipeline's normalized shape (golfapi_to_course.tees_meta). */
export interface ScorecardTeeRecord {
  teeId: string;
  name: string;
  color: string | null;
  /** Per-hole yards in hole order (0 = unknown). */
  lengths: number[];
  totalYards: number;
  ratingMen: number | null;
  slopeMen: number | null;
  ratingWomen: number | null;
  slopeWomen: number | null;
}

/** A value proposed by an external source for a checked field. */
export interface CheckCandidate {
  source: string;
  /** Source-side identifier (e.g. the OpenGolfAPI course id). */
  id?: string;
  value: unknown;
}

/**
 * One aspect of the course that needs human or tool verification. Written by a producer (e.g. the
 * scorecard merge) instead of silently overwriting data; resolved in a later step with other
 * evidence (distance checks, a scorecard from the course website, …). `id` is stable per
 * (kind, path) so re-runs update open items and keep resolved ones.
 */
export interface CheckItem {
  id: string;
  kind: string;
  /** JSON path within this course object, or "course" for course-level items. */
  path: string;
  severity: "error" | "warning" | "info";
  status: "open" | "resolved" | "dismissed";
  msg: string;
  /** The value currently in the course (as stored, or derived — e.g. centerline yards). */
  current?: unknown;
  candidates?: CheckCandidate[];
  /** Kinds of evidence that would settle this item (free-form tags). */
  evidence?: string[];
  createdAt: string;
  createdBy: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface ChecksSection {
  version: 1;
  items: CheckItem[];
}

/** A full course (root array element). */
export interface OSMCourse {
  osmId: string;
  id?: string;
  name: string;
  holeCount?: number;
  latitude: number;
  longitude: number;
  clubName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  phone?: string;
  website?: string;
  boundary?: Boundary;
  tags: Record<string, string>;
  holes: OSMHole[];
  features: OSMFeature[];
  isSynthetic?: boolean;
  needsHoleSelection?: boolean;
  enhancedAt?: string;
  cacheVersion?: string;
  osmTimestamp?: string;
  osmVersion?: number;
  osmChangeset?: number;
  cacheUrl?: string;
  // Scorecard passthrough keys (build_coursedata_nosam._COURSE_PASSTHROUGH): per-hole par/handicap
  // arrays, per-tee scorecard records, and the representative USGA rating/slope. Populated by the
  // /local OpenGolfAPI merge (localflow/scorecard.ts) or the golfapi.io converter; absent otherwise.
  parsMen?: number[];
  parsWomen?: number[];
  indexesMen?: number[];
  indexesWomen?: number[];
  tees?: ScorecardTeeRecord[];
  rating?: number | null;
  slope?: number | null;
  measure?: string;
  /** Aspects flagged for verification (see CheckItem). Passthrough key in the pipeline. */
  checks?: ChecksSection;
  // Emitter-only (fixture): raw/merged counts by class + source.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generator?: Record<string, any>;
}

/** The root contract is an array of courses. */
export type CourseData = OSMCourse[];

// ---------------------------------------------------------------------------
// AWSCourseIndex row (SPEC shape — see Backend/amplify/data/resource.ts + Addendum §W1).
// Coded against the spec, not generated types (a parallel agent is editing resource.ts).
// New mlgen/review/batch fields are additive; may be null until the schema deploys.
// ---------------------------------------------------------------------------
export type ReviewStatus =
  | "unreviewed"
  | "in_review"
  | "needs_fix"
  | "approved"
  | "rejected";

export interface CourseIndexRow {
  osmId: string;
  name: string;
  latitude: number;
  longitude: number;
  geohashPrefix: string;
  dataTier: string;
  region: string;
  holeCount?: number | null;
  par?: number | null;
  multiCourse?: boolean | null;
  estimatedCourseCount?: number | null;
  hasFairways?: boolean | null;
  hasGreens?: boolean | null;
  hasBunkers?: boolean | null;
  hasWater?: boolean | null;
  website?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipcode?: string | null;
  clubName?: string | null;
  geohash?: string | null;
  osmType?: string | null;
  parentOsmId?: string | null;
  needsHoleSelection?: boolean | null;
  fairwayCount?: number | null;
  greenCount?: number | null;
  teeCount?: number | null;
  bunkerCount?: number | null;
  waterCount?: number | null;
  numberedHolesFound?: number | null;
  totalHolesFound?: number | null;
  lastClassified?: string | null;
  // Additive mlgen/review/batch fields (Spec §W1 + Design Resolutions).
  mlgenAvailable?: boolean | null;
  mlgenServeAll?: boolean | null;
  mlgenVersion?: string | null;
  mlgenGeneratedAt?: string | null;
  reviewStatus?: ReviewStatus | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  qcErrors?: number | null;
  qcWarnings?: number | null;
  apiCourseId?: string | null;
  apiClubId?: string | null;
  batchId?: string | null;
  // Client-side derived (not a schema field): playbook demand count, fetched lazily.
  demandCount?: number | null;
}

/** Canonical structured validator finding (parity with validate_coursedata.py). */
export interface ValidationFinding {
  level: "error" | "warning";
  code: string;
  path: string;
  msg: string;
}

/** saveCourseData verdict returned by the editor Lambda. */
export interface SaveVerdict {
  ok: boolean;
  errors?: ValidationFinding[];
  warnings?: ValidationFinding[];
  s3VersionId?: string;
  etag?: string;
  indexSyncWarning?: boolean;
  // Coded operational failure (DX3): s3-put-failed | etag-conflict | version-conflict |
  // index-update-failed | staging-missing | not-admin | bad-rendition ...
  code?: string;
}

/** One S3 object version (listCourseDataVersions). */
export interface CourseDataVersion {
  versionId: string; // literal "null" for pre-versioning objects (Addendum §6)
  lastModified?: string;
  size?: number;
  etag?: string;
  isLatest?: boolean;
  /**
   * True for an S3 DELETE MARKER, not a stored object: the artifact was deleted, so it has no
   * etag/size and nothing may be restored *to* it. When the latest row is a delete marker the
   * course has no current mlgen object — do not adopt an older version as the base ETag (C14).
   */
  isDeleteMarker?: boolean;
  metadata?: Record<string, string>;
}

/** report.json QC artifact (Spec §W3 / E2). */
export interface QcReport {
  courseKey?: string;
  generatedAt?: string;
  pipelineVersion?: string;
  models?: Record<string, string | null>;
  validator?: { errors?: ValidationFinding[]; warnings?: ValidationFinding[] };
  counts?: Record<string, number>;
  holes?: Array<{ n: number; seconds?: number; flags?: string[] }>;
  centerlineSource?: string;
}

/** courseData class names the dashboard recognizes (iOS-decodable via tags.golf). */
export type FeatureClass =
  | "green"
  | "tee"
  | "bunker"
  | "water"
  | "fairway"
  | "rough"
  | "tree";
