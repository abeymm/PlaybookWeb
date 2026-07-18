// colors.ts — per-class map-overlay colors + reviewStatus chip palette.
//
// CLASS COLORS: ported from the iOS map-overlay palette, chosen (per its own docstring) for
// "readability against aerial imagery, not UI chrome":
//   iOS/Playbook/UI/PolygonAnnotation/SurfaceTypeMapStyle.swift  (mapFillColor / mapStrokeColor)
// This is the context-matched source pinned by Design Resolution DT1 (four incompatible iOS
// palettes exist; iOS DESIGN.md forbids merging SurfaceTypeMapStyle with CourseEditorSurfaceColors).
// viewer.html's palette is deliberately NOT used for colors (Pass 5 D8): it is a layout/interaction
// reference only.
//
// SwiftUI Color.* is mapped to its iOS system-color sRGB hex (the values the app renders):
//   .green→#34C759 .blue→#007AFF .yellow→#FFCC00 .cyan→#32ADE6 .brown→#A2845E
// Fill opacities come straight from the Swift `.opacity(x)` calls.

import type { FeatureClass } from "./types";

export interface ClassStyle {
  /** Fill color (hex). */
  fill: string;
  /** Fill opacity (0-1), from the Swift .opacity() call. */
  fillOpacity: number;
  /** Stroke/line color (hex). */
  stroke: string;
}

/**
 * Per-class map styling. Source: SurfaceTypeMapStyle.swift
 *   green→.green, fairway→.green.opacity(0.7), tee→.blue, bunker→.yellow,
 *   water→.cyan (stroke .blue), rough→.brown, tree→.green.opacity(0.5)
 * mapStrokeColor: water→.blue, default→black@0.7.
 */
export const CLASS_STYLES: Record<FeatureClass, ClassStyle> = {
  green: { fill: "#34C759", fillOpacity: 0.85, stroke: "#000000" },
  fairway: { fill: "#34C759", fillOpacity: 0.7, stroke: "#000000" },
  tee: { fill: "#007AFF", fillOpacity: 0.85, stroke: "#000000" },
  bunker: { fill: "#FFCC00", fillOpacity: 0.85, stroke: "#000000" },
  water: { fill: "#32ADE6", fillOpacity: 0.8, stroke: "#007AFF" },
  rough: { fill: "#A2845E", fillOpacity: 0.55, stroke: "#000000" },
  tree: { fill: "#34C759", fillOpacity: 0.5, stroke: "#000000" },
};

/** Solid swatch color for legends / class toggles. */
export function classSwatch(cls: FeatureClass): string {
  return CLASS_STYLES[cls].fill;
}

/** Centerline colors — primary vs per-tee (must be distinguishable, Spec §W2). */
export const CENTERLINE_PRIMARY = "#FF9F0A"; // orange, high-contrast over turf
export const CENTERLINE_PER_TEE = "#FFFFFF"; // white, thinner

// ---------------------------------------------------------------------------
// reviewStatus chip palette (Design Resolutions):
//   grey=unreviewed, blue=in_review, red=needs_fix/errors, amber=warnings,
//   green=approved, slate=rejected.
// Status chips are semantic map/state indicators (a common exception to the brand-token rule),
// so they use explicit Tailwind utility classes rather than the amber brand token, keeping each
// status visually distinct. Theme-aware via Tailwind's dark: variants.
// ---------------------------------------------------------------------------
import type { ReviewStatus } from "./types";

export interface ChipStyle {
  label: string;
  /** Tailwind classes for a small status badge. */
  className: string;
}

export const REVIEW_STATUS_CHIPS: Record<ReviewStatus, ChipStyle> = {
  unreviewed: {
    label: "Unreviewed",
    className:
      "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  },
  in_review: {
    label: "In review",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  needs_fix: {
    label: "Needs fix",
    className:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  approved: {
    label: "Approved",
    className:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-slate-200 text-slate-600 border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600",
  },
};

/** Chip style for a (possibly null/unknown) reviewStatus — defaults to unreviewed. */
export function reviewChip(status: ReviewStatus | null | undefined): ChipStyle {
  return REVIEW_STATUS_CHIPS[status ?? "unreviewed"] ?? REVIEW_STATUS_CHIPS.unreviewed;
}

/** QC-severity chip: red for any error, amber for warnings only, muted green for clean. */
export function qcSeverityChip(
  qcErrors: number | null | undefined,
  qcWarnings: number | null | undefined
): ChipStyle {
  const e = qcErrors ?? 0;
  const w = qcWarnings ?? 0;
  if (e > 0) {
    return {
      label: `${e} error${e === 1 ? "" : "s"}`,
      className:
        "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    };
  }
  if (w > 0) {
    return {
      label: `${w} warning${w === 1 ? "" : "s"}`,
      className:
        "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    };
  }
  return {
    label: "Clean",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900",
  };
}
