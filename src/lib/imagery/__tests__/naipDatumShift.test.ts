import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import grid from "../naipDatumShift.json";
import {
  NAIP_SHIFT_MINZOOM,
  naipDatumShift,
  planShiftedTile,
  tileCenterLatLng,
  tileResolutionM,
} from "../naipDatumShift";

const TOL = 1e-3;
const HARDING = { lat: 37.7244, lng: -122.4936 };
const AUGUSTA = { lat: 33.503, lng: -82.021 };

/** Slippy-map tile containing a point. */
function tileOf(lat: number, lng: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

describe("naipDatumShift.json — shared table integrity", () => {
  it("raw file bytes hash to the manifest hash (byte-identical copy of the Training table)", () => {
    const dir = path.resolve(__dirname, "..");
    const bytes = readFileSync(path.join(dir, "naipDatumShift.json"));
    const manifest = readFileSync(path.join(dir, "naipDatumShift.json.sha256"), "utf8").trim().split(/\s+/)[0];
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(manifest);
    expect(manifest).toBe("a738c6521f21793f2706daca479743960daa1bbd6da5936a3deb31aee19fc2ba");
  });

  it("has the documented grid shape", () => {
    expect([grid.lat0, grid.lon0, grid.step, grid.rows, grid.cols]).toEqual([24, -125, 1, 27, 60]);
    expect(grid.eastM).toHaveLength(27);
    expect(grid.northM).toHaveLength(27);
    expect(grid.eastM[0]).toHaveLength(60);
  });
});

describe("naipDatumShift — bilinear lookup", () => {
  it("matches the Python goldens at Harding Park", () => {
    const s = naipDatumShift(HARDING.lat, HARDING.lng);
    expect(s).not.toBeNull();
    expect(s!.eastM).toBeCloseTo(1.16472, 3);
    expect(Math.abs(s!.eastM - 1.16472)).toBeLessThan(TOL);
    expect(Math.abs(s!.northM - -0.55356)).toBeLessThan(TOL);
  });

  it("matches the Python goldens at Augusta National", () => {
    const s = naipDatumShift(AUGUSTA.lat, AUGUSTA.lng);
    expect(Math.abs(s!.eastM - 0.32286)).toBeLessThan(TOL);
    expect(Math.abs(s!.northM - -0.7224)).toBeLessThan(TOL);
  });

  it("returns the exact node value on a grid node", () => {
    // i=5, j=10 -> lat 29, lng -115
    const s = naipDatumShift(29, -115);
    expect(s!.eastM).toBeCloseTo(grid.eastM[5][10], 9);
    expect(s!.northM).toBeCloseTo(grid.northM[5][10], 9);
  });

  it("accepts the far edges of the grid (last row / last column)", () => {
    expect(naipDatumShift(50, -66)).not.toBeNull();
    const s = naipDatumShift(50, -66)!;
    expect(s.eastM).toBeCloseTo(grid.eastM[26][59], 9);
  });

  it("returns null outside CONUS coverage", () => {
    expect(naipDatumShift(51.5, -0.12)).toBeNull(); // London
    expect(naipDatumShift(21.3, -157.8)).toBeNull(); // Honolulu
    expect(naipDatumShift(50.0001, -100)).toBeNull();
    expect(naipDatumShift(23.9999, -100)).toBeNull();
  });
});

describe("tile geometry helpers", () => {
  it("resolution halves per zoom level and is ~0.597 m/px at z18", () => {
    expect(tileResolutionM(18)).toBeCloseTo(0.5972, 3);
    expect(tileResolutionM(19)).toBeCloseTo(tileResolutionM(18) / 2, 9);
  });

  it("tile centre of z0/0/0 is (0,0)", () => {
    const c = tileCenterLatLng(0, 0, 0);
    expect(c.lat).toBeCloseTo(0, 9);
    expect(c.lng).toBeCloseTo(0, 9);
  });
});

describe("planShiftedTile", () => {
  const z = 18;
  const { x, y } = tileOf(HARDING.lat, HARDING.lng, z);
  const shift = naipDatumShift(HARDING.lat, HARDING.lng)!;

  it("zero shift -> a single tile at (0,0)", () => {
    const plan = planShiftedTile(z, x, y, { eastM: 0, northM: 0 });
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ z, x, y, offsetX: 0, offsetY: 0 });
  });

  it("Harding z18: east shift moves the draw offset negative-x and needs x+1; north shift is negative so needs y+1", () => {
    const { lat, lng } = tileCenterLatLng(z, x, y);
    // the protocol looks the shift up at the tile centre
    const s = naipDatumShift(lat, lng)!;
    const plan = planShiftedTile(z, x, y, s);
    const k = 1 / Math.cos((lat * Math.PI) / 180);
    const res = tileResolutionM(z);
    const sxPx = (s.eastM * k) / res;
    const syPx = (s.northM * k) / res;
    expect(sxPx).toBeGreaterThan(2);
    expect(sxPx).toBeLessThan(3);
    expect(syPx).toBeLessThan(0);

    const main = plan.find((t) => t.x === x && t.y === y)!;
    expect(main.offsetX).toBeCloseTo(-sxPx, 9);
    expect(main.offsetY).toBeCloseTo(syPx, 9);

    const right = plan.find((t) => t.x === x + 1 && t.y === y)!;
    expect(right.offsetX).toBeCloseTo(256 - sxPx, 9);
    const below = plan.find((t) => t.x === x && t.y === y + 1)!;
    expect(below.offsetY).toBeCloseTo(256 + syPx, 9);
    const diag = plan.find((t) => t.x === x + 1 && t.y === y + 1)!;
    expect(diag.offsetX).toBeCloseTo(256 - sxPx, 9);
    expect(diag.offsetY).toBeCloseTo(256 + syPx, 9);

    expect(plan).toHaveLength(4);
    // never needs the opposite neighbours
    expect(plan.some((t) => t.x === x - 1 || t.y === y - 1)).toBe(false);
  });

  it("negative east shift needs x-1; positive north shift needs y-1", () => {
    const res = tileResolutionM(z);
    const k = 1 / Math.cos((tileCenterLatLng(z, x, y).lat * Math.PI) / 180);
    const plan = planShiftedTile(z, x, y, { eastM: -2 * res / k, northM: 3 * res / k });
    // sxPx=-2, syPx=+3
    const left = plan.find((t) => t.x === x - 1 && t.y === y)!;
    expect(left.offsetX).toBeCloseTo(-256 + 2, 9);
    const above = plan.find((t) => t.x === x && t.y === y - 1)!;
    expect(above.offsetY).toBeCloseTo(3 - 256, 9);
    expect(plan.find((t) => t.x === x && t.y === y)!.offsetX).toBeCloseTo(2, 9);
    expect(plan.find((t) => t.x === x && t.y === y)!.offsetY).toBeCloseTo(3, 9);
    expect(plan).toHaveLength(4);
  });

  it("one-axis shift needs only one neighbour (no diagonal)", () => {
    const res = tileResolutionM(z);
    const k = 1 / Math.cos((tileCenterLatLng(z, x, y).lat * Math.PI) / 180);
    const plan = planShiftedTile(z, x, y, { eastM: (5 * res) / k, northM: 0 });
    expect(plan.map((t) => [t.x - x, t.y - y]).sort()).toEqual([[0, 0], [1, 0]]);
  });

  it("every plan fully covers the 256x256 canvas (union of tiles, per axis)", () => {
    const plan = planShiftedTile(z, x, y, shift);
    const xs = plan.map((t) => [t.offsetX, t.offsetX + 256]);
    expect(Math.min(...xs.map((a) => a[0]))).toBeLessThanOrEqual(0);
    expect(Math.max(...xs.map((a) => a[1]))).toBeGreaterThanOrEqual(256);
    const ys = plan.map((t) => [t.offsetY, t.offsetY + 256]);
    expect(Math.min(...ys.map((a) => a[0]))).toBeLessThanOrEqual(0);
    expect(Math.max(...ys.map((a) => a[1]))).toBeGreaterThanOrEqual(256);
  });

  it("below the shift threshold returns the plain tile unshifted", () => {
    expect(NAIP_SHIFT_MINZOOM).toBe(16);
    const z15 = 15;
    const t = tileOf(HARDING.lat, HARDING.lng, z15);
    const plan = planShiftedTile(z15, t.x, t.y, { eastM: 1.2, northM: -0.5 });
    expect(plan).toEqual([{ z: z15, x: t.x, y: t.y, offsetX: 0, offsetY: 0 }]);
  });

  it("skips neighbours that would fall outside the world's tile range", () => {
    const res = tileResolutionM(16);
    // tile x=0 with a west (negative) shift would want x-1 = -1
    const plan = planShiftedTile(16, 0, 100, { eastM: -3 * res, northM: 0 });
    expect(plan.every((t) => t.x >= 0 && t.y >= 0)).toBe(true);
  });
});
