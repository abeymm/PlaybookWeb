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
} from "./types";
import { courseKeyFor } from "./geo";

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
  return parseJson<SaveVerdict>(data.saveCourseData);
}

export async function listCourseDataVersions(
  courseKey: string,
  rendition: "mlgen" = "mlgen"
): Promise<CourseDataVersion[]> {
  const query = `query V($courseKey: String!, $rendition: String!) {
    listCourseDataVersions(courseKey: $courseKey, rendition: $rendition)
  }`;
  const data = await gql(query, { courseKey, rendition });
  const parsed = parseJson<CourseDataVersion[] | { versions: CourseDataVersion[] }>(
    data.listCourseDataVersions
  );
  return Array.isArray(parsed) ? parsed : (parsed?.versions ?? []);
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
  return parseJson<SaveVerdict>(data.restoreCourseDataVersion);
}

export async function deleteCourseArtifact(key: string): Promise<{ ok: boolean; error?: string }> {
  const query = `mutation D($key: String!) { deleteCourseArtifact(key: $key) }`;
  const data = await gql(query, { key });
  return parseJson<{ ok: boolean; error?: string }>(data.deleteCourseArtifact);
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

/** Convenience: courseKey for an osmId (re-exported so components import one module). */
export { courseKeyFor };
