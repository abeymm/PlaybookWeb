import { describe, it, expect } from "vitest";
import {
  FEATURE_TAGS,
  ACTIVE_CLASSES,
  ALL_CLASSES,
  isDisabledClass,
  classFromTags,
  tagsForClass,
} from "../featureTags";

describe("featureTags — parity with coursedata_common.py", () => {
  it("B4.1 mapping matches the Python FEATURE_TAGS (incl. water⇒water_hazard, the historical bug)", () => {
    expect(FEATURE_TAGS.green).toEqual({ golf: "green", leisure: "pitch", sport: "golf" });
    expect(FEATURE_TAGS.tee).toEqual({ golf: "tee" });
    expect(FEATURE_TAGS.bunker).toEqual({ golf: "bunker", natural: "sand" });
    expect(FEATURE_TAGS.water).toEqual({ golf: "water_hazard", natural: "water" });
    expect(FEATURE_TAGS.fairway).toEqual({ golf: "fairway" });
    expect(FEATURE_TAGS.rough).toEqual({ golf: "rough" });
    expect(FEATURE_TAGS.tree).toEqual({ golf: "tree" });
  });

  it("B4.2 class → tags → class round-trips for every iOS-recognized class", () => {
    for (const cls of ACTIVE_CLASSES) {
      expect(classFromTags(tagsForClass(cls))).toBe(cls);
    }
  });

  it("classFromTags resolves both water and water_hazard to water", () => {
    expect(classFromTags({ golf: "water" })).toBe("water");
    expect(classFromTags({ golf: "water_hazard" })).toBe("water");
  });

  it("B3.6 tree is an active class (iOS GolfFeatureType.tree added 2026-09-18)", () => {
    expect(isDisabledClass("tree")).toBe(false);
    expect(ACTIVE_CLASSES).toContain("tree");
    for (const c of ACTIVE_CLASSES) expect(isDisabledClass(c)).toBe(false);
    expect(ALL_CLASSES[ALL_CLASSES.length - 1]).toBe("tree");
    expect(ALL_CLASSES).toEqual(ACTIVE_CLASSES);
  });

  it("tagsForClass preserves non-owned keys (e.g. name) and replaces class markers", () => {
    const out = tagsForClass("bunker", { golf: "green", leisure: "pitch", name: "Bunker 3" });
    expect(out.golf).toBe("bunker");
    expect(out.natural).toBe("sand");
    expect(out.leisure).toBeUndefined(); // owned key removed
    expect(out.name).toBe("Bunker 3"); // preserved
  });
});
