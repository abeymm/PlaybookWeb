import { describe, it, expect } from "vitest";
import {
  NAIP_ATTRIBUTION,
  NAIP_MAXZOOM,
  NAIP_MINZOOM,
  NAIP_TILES,
  PC_NAIP_MOSAIC_BODY,
  naipTileUrl,
} from "../naipTiles";

describe("naipTiles — the one PC NAIP tile definition", () => {
  it("browsers use the same-origin proxy with XYZ placeholders", () => {
    expect(NAIP_TILES).toBe("/api/naip/tile/{z}/{x}/{y}");
  });

  it("never points at USGS", () => {
    expect(NAIP_TILES + naipTileUrl("x")).not.toMatch(/nationalmap|usgs/i);
  });

  it("builds the PC data-API template for a given searchid", () => {
    expect(naipTileUrl("abc123")).toBe(
      "https://planetarycomputer.microsoft.com/api/data/v1/mosaic/abc123" +
        "/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?assets=image&asset_bidx=image%7C1%2C2%2C3&collection=naip&format=jpg",
    );
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
});
