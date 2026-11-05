import { describe, it, expect } from "vitest";
import { rankQueue, buildQueue, isQueued, latestBatchId, isBulkApproveEligible } from "../queue";
import type { CourseIndexRow } from "../types";

function row(p: Partial<CourseIndexRow>): CourseIndexRow {
  return {
    osmId: p.osmId ?? "way/1",
    name: p.name ?? "C",
    latitude: 0,
    longitude: 0,
    geohashPrefix: "9q",
    dataTier: "full",
    region: "9q",
    ...p,
  };
}

describe("queue — ranking (F4)", () => {
  it("B7.1 sorts by demand desc, then qcErrors desc, then qcWarnings desc", () => {
    const rows = [
      row({ osmId: "a", demandCount: 1, qcErrors: 5, qcWarnings: 0 }),
      row({ osmId: "b", demandCount: 10, qcErrors: 0, qcWarnings: 0 }),
      row({ osmId: "c", demandCount: 10, qcErrors: 3, qcWarnings: 1 }),
      row({ osmId: "d", demandCount: 10, qcErrors: 3, qcWarnings: 9 }),
    ];
    const order = rankQueue(rows).map((r) => r.osmId);
    // b,c,d all demand 10; among them qcErrors: c/d(3) before b(0); between c and d, warnings 9>1 → d,c
    expect(order).toEqual(["d", "c", "b", "a"]);
  });

  it("B7.2 null demand/qc sort LAST and never crash", () => {
    const rows = [
      row({ osmId: "hasDemand", demandCount: 2 }),
      row({ osmId: "nullDemand", demandCount: null, qcErrors: null, qcWarnings: null }),
    ];
    const order = rankQueue(rows).map((r) => r.osmId);
    expect(order).toEqual(["hasDemand", "nullDemand"]);
  });
});

describe("queue — filtering", () => {
  it("B7.3 unreviewed (incl. null) and needs_fix are queued; approved/rejected are not", () => {
    expect(isQueued(row({ reviewStatus: "unreviewed" }))).toBe(true);
    expect(isQueued(row({ reviewStatus: null }))).toBe(true); // null = unreviewed
    expect(isQueued(row({ reviewStatus: "needs_fix" }))).toBe(true);
    expect(isQueued(row({ reviewStatus: "approved" }))).toBe(false);
    expect(isQueued(row({ reviewStatus: "rejected" }))).toBe(false);
    expect(isQueued(row({ reviewStatus: "in_review" }))).toBe(false);
  });

  it("B7.4 buildQueue defaults to the latest batch", () => {
    const rows = [
      row({ osmId: "old", reviewStatus: "unreviewed", batchId: "2026-07-01", demandCount: 5 }),
      row({ osmId: "new", reviewStatus: "unreviewed", batchId: "2026-07-18", demandCount: 1 }),
    ];
    expect(latestBatchId(rows)).toBe("2026-07-18");
    const q = buildQueue(rows, { batchId: latestBatchId(rows) });
    expect(q.map((r) => r.osmId)).toEqual(["new"]);
  });
});

describe("queue — bulk-approve eligibility (DT3)", () => {
  it("clean rows only (qcErrors=0 ∧ qcWarnings=0)", () => {
    expect(isBulkApproveEligible(row({ qcErrors: 0, qcWarnings: 0 }))).toBe(true);
    expect(isBulkApproveEligible(row({ qcErrors: null, qcWarnings: null }))).toBe(true);
    expect(isBulkApproveEligible(row({ qcErrors: 1, qcWarnings: 0 }))).toBe(false);
    expect(isBulkApproveEligible(row({ qcErrors: 0, qcWarnings: 2 }))).toBe(false);
  });
});
