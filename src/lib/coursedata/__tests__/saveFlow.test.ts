import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { shouldBlockSave, classifyVerdict } from "../saveFlow";
import { validateCourseData } from "../validator";
import type { CourseData, SaveVerdict } from "../types";

const golden = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("./fixtures/coursedata_way-16650363_mlgen.json", import.meta.url)),
    "utf8"
  )
) as CourseData;

describe("saveFlow — preflight gate (blocks upload on error)", () => {
  it("clean course does NOT block", () => {
    expect(shouldBlockSave(validateCourseData(golden, true))).toBe(false);
  });

  it("error-level finding blocks the upload; warning-only does not (R5)", () => {
    const withError = JSON.parse(JSON.stringify(golden)) as CourseData;
    withError[0].holes[0].par = 9; // bad-par error
    expect(shouldBlockSave(validateCourseData(withError, true))).toBe(true);

    const withWarning = JSON.parse(JSON.stringify(golden)) as CourseData;
    withWarning[0].holes[0].holeNumber = 99; // holes-not-contiguous warning
    expect(shouldBlockSave(validateCourseData(withWarning, true))).toBe(false);
  });
});

describe("saveFlow — verdict classification (etag-conflict path)", () => {
  it("ok → ok; version/etag conflict → conflict; anything else → error", () => {
    expect(classifyVerdict({ ok: true } as SaveVerdict)).toBe("ok");
    expect(classifyVerdict({ ok: false, code: "version-conflict" })).toBe("conflict");
    expect(classifyVerdict({ ok: false, code: "etag-conflict" })).toBe("conflict");
    expect(classifyVerdict({ ok: false, code: "s3-put-failed" })).toBe("error");
    expect(classifyVerdict({ ok: false })).toBe("error");
  });

  it("falls back to errors[0].code, so a raw Lambda verdict still classifies (C23/C17)", () => {
    // The editor Lambda never sets a top-level `code` — save-course-data.ts:153 puts it in
    // errors[0]. api.ts normalizes it, but classification must not depend on that having run.
    const rawConflict: SaveVerdict = {
      ok: false,
      errors: [{
        level: "error",
        code: "etag-conflict",
        path: "baseETag",
        msg: "the object changed since you loaded it (If-Match precondition failed)",
      }],
    };
    expect(classifyVerdict(rawConflict)).toBe("conflict");

    const rawOther: SaveVerdict = {
      ok: false,
      errors: [{ level: "error", code: "staging-missing", path: "stagingKey", msg: "not found" }],
    };
    expect(classifyVerdict(rawOther)).toBe("error");
  });
});
