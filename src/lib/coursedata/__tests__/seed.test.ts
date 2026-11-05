import { describe, it, expect } from "vitest";
import {
  slugify,
  slugFromOsmId,
  buildSeedJson,
  draftFromSeed,
  validateDraft,
  isSaveable,
  MAX_HOLES,
  parseGoToInput,
  centroidOf,
  haversineMeters,
  type SeedDraft,
} from "../seed";

// A minimal 2-hole draft near Pebble Beach (points are {lat,lng}).
function sampleDraft(): SeedDraft {
  return {
    name: "Pebble Beach",
    slug: "pebble-beach",
    holes: [
      {
        holeNumber: 1,
        par: 4,
        points: [
          { lat: 36.5665, lng: -121.9485 }, // tee
          { lat: 36.567, lng: -121.949 }, // green
        ],
      },
      {
        holeNumber: 2,
        // par intentionally unset
        points: [
          { lat: 36.568, lng: -121.95 }, // tee
          { lat: 36.5685, lng: -121.9505 }, // dogleg waypoint
          { lat: 36.569, lng: -121.951 }, // green
        ],
      },
    ],
  };
}

describe("seed — slugify", () => {
  it("lowercases and kebab-cases a normal name", () => {
    expect(slugify("Pebble Beach Golf Links")).toBe("pebble-beach-golf-links");
  });

  it("strips punctuation and parentheses", () => {
    expect(slugify("St. Andrews (Old)")).toBe("st-andrews-old");
  });

  it("collapses repeated separators and trims edges", () => {
    expect(slugify("  Foo!!!  Bar  ")).toBe("foo-bar");
    expect(slugify("--Foo__Bar--")).toBe("foo-bar");
  });

  it("keeps digits", () => {
    expect(slugify("TPC Sawgrass 17")).toBe("tpc-sawgrass-17");
  });

  it("returns empty string when nothing is usable", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("   ")).toBe("");
    expect(slugify("")).toBe("");
  });

  it("slugFromOsmId strips the manual/ prefix (and is a no-op otherwise)", () => {
    expect(slugFromOsmId("manual/pebble-beach")).toBe("pebble-beach");
    expect(slugFromOsmId("pebble-beach")).toBe("pebble-beach");
  });
});

describe("seed — buildSeedJson", () => {
  it("produces the exact top-level contract", () => {
    const json = buildSeedJson(sampleDraft());
    expect(json.osmId).toBe("manual/pebble-beach");
    expect(json.name).toBe("Pebble Beach");
    expect(json.holeCount).toBe(2);
    expect(json.boundary).toEqual([]);
    expect(json.tags).toEqual({ golf: "course", source: "manual-seed" });
  });

  it("centroid is the mean of ALL clicked points across all holes", () => {
    const json = buildSeedJson(sampleDraft());
    const lats = [36.5665, 36.567, 36.568, 36.5685, 36.569];
    const lngs = [-121.9485, -121.949, -121.95, -121.9505, -121.951];
    const meanLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const meanLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    expect(json.latitude).toBeCloseTo(meanLat, 10);
    expect(json.longitude).toBeCloseTo(meanLng, 10);
  });

  it("centerlineCoordinates use {lat,lng}; tee/flag use {latitude,longitude} (the asymmetry)", () => {
    const json = buildSeedJson(sampleDraft());
    const h1 = json.holes[0];
    // centerline points keep lat/lng keys
    expect(h1.centerlineCoordinates[0]).toEqual({ lat: 36.5665, lng: -121.9485 });
    expect(Object.keys(h1.centerlineCoordinates[0])).toEqual(["lat", "lng"]);
    // tee/flag use latitude/longitude keys
    expect(h1.teePosition).toEqual({ latitude: 36.5665, longitude: -121.9485 });
    expect(h1.flagPosition).toEqual({ latitude: 36.567, longitude: -121.949 });
    expect(Object.keys(h1.teePosition)).toEqual(["latitude", "longitude"]);
  });

  it("tee = first point, flag = last point (with dogleg waypoints in between)", () => {
    const json = buildSeedJson(sampleDraft());
    const h2 = json.holes[1];
    expect(h2.centerlineCoordinates).toHaveLength(3);
    expect(h2.teePosition).toEqual({ latitude: 36.568, longitude: -121.95 });
    expect(h2.flagPosition).toEqual({ latitude: 36.569, longitude: -121.951 });
  });

  it("omits par when unset, includes it when set", () => {
    const json = buildSeedJson(sampleDraft());
    expect(json.holes[0].par).toBe(4);
    expect("par" in json.holes[1]).toBe(false);
  });

  it("round-trips through draftFromSeed", () => {
    const json = buildSeedJson(sampleDraft());
    const draft = draftFromSeed(json);
    expect(draft.name).toBe("Pebble Beach");
    expect(draft.slug).toBe("pebble-beach");
    expect(draft.holes[0].par).toBe(4);
    expect(draft.holes[1].par).toBeUndefined();
    expect(draft.holes[1].points).toHaveLength(3);
    expect(draft.holes[0].points[0]).toEqual({ lat: 36.5665, lng: -121.9485 });
  });
});

describe("seed — validateDraft / isSaveable", () => {
  it("passes a valid draft with no errors", () => {
    const findings = validateDraft(sampleDraft());
    expect(findings.some((f) => f.level === "error")).toBe(false);
    expect(isSaveable(sampleDraft())).toBe(true);
  });

  it("errors on empty name", () => {
    const d = { ...sampleDraft(), name: "   " };
    const f = validateDraft(d);
    expect(f).toContainEqual(expect.objectContaining({ code: "name-required", level: "error" }));
    expect(isSaveable(d)).toBe(false);
  });

  it("errors on invalid slug", () => {
    const d = { ...sampleDraft(), slug: "Not A Slug" };
    const f = validateDraft(d);
    expect(f).toContainEqual(expect.objectContaining({ code: "slug-invalid", level: "error" }));
  });

  it("errors when there are no holes", () => {
    const d = { ...sampleDraft(), holes: [] };
    const f = validateDraft(d);
    expect(f).toContainEqual(expect.objectContaining({ code: "no-holes", level: "error" }));
  });

  it("errors on a hole with fewer than 2 points", () => {
    const d = sampleDraft();
    d.holes[0] = { holeNumber: 1, points: [{ lat: 36.5665, lng: -121.9485 }] };
    const f = validateDraft(d);
    expect(f).toContainEqual(
      expect.objectContaining({ code: "hole-min-points", level: "error", path: "holes[0]" })
    );
    expect(isSaveable(d)).toBe(false);
  });

  it("still warns on a hole >15km from the others, and now also blocks it", () => {
    const d = sampleDraft();
    // Move hole 2 ~200km away.
    d.holes[1].points = [
      { lat: 38.5, lng: -121.95 },
      { lat: 38.5005, lng: -121.9505 },
    ];
    const f = validateDraft(d);
    expect(f).toContainEqual(
      expect.objectContaining({ code: "hole-far", level: "warning", path: "holes[1]" })
    );
    // The advisory warning alone never blocked; the ported server rule does, because
    // saveCourseSeed rejects this exact draft with seed-far-point. Save must not be enabled
    // on something the server will refuse.
    expect(f).toContainEqual(expect.objectContaining({ code: "seed-far-point", level: "error" }));
    expect(isSaveable(d)).toBe(false);
  });

  it("a warning-only draft still saves (warnings never block)", () => {
    const d = sampleDraft();
    d.holes[1].holeNumber = 1; // duplicate number -> warning only
    expect(validateDraft(d).some((x) => x.level === "error")).toBe(false);
    expect(isSaveable(d)).toBe(true);
  });

  it("warns on duplicate hole numbers", () => {
    const d = sampleDraft();
    d.holes[1].holeNumber = 1;
    const f = validateDraft(d);
    expect(f).toContainEqual(
      expect.objectContaining({ code: "hole-duplicate-number", level: "warning" })
    );
  });

  it("does not flag far-hole with a single hole", () => {
    const d: SeedDraft = { name: "One", slug: "one", holes: [sampleDraft().holes[0]] };
    const f = validateDraft(d);
    expect(f.some((x) => x.code === "hole-far")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Server parity — every rule below is an ERROR in Backend seed-validator.ts, so a draft that
// trips one CANNOT be saveable here or the admin gets Save enabled on a payload saveCourseSeed
// rejects (and, before the api.ts findings fix, a bare "Rejected by the server.").
// ---------------------------------------------------------------------------
describe("seed — validateDraft parity with the server's seed validator", () => {
  /** n holes of 2 points, clustered at `lat`/`lng`; hole `farHole`'s green is 0.18deg (~20km) north. */
  function clusteredDraft(n: number, farHole: number | null = null): SeedDraft {
    const lat = 36.5;
    const lng = -121.95;
    return {
      name: "Cluster",
      slug: "cluster",
      holes: Array.from({ length: n }, (_, i) => ({
        holeNumber: i + 1,
        points: [
          { lat: lat + i * 0.0005, lng },
          { lat: (farHole === i ? lat + 0.18 : lat + i * 0.0005 + 0.0005), lng },
        ],
      })),
    };
  }

  it("blocks a single misclicked point the centroid-vs-siblings warning cannot see", () => {
    // 18 holes, one green 20km north. The all-points centroid shifts only 20/36 ~= 0.56km, so the
    // server measures ~19.4km and REJECTS; the sibling-centroid check measures that hole at ~10km
    // and stays silent. Before this rule the client emitted nothing at all for this draft.
    const d = clusteredDraft(18, 3);
    const f = validateDraft(d);

    expect(f.some((x) => x.code === "hole-far")).toBe(false); // the old check is blind here
    expect(f).toContainEqual(
      expect.objectContaining({ code: "seed-far-point", level: "error", path: "holes[3].points[1]" })
    );
    expect(f.filter((x) => x.code === "seed-far-point")).toHaveLength(1); // only the bad point
    expect(isSaveable(d)).toBe(false);
  });

  it("blocks a single-hole draft whose tee and green are far apart", () => {
    // The sibling-centroid check is skipped entirely for one hole; the server still rejects.
    const d: SeedDraft = {
      name: "One",
      slug: "one",
      holes: [{ holeNumber: 1, points: [{ lat: 36.5, lng: -121.95 }, { lat: 36.86, lng: -121.95 }] }],
    };
    const f = validateDraft(d);
    expect(f.filter((x) => x.code === "seed-far-point")).toHaveLength(2); // both ends, ~20km each
    expect(isSaveable(d)).toBe(false);
  });

  it("accepts a tight draft (no far-point findings)", () => {
    const d = clusteredDraft(18);
    expect(validateDraft(d).some((x) => x.code === "seed-far-point")).toBe(false);
    expect(isSaveable(d)).toBe(true);
  });

  it("blocks more than MAX_HOLES holes", () => {
    const d = clusteredDraft(MAX_HOLES + 1);
    const f = validateDraft(d);
    expect(f).toContainEqual(
      expect.objectContaining({ code: "seed-holes-count", level: "error", path: "holes" })
    );
    expect(isSaveable(d)).toBe(false);
  });

  it("accepts exactly MAX_HOLES holes (inclusive bound)", () => {
    const d = clusteredDraft(MAX_HOLES);
    expect(validateDraft(d).some((x) => x.level === "error")).toBe(false);
    expect(isSaveable(d)).toBe(true);
  });

  it("blocks a holeNumber outside 1..MAX_HOLES (the editor auto-assigns max+1 uncapped)", () => {
    const d = clusteredDraft(2);
    d.holes[1].holeNumber = MAX_HOLES + 1;
    const f = validateDraft(d);
    expect(f).toContainEqual(
      expect.objectContaining({ code: "seed-bad-range", level: "error", path: "holes[1]" })
    );
    expect(isSaveable(d)).toBe(false);

    const zero = clusteredDraft(1);
    zero.holes[0].holeNumber = 0;
    expect(validateDraft(zero).some((x) => x.code === "seed-bad-range")).toBe(true);
  });
});

describe("seed — parseGoToInput", () => {
  it("parses comma-separated lat, lng (Google Maps copy)", () => {
    expect(parseGoToInput("36.5674, -121.9490")).toEqual({ lat: 36.5674, lng: -121.949 });
  });

  it("parses whitespace-separated lat lng", () => {
    expect(parseGoToInput("36.5674 -121.9490")).toEqual({ lat: 36.5674, lng: -121.949 });
  });

  it("tolerates extra whitespace and no space after comma", () => {
    expect(parseGoToInput("  36.5674,-121.949  ")).toEqual({ lat: 36.5674, lng: -121.949 });
  });

  it("rejects a single number", () => {
    expect(parseGoToInput("36.5674")).toBeNull();
  });

  it("rejects three tokens", () => {
    expect(parseGoToInput("36.5, -121.9, 5")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(parseGoToInput("Pebble Beach")).toBeNull();
    expect(parseGoToInput("")).toBeNull();
  });

  it("rejects out-of-range coordinates", () => {
    expect(parseGoToInput("100, -121")).toBeNull(); // lat > 90
    expect(parseGoToInput("36, -200")).toBeNull(); // lng < -180
  });
});

describe("seed — geometry helpers", () => {
  it("centroidOf averages points and handles empty", () => {
    expect(centroidOf([{ lat: 0, lng: 0 }, { lat: 2, lng: 4 }])).toEqual({ lat: 1, lng: 2 });
    expect(centroidOf([])).toEqual({ lat: 0, lng: 0 });
  });

  it("haversineMeters ~ 111km per degree of latitude", () => {
    const d = haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});
