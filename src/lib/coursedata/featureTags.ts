// featureTags.ts — THE class → OSM-tags mapping.
//
// Direct port of FEATURE_TAGS from:
//   Training/segformer_green/golfapi_pipeline/coursedata_common.py:23-37
// iOS derives a feature's type from tags["golf"] (OSMModelsV2.swift golfFeatureType), NOT
// from the top-level "golfFeatureType" string — so changing a feature's class in the editor
// means rewriting tags.golf via this table.
//
// Historical bugs preserved here: "water" ⇒ golf:water_hazard (had NO golf key before → iOS
// rendered "unknown"); "rough" ⇒ golf:rough (had no entry at all).
//
// `tree` is INTENTIONALLY greyed/disabled in pickers: iOS GolfFeatureType has no `tree` case
// (coursedata_common.py:32-36), so a golf:tree feature is decoded to nothing and rendered
// nowhere in the current app (R14). It stays in the table only so existing tree features keep
// a distinct class instead of being conflated with rough.

import type { FeatureClass } from "./types";

/** class name (pipeline) → OSM tags. tags.golf MUST be an iOS-recognized value. */
export const FEATURE_TAGS: Record<FeatureClass, Record<string, string>> = {
  green: { golf: "green", leisure: "pitch", sport: "golf" },
  tee: { golf: "tee" },
  bunker: { golf: "bunker", natural: "sand" },
  water: { golf: "water_hazard", natural: "water" },
  fairway: { golf: "fairway" },
  rough: { golf: "rough" },
  // Not rendered by current iOS (no GolfFeatureType.tree). Greyed in pickers.
  tree: { golf: "tree" },
};

/** The classes iOS actually renders — the enabled set for the class picker. */
export const ACTIVE_CLASSES: FeatureClass[] = [
  "green",
  "tee",
  "bunker",
  "water",
  "fairway",
  "rough",
];

/** All classes, tree last (shown disabled/greyed in the picker). */
export const ALL_CLASSES: FeatureClass[] = [...ACTIVE_CLASSES, "tree"];

/** True if a class is not rendered by the current iOS app (currently only `tree`). */
export function isDisabledClass(cls: FeatureClass): boolean {
  return cls === "tree";
}

/** Resolve a feature's class from its tags.golf value (inverse of FEATURE_TAGS). */
export function classFromTags(
  tags: Record<string, string> | undefined
): FeatureClass | null {
  const golf = tags?.golf;
  if (!golf) return null;
  if (golf === "water_hazard" || golf === "water") return "water";
  if ((ALL_CLASSES as string[]).includes(golf)) return golf as FeatureClass;
  return null;
}

/**
 * Produce the tags object for a class, preserving any non-golf-semantic keys already on the
 * feature (e.g. name) but replacing the golf/leisure/sport/natural class markers this table
 * owns, so switching class never leaves a stale marker behind.
 */
export function tagsForClass(
  cls: FeatureClass,
  existing?: Record<string, string>
): Record<string, string> {
  const OWNED = new Set(["golf", "leisure", "sport", "natural"]);
  const preserved: Record<string, string> = {};
  if (existing) {
    for (const [k, v] of Object.entries(existing)) {
      if (!OWNED.has(k)) preserved[k] = v;
    }
  }
  return { ...preserved, ...FEATURE_TAGS[cls] };
}
