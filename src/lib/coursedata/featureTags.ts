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
// `tree` is an ACTIVE class: iOS added GolfFeatureType.tree → SurfaceType.trees on 2026-09-18
// (commit eae558d1, OSMModelsV2.swift ~904-924), and the pipeline emits golf=tree features by
// default (Training/segformer_green/golfapi_pipeline/coursedata_config.py DEFAULT_EMIT_CLASSES,
// commit 1fea1e4). It used to be greyed/disabled in pickers — that stopped being true.

import type { FeatureClass } from "./types";

/** class name (pipeline) → OSM tags. tags.golf MUST be an iOS-recognized value. */
export const FEATURE_TAGS: Record<FeatureClass, Record<string, string>> = {
  green: { golf: "green", leisure: "pitch", sport: "golf" },
  tee: { golf: "tee" },
  bunker: { golf: "bunker", natural: "sand" },
  water: { golf: "water_hazard", natural: "water" },
  fairway: { golf: "fairway" },
  rough: { golf: "rough" },
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
  "tree",
];

/**
 * All classes. Currently identical to ACTIVE_CLASSES (every FeatureClass iOS renders) — kept as
 * a separate export for callers that mean "every known class" vs. "every pickable class", so a
 * future class can land here ahead of iOS support without also becoming pickable.
 */
export const ALL_CLASSES: FeatureClass[] = [...ACTIVE_CLASSES];

/** True if a class is not rendered by the current iOS app. None today; kept for a future class
 *  added to ALL_CLASSES before iOS supports it. */
export function isDisabledClass(cls: FeatureClass): boolean {
  return !ACTIVE_CLASSES.includes(cls);
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
