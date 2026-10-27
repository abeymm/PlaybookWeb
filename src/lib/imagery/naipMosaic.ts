// naipMosaic — server-side PC NAIP mosaic registration with an in-memory, self-healing cache.
//
// Since 2026-10 Planetary Computer mosaic ids are NOT permanent content hashes: POST /mosaic/register
// returns `searchid` = "pc1.<expiryEpochSeconds>.<hash>" and the id stops working ~24 h later
// ({"error":"Unknown search ID."} with HTTP 404 on every tile). So the id can no longer be pinned in
// source; the /api/naip/tile route registers PC_NAIP_MOSAIC_BODY on demand and caches the id here.
import { PC_MOSAIC_REGISTER, PC_NAIP_MOSAIC_BODY, naipTileUrl } from "./naipTiles";

type Fetch = typeof fetch;

/** Re-register this long before the id's own expiry. */
export const MOSAIC_EXPIRY_MARGIN_MS = 10 * 60 * 1000;
/** Fallback lifetime when an id carries no parsable expiry (legacy 32-hex ids). */
export const MOSAIC_FALLBACK_TTL_MS = 60 * 60 * 1000;
/** Minimum gap between accepted invalidations (caps re-registrations a hostile client can trigger). */
export const MOSAIC_REREGISTER_MIN_MS = 60_000;

/** Epoch-ms expiry encoded in a "pc1.<epochSeconds>.<hash>" id, or null if the id has no such prefix. */
export function mosaicIdExpiryMs(id: string): number | null {
  const m = /^pc1\.(\d{9,11})\./.exec(id);
  return m ? Number(m[1]) * 1000 : null;
}

/** Cache lifetime end (epoch ms) for a freshly registered id. */
export function mosaicCacheUntil(id: string, nowMs: number): number {
  const exp = mosaicIdExpiryMs(id);
  return exp === null ? nowMs + MOSAIC_FALLBACK_TTL_MS : Math.min(exp - MOSAIC_EXPIRY_MARGIN_MS, nowMs + 12 * 3600 * 1000);
}

/** POST the NAIP search to PC and return the live searchid. Throws on a non-2xx or unexpected body. */
export async function registerNaipMosaic(fetchImpl: Fetch = fetch): Promise<string> {
  const res = await fetchImpl(PC_MOSAIC_REGISTER, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(PC_NAIP_MOSAIC_BODY),
  });
  if (!res.ok) throw new Error(`PC mosaic register failed: HTTP ${res.status}`);
  const body = (await res.json()) as { searchid?: unknown; id?: unknown };
  const id = body.searchid ?? body.id;
  if (typeof id !== "string" || !id) throw new Error("PC mosaic register: no searchid in response");
  return id;
}

let cached: { id: string; until: number } | null = null;
let inflight: Promise<string> | null = null;

/** The cached live mosaic id, registering (once, concurrent callers share the request) when missing/expired. */
export async function getNaipMosaicId(fetchImpl: Fetch = fetch, nowMs: number = Date.now()): Promise<string> {
  if (cached && nowMs < cached.until) return cached.id;
  inflight ??= registerNaipMosaic(fetchImpl)
    .then((id) => {
      cached = { id, until: mosaicCacheUntil(id, nowMs) };
      return id;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

let lastInvalidationMs: number | null = null;

/** Drop the cached id (e.g. PC answered "Unknown search ID" before our TTL ran out). Accepted (true) at most
 *  once per MOSAIC_REREGISTER_MIN_MS; otherwise the cache is left alone and this returns false. */
export function invalidateNaipMosaicId(nowMs: number = Date.now()): boolean {
  if (lastInvalidationMs !== null && nowMs - lastInvalidationMs < MOSAIC_REREGISTER_MIN_MS) return false;
  lastInvalidationMs = nowMs;
  cached = null;
  return true;
}

/** Clear the cached id and the invalidation throttle (tests). */
export function resetNaipMosaicState(): void {
  cached = null;
  lastInvalidationMs = null;
}

const TILE_CACHE = "public, max-age=86400";
const upstreamError = () =>
  new Response("NAIP tile upstream error", { status: 502, headers: { "cache-control": "no-store" } });

async function fetchTileOnce(coords: { z: number; x: number; y: number }, fetchImpl: Fetch, nowMs: number): Promise<Response> {
  const id = await getNaipMosaicId(fetchImpl, nowMs);
  const url = naipTileUrl(id)
    .replace("{z}", String(coords.z))
    .replace("{x}", String(coords.x))
    .replace("{y}", String(coords.y));
  return fetchImpl(url);
}

/** Fetch one NAIP tile from PC for the proxy route. Re-registers the mosaic only on an "Unknown search ID" 404
 *  (throttled), passes through only 200 image/* and 204, and answers a plain 502 for anything else. */
export async function fetchNaipTile(
  coords: { z: number; x: number; y: number },
  fetchImpl: Fetch = fetch,
  nowMs: number = Date.now(),
): Promise<Response> {
  try {
    let upstream = await fetchTileOnce(coords, fetchImpl, nowMs);
    if (upstream.status === 404) {
      const text = await upstream.text();
      if (text.includes("Unknown search ID") && invalidateNaipMosaicId(nowMs)) {
        upstream = await fetchTileOnce(coords, fetchImpl, nowMs);
      }
    }
    const type = upstream.headers.get("content-type") ?? "";
    if (upstream.status === 200 && type.startsWith("image/")) {
      return new Response(upstream.body, { status: 200, headers: { "content-type": type, "cache-control": TILE_CACHE } });
    }
    if (upstream.status === 204) return new Response(null, { status: 204, headers: { "cache-control": TILE_CACHE } });
    return upstreamError();
  } catch {
    return upstreamError();
  }
}
