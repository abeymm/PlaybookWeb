// naipMosaic — server-side PC NAIP mosaic registration with an in-memory, self-healing cache.
//
// Since 2026-10 Planetary Computer mosaic ids are NOT permanent content hashes: POST /mosaic/register
// returns `searchid` = "pc1.<expiryEpochSeconds>.<hash>" and the id stops working ~24 h later
// ({"error":"Unknown search ID."} with HTTP 404 on every tile). So the id can no longer be pinned in
// source; the /api/naip/tile route registers PC_NAIP_MOSAIC_BODY on demand and caches the id here.
import { PC_MOSAIC_REGISTER, PC_NAIP_MOSAIC_BODY } from "./naipTiles";

type Fetch = typeof fetch;

/** Re-register this long before the id's own expiry. */
export const MOSAIC_EXPIRY_MARGIN_MS = 10 * 60 * 1000;
/** Fallback lifetime when an id carries no parsable expiry (legacy 32-hex ids). */
export const MOSAIC_FALLBACK_TTL_MS = 60 * 60 * 1000;

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

/** Drop the cached id (e.g. PC answered "Unknown search ID" before our TTL ran out). */
export function invalidateNaipMosaicId(): void {
  cached = null;
}
