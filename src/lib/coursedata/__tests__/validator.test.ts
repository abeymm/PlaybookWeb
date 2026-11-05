import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateCourseData, splitFindings, hasErrors } from "../validator";
import type { CourseData } from "../types";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

const fixturePath = fileURLToPath(
  new URL("./fixtures/coursedata_way-16650363_mlgen.json", import.meta.url)
);
const golden = JSON.parse(readFileSync(fixturePath, "utf8")) as CourseData;

function codeSet(findings: ReturnType<typeof validateCourseData>, level: "error" | "warning") {
  return new Set(findings.filter((f) => f.level === level).map((f) => f.code));
}

describe("validator — golden fixture parity (strict_tags)", () => {
  it("B2.1 / A1.1 golden fixture yields ZERO findings under strict tags (matches Python baseline)", () => {
    const findings = validateCourseData(golden, true);
    expect(findings).toEqual([]);
    expect(hasErrors(findings)).toBe(false);
  });
});

describe("validator — the 6 corruption codes (Python parity)", () => {
  it("a) delete tags.golf → error missing-golf-tag; blocks save", () => {
    const d = clone(golden);
    delete d[0].features[0].tags.golf;
    const f = validateCourseData(d, true);
    expect(codeSet(f, "error")).toEqual(new Set(["missing-golf-tag"]));
    expect(hasErrors(f)).toBe(true);
  });

  it("b) dangling featureId → error dangling-ref", () => {
    const d = clone(golden);
    d[0].holes[0].featureIds.push("does-not-exist");
    const f = validateCourseData(d, true);
    expect(codeSet(f, "error")).toEqual(new Set(["dangling-ref"]));
  });

  it("c) swap a western boundary ring → error coord-order-swap", () => {
    const d = clone(golden);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ring = (d[0].boundary as any)[0][0] as number[][];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d[0].boundary as any)[0][0] = ring.map((p) => [p[1], p[0]]);
    const f = validateCourseData(d, true);
    expect(codeSet(f, "error")).toEqual(new Set(["coord-order-swap"]));
  });

  it("d) unclose a boundary ring → WARNING open-ring, does NOT block save (R5)", () => {
    const d = clone(golden);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ring = (d[0].boundary as any)[0][0] as number[][];
    if (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring.pop();
    const f = validateCourseData(d, true);
    expect(codeSet(f, "warning").has("open-ring")).toBe(true);
    expect(hasErrors(f)).toBe(false);
  });

  it("e) par:9 → error bad-par", () => {
    const d = clone(golden);
    d[0].holes[0].par = 9;
    const f = validateCourseData(d, true);
    expect(codeSet(f, "error")).toEqual(new Set(["bad-par"]));
  });

  it("f) non-contiguous holes → WARNING holes-not-contiguous, does NOT block (R5)", () => {
    const d = clone(golden);
    d[0].holes[0].holeNumber = 99;
    const f = validateCourseData(d, true);
    expect(codeSet(f, "warning").has("holes-not-contiguous")).toBe(true);
    expect(hasErrors(f)).toBe(false);
  });
});

describe("validator — root cases", () => {
  it("A1.9 non-array → root-not-array", () => {
    const f = validateCourseData({} as unknown);
    expect(f).toEqual([{ level: "error", code: "root-not-array", path: "root", msg: expect.any(String) }]);
  });
  it("A1.10 empty array → root-empty", () => {
    const f = validateCourseData([]);
    expect(f.map((x) => x.code)).toEqual(["root-empty"]);
  });
});

describe("validator — strict vs non-strict tags", () => {
  it("missing golf tag is a WARNING when not strict, ERROR when strict", () => {
    const d = clone(golden);
    delete d[0].features[0].tags.golf;
    expect(codeSet(validateCourseData(d, false), "warning").has("missing-golf-tag")).toBe(true);
    expect(codeSet(validateCourseData(d, false), "error").has("missing-golf-tag")).toBe(false);
    expect(codeSet(validateCourseData(d, true), "error").has("missing-golf-tag")).toBe(true);
  });

  it("B2.3 warnings alone do not block the save (splitFindings)", () => {
    const d = clone(golden);
    d[0].holes[0].holeNumber = 99; // holes-not-contiguous warning
    const { errors, warnings } = splitFindings(validateCourseData(d, true));
    expect(errors).toHaveLength(0);
    expect(warnings.length).toBeGreaterThan(0);
  });
});
