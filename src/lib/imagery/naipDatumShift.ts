// naipDatumShift — D24: correct the Planetary Computer NAIP mosaic's datum offset in the browser.
//
// The PC mosaic tiles are georeferenced in null-datum NAD83(2011): they draw a feature 0.8 m (Augusta) to
// 1.3 m (Harding) away from its true WGS84 position. Our polygons are true WGS84, so the imagery has to move.
// The tiler exposes only /tiles/{tms}/{z}/{x}/{y} (no bbox), so each tile is re-cut client-side by this module
// (planning) + naipProtocol.ts (fetch/draw), driven by ONE shared table:
// naipDatumShift.json (+ .sha256) is a byte-identical copy of Training/data/datum/naip_datum_shift_conus_1deg.json;
// a test pins the hash. Do not edit the JSON here; regenerate it in Training and copy it.
//
// Convention (from the table): shift = (null-datum position) - (true WGS84 position), local east/north metres.
// To draw true-WGS84 geometry over a null-datum tile, ADD the shift. Reference bilinear = Python `interpolate`.
//
// Imported lazily by naipProtocol.ts, so the table is not part of the initial bundle.

import grid from "./naipDatumShift.json";

/** Below this zoom the shift is < 0.5 px (0.6 m/px at z18 -> 1.3 m = 2.2 px; z15 = 0.28 px), so tiles pass through. */
export const NAIP_SHIFT_MINZOOM = 16;

const TILE_SIZE = 256;
const EARTH_CIRCUMFERENCE_M = 2 * Math.PI * 6378137;
/** Overlap below this (px) counts as "no overlap" so float dust never pulls in a neighbour tile. */
const OVERLAP_EPSILON_PX = 1e-9;

export interface DatumShift {
  /** Local east shift in metres. */
  eastM: number;
  /** Local north shift in metres. */
  northM: number;
}

/** One source tile to draw and where its top-left corner lands on the 256x256 output canvas (px). */
export interface ShiftedTilePart {
  z: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
}

/** Bilinear shift at (lat, lng), or null outside the table's CONUS coverage. A grid node returns its exact value. */
export function naipDatumShift(lat: number, lng: number): DatumShift | null {
  const { lat0, lon0, step, rows, cols, eastM, northM } = grid;
  const fi = (lat - lat0) / step;
  const fj = (lng - lon0) / step;
  if (!(fi >= 0 && fi <= rows - 1 && fj >= 0 && fj <= cols - 1)) return null;
  const i = Math.min(Math.floor(fi), rows - 2);
  const j = Math.min(Math.floor(fj), cols - 2);
  const ty = fi - i;
  const tx = fj - j;
  const blend = (g: number[][]): number =>
    (1 - ty) * ((1 - tx) * g[i][j] + tx * g[i][j + 1]) + ty * ((1 - tx) * g[i + 1][j] + tx * g[i + 1][j + 1]);
  return { eastM: blend(eastM), northM: blend(northM) };
}

/** EPSG:3857 metres per pixel of a 256 px tile at zoom z (at the equator; callers scale by 1/cos(lat) for true metres). */
export function tileResolutionM(z: number): number {
  return EARTH_CIRCUMFERENCE_M / (TILE_SIZE * 2 ** z);
}

/** Geographic centre of slippy tile (z, x, y). */
export function tileCenterLatLng(z: number, x: number, y: number): { lat: number; lng: number } {
  const n = 2 ** z;
  const lng = ((x + 0.5) / n) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 0.5)) / n))) * 180) / Math.PI;
  return { lat, lng };
}

/**
 * Draw plan for the true-WGS84 tile (z, x, y) re-cut from a null-datum mosaic.
 *
 * Output pixel (u, v) must show mosaic content at source column u + sxPx, row v - syPx (rows grow downward), where
 * sxPx/syPx are the shift in tile pixels (Mercator-scaled by 1/cos(lat)). So the tile itself is drawn at offset
 * (-sxPx, +syPx) and the uncovered edge is filled from the neighbour in the shift direction. Neighbours with no
 * overlap with the canvas, or outside the world's tile range, are omitted. The tile itself is always first.
 * Below NAIP_SHIFT_MINZOOM the plan is the plain tile.
 */
export function planShiftedTile(z: number, x: number, y: number, shift: DatumShift): ShiftedTilePart[] {
  if (z < NAIP_SHIFT_MINZOOM) return [{ z, x, y, offsetX: 0, offsetY: 0 }];

  const { lat } = tileCenterLatLng(z, x, y);
  const k = 1 / Math.cos((lat * Math.PI) / 180);
  const res = tileResolutionM(z);
  const sxPx = (shift.eastM * k) / res;
  const syPx = (shift.northM * k) / res;
  const n = 2 ** z;

  const parts: ShiftedTilePart[] = [];
  const consider = (dx: number, dy: number): void => {
    const tx = x + dx;
    const ty = y + dy;
    if (tx < 0 || ty < 0 || tx >= n || ty >= n) return;
    const offsetX = TILE_SIZE * dx - sxPx;
    const offsetY = TILE_SIZE * dy + syPx;
    const overlapX = Math.min(TILE_SIZE, offsetX + TILE_SIZE) - Math.max(0, offsetX);
    const overlapY = Math.min(TILE_SIZE, offsetY + TILE_SIZE) - Math.max(0, offsetY);
    if (overlapX <= OVERLAP_EPSILON_PX || overlapY <= OVERLAP_EPSILON_PX) return;
    parts.push({ z, x: tx, y: ty, offsetX, offsetY });
  };

  consider(0, 0);
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx !== 0 || dy !== 0) consider(dx, dy);
    }
  }
  return parts;
}
