// naipTiles — THE one NAIP tile definition for every browser map in Web.
//
// NAIP comes from the Microsoft Planetary Computer (PC) data-API mosaic tiler, never from the USGS
// ImageServer (its /tile path 404s and exportImage is rate-limited). The Python side defines the same
// thing once in Training/hitl_review/cloud_sources.py (PC_NAIP_MOSAIC_BODY / get_pc_naip_mosaic_id /
// pc_naip_tile_template); keep the two in step.
//
// MOSAIC IDS EXPIRE (2026-10): register now returns `searchid` = "pc1.<expiryEpoch>.<hash>", valid ~24 h; the old
// pinned content-hash id (295b22a1...) 404s with {"error":"Unknown search ID."}. Browsers therefore never talk to
// PC's tiler directly: NAIP_TILES is the same-origin proxy route /api/naip/tile/{z}/{x}/{y}, which registers
// PC_NAIP_MOSAIC_BODY on demand and caches the live id (lib/imagery/naipMosaic.ts). The Python side
// (Training/hitl_review/cloud_sources.py get_pc_naip_mosaic_id) and the iOS NAIPMosaicRegistry do the same.
// The tiler has no "is USGS newer" check.

export const PC_MOSAIC_REGISTER = "https://planetarycomputer.microsoft.com/api/data/v1/mosaic/register";

/** The body POSTed to PC_MOSAIC_REGISTER (newest acquisition on top). */
export const PC_NAIP_MOSAIC_BODY = {
  filter: { op: "and", args: [{ op: "=", args: [{ property: "collection" }, "naip"] }] },
  sortby: [{ field: "datetime", direction: "desc" }],
  collections: ["naip"],
  "filter-lang": "cql2-json",
  metadata: { type: "mosaic", name: "naip-latest" },
} as const;

/** Attribution shown on every NAIP layer. */
export const NAIP_ATTRIBUTION = "Imagery: USDA NAIP via Microsoft Planetary Computer";

/** XYZ tile URL template for a PC NAIP mosaic ({z}/{x}/{y} are left for the map library). Server-side only. */
export function naipTileUrl(searchId: string): string {
  return (
    `https://planetarycomputer.microsoft.com/api/data/v1/mosaic/${searchId}/tiles/WebMercatorQuad/{z}/{x}/{y}@1x` +
    "?assets=image&asset_bidx=image%7C1%2C2%2C3&collection=naip&format=jpg"
  );
}

/** What every browser map uses: the same-origin proxy that holds the live mosaic id. */
export const NAIP_TILES = "/api/naip/tile/{z}/{x}/{y}";

/** The tiler answers 204 (no content) below z11 (measured 2026-10-04 at Harding and Scottsdale: z10 -> 204,
 *  z11 -> 200); a raster source must not request below this or maplibre reports tile errors. */
export const NAIP_MINZOOM = 11;
/** NAIP is ~0.6 m (native ~z18-19); maplibre overzooms beyond this. */
export const NAIP_MAXZOOM = 19;

const TILE_INT = /^\d{1,7}$/;

/** Parse proxy route params into tile coords: plain decimal digits only, NAIP_MINZOOM <= z <= NAIP_MAXZOOM,
 *  0 <= x, y < 2^z. Null for anything else. */
export function parseNaipTileCoords(z: string, x: string, y: string): { z: number; x: number; y: number } | null {
  if (![z, x, y].every((v) => TILE_INT.test(v))) return null;
  const [zn, xn, yn] = [Number(z), Number(x), Number(y)];
  if (zn < NAIP_MINZOOM || zn > NAIP_MAXZOOM) return null;
  const n = 2 ** zn;
  if (xn >= n || yn >= n) return null;
  return { z: zn, x: xn, y: yn };
}
