import { describe, it, expect } from "vitest";
import {
  flipAudience,
  flipLabel,
  canFlipServing,
  isServingMlgen,
  isUnreviewedButServed,
  isBulkSafeStatus,
  BULK_ACTIONS,
} from "../publish";
import type { CourseIndexRow } from "../types";

function row(p: Partial<CourseIndexRow>): CourseIndexRow {
  return {
    osmId: "way/1",
    name: "C",
    latitude: 0,
    longitude: 0,
    geohashPrefix: "9q",
    dataTier: "full",
    region: "9q",
    ...p,
  };
}

describe("publish — flip audience wording (B5.1)", () => {
  it("mlgenAvailable names v2 clients; mlgenServeAll names ALL clients", () => {
    expect(flipAudience("mlgenAvailable", true)).toMatch(/v2 clients/);
    expect(flipAudience("mlgenServeAll", true)).toMatch(/ALL clients/);
    expect(flipAudience("mlgenServeAll", false)).toMatch(/falls back to the legacy/);
    expect(flipLabel("mlgenAvailable")).toMatch(/v2/);
  });

  it("flips are disabled until the course is approved", () => {
    expect(canFlipServing("approved")).toBe(true);
    expect(canFlipServing("unreviewed")).toBe(false);
    expect(canFlipServing("needs_fix")).toBe(false);
    expect(canFlipServing(null)).toBe(false);
  });
});

describe("publish — serving hazards", () => {
  it("isServingMlgen true when either flag set", () => {
    expect(isServingMlgen(row({ mlgenAvailable: true }))).toBe(true);
    expect(isServingMlgen(row({ mlgenServeAll: true }))).toBe(true);
    expect(isServingMlgen(row({}))).toBe(false);
  });

  it("unreviewed-but-served hazard: served while not approved", () => {
    expect(isUnreviewedButServed(row({ mlgenServeAll: true, reviewStatus: "unreviewed" }))).toBe(true);
    expect(isUnreviewedButServed(row({ mlgenServeAll: true, reviewStatus: "approved" }))).toBe(false);
    expect(isUnreviewedButServed(row({ reviewStatus: "unreviewed" }))).toBe(false); // not served
  });
});

describe("publish — bulk safety (B5.2/B5.3)", () => {
  it("bulk actions are reviewStatus-only (approve/needs_fix/reject), never a serve flip", () => {
    expect(BULK_ACTIONS).toEqual(["approved", "needs_fix", "rejected"]);
    expect(isBulkSafeStatus("approved")).toBe(true);
    expect(isBulkSafeStatus("needs_fix")).toBe(true);
    expect(isBulkSafeStatus("rejected")).toBe(true);
    // there is no bulk path that mutates mlgenAvailable/mlgenServeAll
    expect(BULK_ACTIONS).not.toContain("mlgenServeAll");
    expect(BULK_ACTIONS).not.toContain("mlgenAvailable");
  });
});
