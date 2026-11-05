import { describe, it, expect } from "vitest";
import { reviewStatus, type ReviewStatusInput } from "../reviewStatus";

const base: ReviewStatusInput = { valid: true, anomalies: [], fragmentOf: null, exclude: [] };

describe("reviewStatus", () => {
  it("is clean when valid, no anomalies, and not a fragment/exclusion", () => {
    expect(reviewStatus(base)).toBe("clean");
  });

  it("is needs-review when valid with at least one anomaly kind", () => {
    expect(reviewStatus({ ...base, anomalies: ["par-vs-length"] })).toBe("needs-review");
  });

  it("dedupes-agnostic: multiple anomaly kinds still just need-review", () => {
    expect(reviewStatus({ ...base, anomalies: ["par-vs-length", "holes-not-contiguous"] })).toBe("needs-review");
  });

  it("is invalid when the generated JSON exists but no report was produced", () => {
    expect(reviewStatus({ ...base, valid: false })).toBe("invalid");
  });

  it("is fragment when fragmentOf is set, even if otherwise valid and clean", () => {
    expect(reviewStatus({ ...base, fragmentOf: "relation-11015584" })).toBe("fragment");
  });

  it("is fragment when exclude is non-empty, even if otherwise valid and clean", () => {
    expect(reviewStatus({ ...base, exclude: ["no-naip-coverage"] })).toBe("fragment");
  });

  it("prioritizes fragment over invalid", () => {
    expect(reviewStatus({ ...base, valid: false, fragmentOf: "relation-11015584" })).toBe("fragment");
  });

  it("prioritizes fragment over needs-review", () => {
    expect(reviewStatus({ ...base, anomalies: ["holes-not-contiguous"], exclude: ["fragment-of-course"] })).toBe(
      "fragment",
    );
  });
});
