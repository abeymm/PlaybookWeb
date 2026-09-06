// api.ts — Amplify data + storage access for the /admin dashboard.
//
// Uses generateClient() with RAW GraphQL document strings (not generated types) because the
// Backend schema is being edited in parallel; the SPEC shapes are the contract:
//   - AWSCourseIndex: list-by-region GSI, list-by-dataTier, full list, get, update
//   - CourseDataJob: list
//   - AWSPlaybook: list-by-courseId (demand count)
//   - osmResolveCourse(osmId, contentVersion)
//   - editor mutations: saveCourseData / listCourseDataVersions / restoreCourseDataVersion /
//     deleteCourseArtifact  (Addendum §2 + DX4 + N2 baseETag)
// Storage: downloadData (course JSON), uploadData (staging key), list, getProperties, and the
// qc-reports report.json.
//
// The auto-generated GraphQL field names below follow Amplify Gen 2 conventions for the schema
// in Backend/amplify/data/resource.ts (verified: pluralize("AWSCourseIndex")="AWSCourseIndices",
// secondary-index query = list<Model>By<PK>And<SK>). If the deployed schema names differ, these
// constants are the single place to change.

"use client";

import { generateClient } from "aws-amplify/api";
import { downloadData, uploadData, list, getProperties } from "aws-amplify/storage";
import type {
  CourseIndexRow,
  CourseDataJobRow,
  CourseData,
  SaveVerdict,
  CourseDataVersion,
  QcReport,
  ValidationFinding,
} from "./types";
import type { SeedJson, SeedSaveResult } from "./seed";
import { courseKeyFor } from "./geo";
import outputs from "../../../amplify_outputs.json";

// ---- generated GraphQL field names (single source to change if schema differs) ----
export const GQL = {
  listByRegion: "listAWSCourseIndexByRegionAndGeohashPrefix",
  listByDataTier: "listAWSCourseIndexByDataTier",
  listAll: "listAWSCourseIndices",
  get: "getAWSCourseIndex",
  update: "updateAWSCourseIndex",
  listJobs: "listCourseDataJobs",
  listPlaybooksByCourse: "listAWSPlaybookByCourseId",
} as const;

// Amplify Gen 2 storage paths.
export const PREFIX = {
  legacy: "public/osm-cache/",
  mlgen: "public/osm-cache-mlgen/",
  staging: "public/osm-cache-mlgen/staging/",
  reports: "qc-reports/",
  seeds: "seeds/",
} as const;

// Narrow the client type to avoid the deep-generic explosion generateClient() infers when no
// Schema type is supplied (we use raw document strings by design — the schema is edited in parallel).
interface RawClient {
  graphql: (opts: {
    query: string;
    variables?: Record<string, unknown>;
    authMode?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) => Promise<{ data?: any; errors?: Array<{ message: string }> }>;
}
let _client: RawClient | null = null;
function client(): RawClient {
  if (!_client) _client = generateClient() as unknown as RawClient;
  return _client;
}

// AWSJSON scalars may come back parsed or as a string depending on version — normalize.
function parseJson<T>(v: unknown): T {
  if (typeof v === "string") return JSON.parse(v) as T;
  return v as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function gql(query: string, variables?: Record<string, unknown>): Promise<any> {
  const res = await client().graphql({ query, variables, authMode: "userPool" });
  if (res.errors?.length) {
    throw new Error(res.errors.map((e) => e.message).join("; "));
  }
  return res.data;
}

// Field selection sets ------------------------------------------------------
const INDEX_FIELDS = `
  osmId name latitude longitude geohashPrefix dataTier region
  holeCount par multiCourse estimatedCourseCount
  hasFairways hasGreens hasBunkers hasWater
  website phone address city state country zipcode clubName geohash osmType parentOsmId needsHoleSelection
  fairwayCount greenCount teeCount bunkerCount waterCount numberedHolesFound totalHolesFound lastClassified
  mlgenAvailable mlgenServeAll mlgenVersion mlgenGeneratedAt
  reviewStatus reviewNote reviewedAt qcErrors qcWarnings apiCourseId apiClubId batchId
`;
const JOB_FIELDS = `id osmId runpodJobId status s3Key error requestedBy options createdAt updatedAt`;

export interface Page<T> {
  items: T[];
  nextToken: string | null;
}

// ---- AWSCourseIndex ----

export async function listByRegion(
  region: string,
  opts: { geohashPrefix?: string; filter?: object; limit?: number; nextToken?: string | null } = {}
): Promise<Page<CourseIndexRow>> {
  const query = `query L($region: String!, $geohashPrefix: ModelStringKeyConditionInput, $filter: ModelAWSCourseIndexFilterInput, $limit: Int, $nextToken: String) {
    ${GQL.listByRegion}(region: $region, geohashPrefix: $geohashPrefix, filter: $filter, limit: $limit, nextToken: $nextToken) {
      items { ${INDEX_FIELDS} } nextToken
    }
  }`;
  const data = await gql(query, {
    region,
    geohashPrefix: opts.geohashPrefix ? { beginsWith: opts.geohashPrefix } : undefined,
    filter: opts.filter,
    limit: opts.limit ?? 200,
    nextToken: opts.nextToken ?? undefined,
  });
  const conn = data[GQL.listByRegion];
  return { items: conn.items as CourseIndexRow[], nextToken: conn.nextToken ?? null };
}

export async function listByDataTier(
  dataTier: string,
  opts: { filter?: object; limit?: number; nextToken?: string | null } = {}
): Promise<Page<CourseIndexRow>> {
  const query = `query L($dataTier: String!, $filter: ModelAWSCourseIndexFilterInput, $limit: Int, $nextToken: String) {
    ${GQL.listByDataTier}(dataTier: $dataTier, filter: $filter, limit: $limit, nextToken: $nextToken) {
      items { ${INDEX_FIELDS} } nextToken
    }
  }`;
  const data = await gql(query, {
    dataTier,
    filter: opts.filter,
    limit: opts.limit ?? 200,
    nextToken: opts.nextToken ?? undefined,
  });
  const conn = data[GQL.listByDataTier];
  return { items: conn.items as CourseIndexRow[], nextToken: conn.nextToken ?? null };
}

export async function listAllCourses(
  opts: { filter?: object; limit?: number; nextToken?: string | null } = {}
): Promise<Page<CourseIndexRow>> {
  const query = `query L($filter: ModelAWSCourseIndexFilterInput, $limit: Int, $nextToken: String) {
    ${GQL.listAll}(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items { ${INDEX_FIELDS} } nextToken
    }
  }`;
  const data = await gql(query, {
    filter: opts.filter,
    limit: opts.limit ?? 1000,
    nextToken: opts.nextToken ?? undefined,
  });
  const conn = data[GQL.listAll];
  return { items: conn.items as CourseIndexRow[], nextToken: conn.nextToken ?? null };
}

export async function getCourse(osmId: string): Promise<CourseIndexRow | null> {
  const query = `query G($osmId: String!) { ${GQL.get}(osmId: $osmId) { ${INDEX_FIELDS} } }`;
  const data = await gql(query, { osmId });
  return (data[GQL.get] as CourseIndexRow) ?? null;
}

/** Partial update of an index row (reviewStatus / note / serving flags). */
export async function updateCourseIndex(
  input: Partial<CourseIndexRow> & { osmId: string }
): Promise<CourseIndexRow> {
  const query = `mutation U($input: UpdateAWSCourseIndexInput!) {
    ${GQL.update}(input: $input) { ${INDEX_FIELDS} }
  }`;
  const data = await gql(query, { input });
  return data[GQL.update] as CourseIndexRow;
}

// ---- CourseDataJob ----

export async function listJobs(
  opts: { filter?: object; limit?: number; nextToken?: string | null } = {}
): Promise<Page<CourseDataJobRow>> {
  const query = `query L($filter: ModelCourseDataJobFilterInput, $limit: Int, $nextToken: String) {
    ${GQL.listJobs}(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items { ${JOB_FIELDS} } nextToken
    }
  }`;
  const data = await gql(query, {
    filter: opts.filter,
    limit: opts.limit ?? 200,
    nextToken: opts.nextToken ?? undefined,
  });
  const conn = data[GQL.listJobs];
  return { items: conn.items as CourseDataJobRow[], nextToken: conn.nextToken ?? null };
}

// ---- AWSPlaybook demand count (F4) ----

/** Count playbooks referencing this course (the demand signal). Paginates ids; caps to avoid runaway. */
export async function playbookDemand(osmId: string, cap = 2000): Promise<number> {
  const query = `query L($courseId: String!, $limit: Int, $nextToken: String) {
    ${GQL.listPlaybooksByCourse}(courseId: $courseId, limit: $limit, nextToken: $nextToken) {
      items { id } nextToken
    }
  }`;
  let total = 0;
  let nextToken: string | null | undefined = undefined;
  do {
    const data = await gql(query, { courseId: osmId, limit: 1000, nextToken });
    const conn = data[GQL.listPlaybooksByCourse];
    total += (conn.items as unknown[]).length;
    nextToken = conn.nextToken;
  } while (nextToken && total < cap);
  return total;
}

// ---- osmResolveCourse (contentVersion negotiation) ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resolveCourse(osmId: string, contentVersion?: string): Promise<any> {
  const query = `query R($osmId: String!, $contentVersion: String) {
    osmResolveCourse(osmId: $osmId, contentVersion: $contentVersion)
  }`;
  const data = await gql(query, { osmId, contentVersion });
  return parseJson(data.osmResolveCourse);
}

// ---- Editor mutations (Addendum §2, N2 baseETag, DX4) ----
//
// BOUNDARY NORMALIZATION — do not skip. All five editor ops are declared `.returns(a.json())`,
// so AppSync hands the Lambda's object back verbatim and the Lambda's `EditorResult`
// (Backend/amplify/functions/course-data-editor-function/shared.ts) IS the wire contract. It
// names things differently from this module's Web-side types: `s3ETag` / `eTag` for what we call
// `etag`, and the failure code+message inside `errors[0]` rather than a top-level `code`/`error`.
// `parseJson` is an unchecked cast, so a drift is invisible to tsc AND to component tests that
// build their own fixtures — which is exactly how the N2 optimistic lock, the R9 regen banner and
// the delete-failure reason all shipped dead. Every mapping lives here, once, and is pinned by
// __tests__/api.test.ts against literal Lambda payloads.

/** The raw editor-Lambda response (shared.ts `EditorResult`). */
interface EditorResult {
  ok: boolean;
  errors?: ValidationFinding[];
  warnings?: ValidationFinding[];
  s3VersionId?: string;
  s3ETag?: string;
  indexSyncWarning?: boolean;
  versions?: RawVersionEntry[];
  restoredFrom?: string;
  deletedKey?: string;
  key?: string;
  cacheKey?: string;
  findings?: ValidationFinding[];
}

/** The raw version row (shared.ts `VersionEntry`) — note `eTag`, not `etag`. */
interface RawVersionEntry {
  versionId: string;
  lastModified?: string;
  size?: number;
  eTag?: string;
  isLatest?: boolean;
  isDeleteMarker?: boolean;
}

function toSaveVerdict(raw: EditorResult): SaveVerdict {
  return {
    ok: raw.ok,
    errors: raw.errors,
    warnings: raw.warnings,
    s3VersionId: raw.s3VersionId,
    etag: raw.s3ETag,
    indexSyncWarning: raw.indexSyncWarning,
    // The Lambda has no top-level code — it is the first coded finding
    // (etag-conflict, staging-missing, version-not-found, …).
    code: raw.errors?.[0]?.code,
  };
}

function toVersion(raw: RawVersionEntry): CourseDataVersion {
  return {
    versionId: raw.versionId,
    lastModified: raw.lastModified,
    size: raw.size,
    etag: raw.eTag,
    isLatest: raw.isLatest,
    isDeleteMarker: raw.isDeleteMarker,
  };
}

export async function saveCourseData(
  courseKey: string,
  rendition: "mlgen",
  stagingKey: string,
  baseETag?: string | null
): Promise<SaveVerdict> {
  const query = `mutation S($courseKey: String!, $rendition: String!, $stagingKey: String!, $baseETag: String) {
    saveCourseData(courseKey: $courseKey, rendition: $rendition, stagingKey: $stagingKey, baseETag: $baseETag)
  }`;
  const data = await gql(query, { courseKey, rendition, stagingKey, baseETag });
  return toSaveVerdict(parseJson<EditorResult>(data.saveCourseData));
}

/**
 * Throws on a Lambda failure envelope (`{ok:false, errors:[...]}`) rather than mapping it to `[]`
 * — an empty list reads as "no version history", which lets a caller adopt a null baseEtag against
 * an object that still exists and turns a transient failure (e.g. s3-throttled) into a guaranteed
 * `IfNoneMatch:'*'` 412 on the next save (#3). Callers must not swallow this into `[]`.
 */
export async function listCourseDataVersions(
  courseKey: string,
  rendition: "mlgen" = "mlgen"
): Promise<CourseDataVersion[]> {
  const query = `query V($courseKey: String!, $rendition: String!) {
    listCourseDataVersions(courseKey: $courseKey, rendition: $rendition)
  }`;
  const data = await gql(query, { courseKey, rendition });
  const parsed = parseJson<RawVersionEntry[] | EditorResult>(data.listCourseDataVersions);
  if (Array.isArray(parsed)) return parsed.map(toVersion);
  if (!parsed.ok) {
    throw new Error(parsed.errors?.[0]?.msg ?? "listCourseDataVersions failed");
  }
  return (parsed.versions ?? []).map(toVersion);
}

export async function restoreCourseDataVersion(
  courseKey: string,
  versionId: string,
  rendition: "mlgen" = "mlgen"
): Promise<SaveVerdict> {
  const query = `mutation R($courseKey: String!, $rendition: String!, $versionId: String!) {
    restoreCourseDataVersion(courseKey: $courseKey, rendition: $rendition, versionId: $versionId)
  }`;
  const data = await gql(query, { courseKey, rendition, versionId });
  return toSaveVerdict(parseJson<EditorResult>(data.restoreCourseDataVersion));
}

/** `error` carries the Lambda's real reason — an allowlist rejection (never retry) reads
 *  differently from an s3-throttled failure (retry works); `code` distinguishes them. */
export async function deleteCourseArtifact(
  key: string
): Promise<{ ok: boolean; error?: string; code?: string }> {
  const query = `mutation D($key: String!) { deleteCourseArtifact(key: $key) }`;
  const data = await gql(query, { key });
  const raw = parseJson<EditorResult>(data.deleteCourseArtifact);
  return { ok: raw.ok, error: raw.errors?.[0]?.msg, code: raw.errors?.[0]?.code };
}

// ---- Storage ----

/** Download + parse a course JSON at an explicit S3 path (e.g. from resolver cacheUrl). */
export async function downloadCourseJson(path: string): Promise<CourseData> {
  const { body } = await downloadData({ path }).result;
  const text = await body.text();
  return JSON.parse(text) as CourseData;
}

/** Download the mlgen rendition for a course by key. */
export async function downloadMlgen(courseKey: string): Promise<CourseData> {
  return downloadCourseJson(`${PREFIX.mlgen}${courseKey}.json`);
}

/** Download the legacy rendition for a course by key (may 404 for mlgen-only courses). */
export async function downloadLegacy(courseKey: string): Promise<CourseData> {
  return downloadCourseJson(`${PREFIX.legacy}${courseKey}.json`);
}

/** Upload edited course JSON to a fresh staging key; returns the staging path (E1). */
export async function uploadStaging(courseKey: string, course: CourseData): Promise<string> {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${PREFIX.staging}${courseKey}.${uuid}.json`;
  await uploadData({
    path,
    data: JSON.stringify(course),
    options: { contentType: "application/json" },
  }).result;
  return path;
}

export interface StorageObject {
  path: string;
  size?: number;
  lastModified?: Date;
  eTag?: string;
}

/** List objects under a prefix (excludes the staging/ subtree by default — N3). */
export async function listStorage(
  prefix: string,
  opts: { includeStaging?: boolean } = {}
): Promise<StorageObject[]> {
  const res = await list({ path: prefix, options: { listAll: true } });
  let items = (res.items ?? []).map((i) => ({
    path: i.path,
    size: i.size,
    lastModified: i.lastModified,
    eTag: i.eTag,
  }));
  if (!opts.includeStaging) items = items.filter((i) => !i.path.startsWith(PREFIX.staging));
  return items;
}

/** Object metadata + user metadata for the storage detail view. */
export async function objectProperties(path: string) {
  return getProperties({ path });
}

/** Read the qc-reports report.json for a course (E5). Returns null if absent (graceful degrade). */
export async function downloadReport(courseKey: string): Promise<QcReport | null> {
  try {
    const { body } = await downloadData({ path: `${PREFIX.reports}${courseKey}.report.json` }).result;
    const text = await body.text();
    return JSON.parse(text) as QcReport;
  } catch {
    return null;
  }
}

// ---- Manual course seeding (/admin/seed) ----

/**
 * Save a hand-clicked course seed. The Backend saveCourseSeed mutation (admin-only) validates the
 * payload, writes seeds/manual-<slug>.json, and returns {ok, key, cacheKey, findings} or a failure
 * with structured findings. AWSJSON is a string scalar, so the seed is JSON-stringified in and the
 * response is JSON-parsed out.
 *
 * Shape asymmetry the Lambda genuinely has (save-seed.ts): the SUCCESS path names its warnings
 * `findings`, the FAILURE path names them `errors` + `warnings`. Both are flattened into
 * `findings` here so the /admin/seed panel renders the blocking reasons instead of the bare
 * "Rejected by the server." — every point-level `seed-far-point` / `seed-position-mismatch`
 * message was being dropped on the floor.
 */
export async function saveCourseSeed(seed: SeedJson): Promise<SeedSaveResult> {
  const query = `mutation S($seed: AWSJSON!) { saveCourseSeed(seed: $seed) }`;
  const data = await gql(query, { seed: JSON.stringify(seed) });
  const raw = parseJson<EditorResult>(data.saveCourseSeed);
  const findings: ValidationFinding[] = [
    ...(raw.findings ?? []),
    ...(raw.errors ?? []),
    ...(raw.warnings ?? []),
  ];
  return {
    ok: raw.ok,
    key: raw.key,
    cacheKey: raw.cacheKey,
    findings,
    // Headline reason (the renderer shows it only when it has no list to show).
    error: raw.errors?.[0]?.msg,
  };
}

/** List saved seeds under seeds/ (admin group has list access — like the mlgen prefix). */
export async function listSeeds(): Promise<StorageObject[]> {
  return listStorage(PREFIX.seeds);
}

/** Download + parse a saved seed JSON by its full storage key (e.g. seeds/manual-foo.json). */
export async function downloadSeed(key: string): Promise<SeedJson> {
  const { body } = await downloadData({ path: key }).result;
  const text = await body.text();
  return JSON.parse(text) as SeedJson;
}

/** The S3 bucket name (from amplify_outputs.json) — used to build the "aws s3 cp" next-steps line. */
export function storageBucket(): string {
  const storage = (outputs as { storage?: { bucket_name?: string } }).storage;
  return storage?.bucket_name ?? "<bucket>";
}

/** Convenience: courseKey for an osmId (re-exported so components import one module). */
export { courseKeyFor };
