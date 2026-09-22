// opengolfapi.ts — SERVER-ONLY client for opengolfapi.org (ODbL course data). Reads are keyless;
// the developer key (env OPENGOLFAPI_KEY) is sent as `X-OpenGolf-Token` when present for higher
// limits. Every response is cached on disk first (like the pipeline's golfapi_client.py), under
// Scripts/regions/us/cache_opengolfapi/raw/ — `regions/` is gitignored in Scripts.
//
// Endpoints used (OpenAPI 3.6.1 at https://api.opengolfapi.org/openapi.json):
//   GET /api/v1/courses/search?q=&lat=&lng=&radius_mi=&limit=   → { courses: CourseCompact[], total }
//   GET /api/v1/courses/{id}                                     → CourseDetail (holes_data[], tees[])

import fs from "node:fs";
import path from "node:path";
import { PLAYBOOK_ROOT } from "./config";

export const OPENGOLFAPI_BASE = process.env.OPENGOLFAPI_BASE ?? "https://api.opengolfapi.org/api/v1";
const TOKEN_ENV = "OPENGOLFAPI_KEY";
export const RAW_CACHE_DIR =
  process.env.OPENGOLFAPI_RAW_CACHE ?? path.join(PLAYBOOK_ROOT, "Scripts/regions/us/cache_opengolfapi/raw");

function slug(s: string): string {
  return s.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120);
}

async function fetchJson(url: string): Promise<unknown> {
  const headers: Record<string, string> = { accept: "application/json" };
  const token = process.env[TOKEN_ENV];
  if (token) headers["X-OpenGolf-Token"] = token;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) {
    throw new Error(`OpenGolfAPI ${res.status} ${res.statusText} for ${url.replace(OPENGOLFAPI_BASE, "")}`);
  }
  return res.json();
}

/** Cache-first GET: `<raw>/<endpoint>-<key>.json` is returned verbatim when present. */
async function cached(endpoint: string, key: string, url: string): Promise<unknown> {
  const file = path.join(RAW_CACHE_DIR, `${endpoint}-${slug(key)}.json`);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    /* miss */
  }
  const data = await fetchJson(url);
  fs.mkdirSync(RAW_CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 1));
  return data;
}

export interface SearchOptions {
  lat?: number;
  lng?: number;
  radiusMi?: number;
  limit?: number;
}

/** Raw search response (see scorecard.ts `toCandidates` for the normalized list). */
export async function searchCourses(q: string, opts: SearchOptions = {}): Promise<unknown> {
  const params = new URLSearchParams({ q, limit: String(opts.limit ?? 10) });
  if (opts.lat != null && opts.lng != null) {
    params.set("lat", String(opts.lat));
    params.set("lng", String(opts.lng));
    params.set("radius_mi", String(opts.radiusMi ?? 25));
  }
  const key = `${q}_${opts.lat ?? ""}_${opts.lng ?? ""}_${opts.radiusMi ?? ""}_${opts.limit ?? ""}`;
  return cached("search", key, `${OPENGOLFAPI_BASE}/courses/search?${params.toString()}`);
}

/** Raw CourseDetail (see scorecard.ts `normalizeScorecard`). */
export async function getCourseDetail(id: string): Promise<unknown> {
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) throw new Error(`invalid OpenGolfAPI course id '${id}'`);
  return cached("course", id, `${OPENGOLFAPI_BASE}/courses/${encodeURIComponent(id)}`);
}
