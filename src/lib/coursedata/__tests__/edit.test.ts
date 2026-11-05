import { describe, it, expect } from "vitest";
import {
  changeFeatureClass,
  assignFeatureToHole,
  unassignFeatureFromHole,
  reassignFeatureToHole,
  deleteFeature,
  updateFeatureGeometry,
  addFeature,
  classListKey,
} from "../edit";
import { validateCourseData, hasErrors } from "../validator";
import type { OSMCourse, OSMFeature, OSMHole, Coordinate } from "../types";

function feat(osmId: string, cls: string, coords: Coordinate[]): OSMFeature {
  const golf = cls === "water" ? "water_hazard" : cls;
  return { osmId, tags: { golf }, coordinates: coords, surfaceType: cls };
}
const ring: Coordinate[] = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 1, lng: 1 },
];

function makeCourse(): OSMCourse {
  const features: OSMFeature[] = [
    feat("f-green", "green", ring),
    feat("f-tee", "tee", ring),
    feat("f-bunker", "bunker", ring),
    feat("f-fair", "fairway", ring),
  ];
  const holeA: OSMHole = {
    id: "h1",
    osmId: "h1",
    courseId: "c",
    holeNumber: 1,
    par: 4,
    tags: { golf: "hole" },
    featureIds: ["f-green", "f-tee", "f-bunker", "f-fair"],
    teeIds: ["f-tee"],
    greenIds: ["f-green"],
    fairwayIds: ["f-fair"],
    hasData: true,
  };
  const holeB: OSMHole = {
    id: "h2",
    osmId: "h2",
    courseId: "c",
    holeNumber: 2,
    par: 4,
    tags: { golf: "hole" },
    featureIds: [],
    teeIds: [],
    greenIds: [],
    fairwayIds: [],
    hasData: true,
  };
  return {
    osmId: "way/999",
    name: "Test",
    latitude: 0,
    longitude: 0,
    tags: {},
    holes: [holeA, holeB],
    features,
  };
}

describe("edit — class change (B3.5) rewrites tags.golf via FEATURE_TAGS", () => {
  it("green→bunker sets tags.golf=bunker and drops it from greenIds", () => {
    const before = makeCourse();
    const after = changeFeatureClass(before, "f-green", "bunker");
    const f = after.features.find((x) => x.osmId === "f-green")!;
    expect(f.tags.golf).toBe("bunker");
    expect(after.holes[0].greenIds).not.toContain("f-green");
    // pure — original untouched
    expect(before.features.find((x) => x.osmId === "f-green")!.tags.golf).toBe("green");
  });

  it("water uses golf:water_hazard (the historical bug)", () => {
    const after = changeFeatureClass(makeCourse(), "f-bunker", "water");
    expect(after.features.find((x) => x.osmId === "f-bunker")!.tags.golf).toBe("water_hazard");
  });

  it("tee→green moves membership between teeIds and greenIds", () => {
    const after = changeFeatureClass(makeCourse(), "f-tee", "green");
    expect(after.holes[0].teeIds).not.toContain("f-tee");
    expect(after.holes[0].greenIds).toContain("f-tee");
  });
});

describe("edit — hole reassignment consistency (B3.1/B3.2)", () => {
  it("reassign moves the id + its class list from hole A to hole B", () => {
    const after = reassignFeatureToHole(makeCourse(), "f-green", 1, 2);
    expect(after.holes[0].featureIds).not.toContain("f-green");
    expect(after.holes[0].greenIds).not.toContain("f-green");
    expect(after.holes[1].featureIds).toContain("f-green");
    expect(after.holes[1].greenIds).toContain("f-green");
  });

  it("assign to a hole also populates the matching class list", () => {
    const after = assignFeatureToHole(makeCourse(), "f-tee", 2);
    expect(after.holes[1].featureIds).toContain("f-tee");
    expect(after.holes[1].teeIds).toContain("f-tee");
  });

  it("B3.3 unassign removes from featureIds AND every class list; feature persists on course", () => {
    const after = unassignFeatureFromHole(makeCourse(), "f-green", 1);
    expect(after.holes[0].featureIds).not.toContain("f-green");
    expect(after.holes[0].greenIds).not.toContain("f-green");
    expect(after.features.some((f) => f.osmId === "f-green")).toBe(true);
  });

  it("B3.4 post-reassignment the doc has no dangling refs", () => {
    const after = reassignFeatureToHole(makeCourse(), "f-fair", 1, 2);
    const findings = validateCourseData([after], true);
    expect(findings.filter((f) => f.code === "dangling-ref")).toHaveLength(0);
  });
});

describe("edit — delete cleans all id lists", () => {
  it("delete removes the feature and every reference (no dangling ref)", () => {
    const after = deleteFeature(makeCourse(), "f-tee");
    expect(after.features.some((f) => f.osmId === "f-tee")).toBe(false);
    expect(after.holes[0].featureIds).not.toContain("f-tee");
    expect(after.holes[0].teeIds).not.toContain("f-tee");
    expect(hasErrors(validateCourseData([after], true))).toBe(false);
  });
});

describe("edit — geometry + add", () => {
  it("updateFeatureGeometry replaces the ring and recomputes centroid", () => {
    const newCoords: Coordinate[] = [
      { lat: 10, lng: 10 },
      { lat: 10, lng: 12 },
      { lat: 12, lng: 12 },
    ];
    const after = updateFeatureGeometry(makeCourse(), "f-bunker", newCoords);
    const f = after.features.find((x) => x.osmId === "f-bunker")!;
    expect(f.coordinates).toEqual(newCoords);
    expect(f.centroid).toEqual({ lat: (10 + 10 + 12) / 3, lng: (10 + 12 + 12) / 3 });
  });

  it("addFeature appends a manual feature and assigns it to the hole", () => {
    const { course: after, featureOsmId } = addFeature(makeCourse(), "bunker", ring, 2);
    expect(after.features.some((f) => f.osmId === featureOsmId)).toBe(true);
    expect(after.holes[1].featureIds).toContain(featureOsmId);
    expect(featureOsmId).toContain("manual");
  });
});

describe("edit — class list mapping", () => {
  it("classListKey maps tee/green/fairway; others → null", () => {
    expect(classListKey("tee")).toBe("teeIds");
    expect(classListKey("green")).toBe("greenIds");
    expect(classListKey("fairway")).toBe("fairwayIds");
    expect(classListKey("bunker")).toBeNull();
    expect(classListKey("water")).toBeNull();
    expect(classListKey("tree")).toBeNull();
  });
});
