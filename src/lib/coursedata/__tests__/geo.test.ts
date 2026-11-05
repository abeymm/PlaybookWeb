import { describe, it, expect } from "vitest";
import {
  coordToLngLat,
  lngLatToCoord,
  positionToLngLat,
  coordsToRing,
  ringToCoords,
  closeRing,
  boundaryRings,
  ringLooksSwapped,
  ringLooksSwappedVsCourse,
  bboxOfLngLats,
  courseKeyFor,
  osmIdFromKey,
} from "../geo";

describe("geo — point/ring conversions (the #1 bug class)", () => {
  it("B1.1 {lat,lng} ⇄ [lng,lat] round-trips with NO axis swap", () => {
    const c = { lat: 37.79, lng: -122.46 };
    const p = coordToLngLat(c);
    expect(p).toEqual([-122.46, 37.79]); // lng first, lat second
    expect(lngLatToCoord(p)).toEqual(c);
  });

  it("B1.2 feature coords are {lat,lng}; ring order [lng,lat] respected in both directions", () => {
    const coords = [
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
    ];
    const ring = coordsToRing(coords);
    expect(ring).toEqual([
      [2, 1],
      [4, 3],
    ]);
    expect(ringToCoords(ring)).toEqual(coords);
  });

  it("position {latitude,longitude} → [lng,lat]", () => {
    expect(positionToLngLat({ latitude: 37, longitude: -122 })).toEqual([-122, 37]);
  });

  it("closeRing appends the first point only when open", () => {
    const open: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
    ];
    expect(closeRing(open)).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ]);
    const closed: [number, number][] = [
      [0, 0],
      [1, 0],
      [0, 0],
    ];
    expect(closeRing(closed)).toEqual(closed);
  });

  it("B1.5 high-precision coord survives round-trip", () => {
    const c = { lat: 37.79190540886076, lng: -122.46814525569626 };
    expect(lngLatToCoord(coordToLngLat(c))).toEqual(c);
  });

  it("boundaryRings flattens nested [polygon][ring][pt] to terminal [lng,lat] rings", () => {
    const boundary = [
      [
        [
          [-122, 37],
          [-122.1, 37.1],
          [-122, 37],
        ],
      ],
    ];
    const rings = boundaryRings(boundary);
    expect(rings).toHaveLength(1);
    expect(rings[0][0]).toEqual([-122, 37]);
  });
});

describe("geo — swapped-order detection guard", () => {
  it("flags a western-US ring stored as [lat,lng] (magnitude heuristic)", () => {
    // A correctly-ordered [lng,lat] ring near Presidio.
    const ok: [number, number][] = [
      [-122.46, 37.79],
      [-122.47, 37.8],
    ];
    expect(ringLooksSwapped(ok)).toBe(false);
    // The same ring stored as [lat,lng] — |x|<=90 and |y|>90.
    const swapped = ok.map(([a, b]) => [b, a]) as [number, number][];
    expect(ringLooksSwapped(swapped)).toBe(true);
  });

  it("reference check catches eastern-US swaps the magnitude heuristic misses", () => {
    // Eastern-US course near lng -80 (|lng|<90 → magnitude heuristic is blind).
    const courseLat = 33.5;
    const courseLng = -80.0;
    const correct: [number, number][] = [
      [-80.0, 33.5],
      [-80.01, 33.51],
    ];
    const swapped = correct.map(([a, b]) => [b, a]) as [number, number][];
    expect(ringLooksSwapped(swapped)).toBe(false); // magnitude heuristic blind
    expect(ringLooksSwappedVsCourse(swapped, courseLat, courseLng)).toBe(true); // reference check catches it
    expect(ringLooksSwappedVsCourse(correct, courseLat, courseLng)).toBe(false);
  });

  it("bboxOfLngLats returns min/max over points", () => {
    const bbox = bboxOfLngLats([
      [-122, 37],
      [-121, 38],
    ]);
    expect(bbox).toEqual([
      [-122, 37],
      [-121, 38],
    ]);
    expect(bboxOfLngLats([])).toBeNull();
  });
});

describe("geo — courseKey ⇄ osmId (T5, one shared definition)", () => {
  it("B1.3 courseKeyFor / osmIdFromKey round-trip", () => {
    expect(courseKeyFor("way/16650363")).toBe("way-16650363");
    expect(osmIdFromKey("way-16650363")).toBe("way/16650363");
    expect(osmIdFromKey(courseKeyFor("relation/12345"))).toBe("relation/12345");
  });

  it("B1.4 multi-course suffix survives the reverse (only the leading type token is un-dashed)", () => {
    expect(osmIdFromKey("way-123-hole1-sub")).toBe("way/123-hole1-sub");
  });
});
