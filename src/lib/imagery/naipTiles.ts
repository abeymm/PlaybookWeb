// naipTiles — THE one NAIP tile definition for every browser map in Web.
//
// NAIP comes from the Microsoft Planetary Computer (PC) data-API mosaic tiler, never from the USGS
// ImageServer (its /tile path 404s and exportImage is rate-limited). The Python side defines the same
// thing once in Training/hitl_review/cloud_sources.py (PC_NAIP_MOSAIC_BODY / PC_NAIP_MOSAIC_ID /
// pc_naip_tile_template); keep the two in step.
//
// searchid = the id PC returns from POST PC_MOSAIC_REGISTER with PC_NAIP_MOSAIC_BODY. It is a content
// hash of that body, so registering the same body always yields the same id; re-register and re-pin it
// here (and in cloud_sources.py) if PC ever drops it. The tiler has no "is USGS newer" check.

export const PC_MOSAIC_REGISTER = "https://planetarycomputer.microsoft.com/api/data/v1/mosaic/register";

/** Documentation: the body registered to obtain PC_NAIP_MOSAIC_ID (newest acquisition on top).
 *  Verified 2026-10-04: POSTing exactly this yields 295b22a1cc2df6b2aca068c5b4eceb04. */
export const PC_NAIP_MOSAIC_BODY = {
  filter: { op: "and", args: [{ op: "=", args: [{ property: "collection" }, "naip"] }] },
  sortby: [{ field: "datetime", direction: "desc" }],
  collections: ["naip"],
  "filter-lang": "cql2-json",
  metadata: { type: "mosaic", name: "naip-latest" },
} as const;

export const PC_NAIP_MOSAIC_ID = "295b22a1cc2df6b2aca068c5b4eceb04";

/** Attribution shown on every NAIP layer. */
export const NAIP_ATTRIBUTION = "Imagery: USDA NAIP via Microsoft Planetary Computer";

/** XYZ tile URL template for a PC NAIP mosaic ({z}/{x}/{y} are left for the map library). */
export function naipTileUrl(searchId: string = PC_NAIP_MOSAIC_ID): string {
  return (
    `https://planetarycomputer.microsoft.com/api/data/v1/mosaic/${searchId}/tiles/WebMercatorQuad/{z}/{x}/{y}@1x` +
    "?assets=image&asset_bidx=image%7C1%2C2%2C3&collection=naip&format=jpg"
  );
}

/** The default tile template (pinned searchid). */
export const NAIP_TILES = naipTileUrl();

/** The tiler answers 204 (no content) below z11 (measured 2026-10-04 at Harding and Scottsdale: z10 -> 204,
 *  z11 -> 200); a raster source must not request below this or maplibre reports tile errors. */
export const NAIP_MINZOOM = 11;
/** NAIP is ~0.6 m (native ~z18-19); maplibre overzooms beyond this. */
export const NAIP_MAXZOOM = 19;
