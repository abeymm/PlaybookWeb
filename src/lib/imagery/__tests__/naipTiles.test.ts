import { describe, it, expect } from "vitest";
import {
  NAIP_ATTRIBUTION,
  NAIP_MAXZOOM,
  NAIP_MINZOOM,
  NAIP_PROTOCOL_TILES,
  NAIP_TILES,
  PC_NAIP_MOSAIC_BODY,
  PC_NAIP_MOSAIC_ID,
  naipTileUrl,
} from "../naipTiles";

describe("naipTiles — the one PC NAIP tile definition", () => {
  it("builds the verified PC data-API template with XYZ placeholders left in place", () => {
    expect(NAIP_TILES).toBe(
      "https://planetarycomputer.microsoft.com/api/data/v1/mosaic/295b22a1cc2df6b2aca068c5b4eceb04" +
        "/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?assets=image&asset_bidx=image%7C1%2C2%2C3&collection=naip&format=jpg",
    );
  });

  it("never points at USGS", () => {
    expect(NAIP_TILES).not.toMatch(/nationalmap|usgs/i);
  });

  it("uses a given searchid", () => {
    expect(naipTileUrl("abc123")).toContain("/mosaic/abc123/tiles/WebMercatorQuad/");
    expect(PC_NAIP_MOSAIC_ID).toBe("295b22a1cc2df6b2aca068c5b4eceb04");
  });

  it("documents a register body that selects newest-first NAIP", () => {
    expect(PC_NAIP_MOSAIC_BODY.collections).toEqual(["naip"]);
    expect(PC_NAIP_MOSAIC_BODY.sortby[0]).toEqual({ field: "datetime", direction: "desc" });
  });

  it("keeps raster requests inside the tiler's served zoom range", () => {
    expect(NAIP_MINZOOM).toBe(11);
    expect(NAIP_MAXZOOM).toBeGreaterThan(NAIP_MINZOOM);
  });

  it("carries the required attribution", () => {
    expect(NAIP_ATTRIBUTION).toBe("Imagery: USDA NAIP via Microsoft Planetary Computer");
  });

  it("exposes the datum-corrected protocol template that every map source must use", () => {
    expect(NAIP_PROTOCOL_TILES).toBe("naip://{z}/{x}/{y}");
  });
});
