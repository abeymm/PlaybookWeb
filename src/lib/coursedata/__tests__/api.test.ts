// api.test.ts — the Lambda↔Web boundary contract (C23 / C17 / C26 / seed findings).
//
// Every fixture below is a LITERAL response from the editor Lambda
// (Backend/amplify/functions/course-data-editor-function/*), not a shape invented here — the
// mutations return a.json(), so AppSync passes the Lambda object through verbatim and the Lambda
// IS the contract. These tests exist because the Web declared `etag` / top-level `code` / `error`
// while the Lambda emits `s3ETag` / `eTag` / `errors[0]` — a mismatch tsc cannot see (parseJson is
// an unchecked cast) and that silently disabled the whole optimistic-lock design.

import { describe, it, expect, vi, beforeEach } from "vitest";

const graphql = vi.fn();

vi.mock("aws-amplify/api", () => ({ generateClient: () => ({ graphql }) }));
vi.mock("aws-amplify/storage", () => ({
  downloadData: vi.fn(),
  uploadData: vi.fn(),
  list: vi.fn(),
  getProperties: vi.fn(),
}));

import {
  saveCourseData,
  listCourseDataVersions,
  restoreCourseDataVersion,
  deleteCourseArtifact,
  saveCourseSeed,
} from "../api";
import type { SeedJson } from "../seed";

/** Reply with exactly what the Lambda returns for `field`. */
function lambdaReplies(field: string, payload: unknown) {
  graphql.mockResolvedValue({ data: { [field]: payload } });
}

beforeEach(() => {
  graphql.mockReset();
});

describe("saveCourseData — Lambda EditorResult → SaveVerdict", () => {
  it("maps s3ETag → etag on success and carries counts/indexSyncWarning through", async () => {
    // save-course-data.ts:180 `return { ok: true, warnings, counts, s3VersionId, s3ETag }`
    lambdaReplies("saveCourseData", {
      ok: true,
      warnings: [],
      counts: { greenCount: 1 },
      s3VersionId: "v-new",
      s3ETag: '"e-new"',
    });

    const verdict = await saveCourseData("way-16650363", "mlgen", "public/osm-cache-mlgen/staging/x.json", null);

    expect(verdict.ok).toBe(true);
    expect(verdict.etag).toBe('"e-new"'); // ← the whole N2 optimistic lock hangs off this
    expect(verdict.s3VersionId).toBe("v-new");
    expect(verdict.code).toBeUndefined();
  });

  it("maps errors[0].code → code so an etag-conflict classifies as a conflict", async () => {
    // save-course-data.ts:153 coded('etag-conflict', 'baseETag', '…reload and re-apply')
    lambdaReplies("saveCourseData", {
      ok: false,
      errors: [{
        level: "error",
        code: "etag-conflict",
        path: "baseETag",
        msg: "the object changed since you loaded it (If-Match precondition failed) — reload and re-apply",
      }],
    });

    const verdict = await saveCourseData("way-1", "mlgen", "public/osm-cache-mlgen/staging/x.json", '"old"');

    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("etag-conflict");
    expect(verdict.errors?.[0].msg).toContain("If-Match");
  });

  it("surfaces indexSyncWarning and preserves validation findings", async () => {
    lambdaReplies("saveCourseData", {
      ok: true, indexSyncWarning: true, warnings: [{ level: "warning", code: "w", path: "p", msg: "m" }],
      counts: {}, s3VersionId: "v", s3ETag: '"e"',
    });
    const verdict = await saveCourseData("way-1", "mlgen", "public/osm-cache-mlgen/staging/x.json");
    expect(verdict.indexSyncWarning).toBe(true);
    expect(verdict.warnings).toHaveLength(1);
  });

  it("parses an AWSJSON string payload identically (scalar may arrive unparsed)", async () => {
    lambdaReplies("saveCourseData", JSON.stringify({ ok: true, s3ETag: '"e-str"' }));
    const verdict = await saveCourseData("way-1", "mlgen", "public/osm-cache-mlgen/staging/x.json");
    expect(verdict.etag).toBe('"e-str"');
  });
});

describe("listCourseDataVersions — VersionEntry → CourseDataVersion", () => {
  it("maps eTag → etag and keeps versionId/isLatest", async () => {
    // versions.ts returns { ok, versions: [{versionId, lastModified, size, eTag, isLatest}] }
    lambdaReplies("listCourseDataVersions", {
      ok: true,
      versions: [
        { versionId: "v2", lastModified: "2026-01-02T00:00:00.000Z", size: 10, eTag: '"e2"', isLatest: true },
        { versionId: "v1", lastModified: "2026-01-01T00:00:00.000Z", size: 9, eTag: '"e1"', isLatest: false },
      ],
    });

    const versions = await listCourseDataVersions("way-16650363");

    expect(versions.map((v) => v.etag)).toEqual(['"e2"', '"e1"']);
    expect(versions[0]).toMatchObject({ versionId: "v2", isLatest: true, size: 10 });
  });

  it("carries isDeleteMarker through so a deleted object exposes no base etag (C14)", async () => {
    lambdaReplies("listCourseDataVersions", {
      ok: true,
      versions: [
        { versionId: "dm1", lastModified: "2026-01-05T00:00:00.000Z", isLatest: true, isDeleteMarker: true },
        { versionId: "v1", lastModified: "2026-01-01T00:00:00.000Z", eTag: '"e1"', isLatest: false },
      ],
    });

    const versions = await listCourseDataVersions("way-16650363");

    expect(versions[0]).toMatchObject({ versionId: "dm1", isLatest: true, isDeleteMarker: true });
    expect(versions[0].etag).toBeUndefined();
  });

  it("throws with the first coded message on a failure envelope instead of returning [] as if there were no versions", async () => {
    // A silent [] reads as "no version history" and lets the caller adopt a null baseEtag against
    // an object that still exists — this must surface as a failure, not an empty list (#3).
    lambdaReplies("listCourseDataVersions", {
      ok: false,
      errors: [{ level: "error", code: "s3-throttled", path: "courseKey", msg: "SlowDown" }],
    });
    await expect(listCourseDataVersions("way-1")).rejects.toThrow("SlowDown");
  });

  it("throws a generic message when the failure envelope carries no errors array", async () => {
    lambdaReplies("listCourseDataVersions", { ok: false });
    await expect(listCourseDataVersions("way-1")).rejects.toThrow();
  });
});

describe("restoreCourseDataVersion — EditorResult → SaveVerdict", () => {
  it("maps s3ETag → etag so the base ETag is re-armed after a restore", async () => {
    // versions.ts: { ok:true, restoredFrom, s3VersionId, s3ETag }
    lambdaReplies("restoreCourseDataVersion", {
      ok: true, restoredFrom: "v1", s3VersionId: "v-restored", s3ETag: '"e-restored"',
    });

    const verdict = await restoreCourseDataVersion("way-1", "v1");

    expect(verdict.ok).toBe(true);
    expect(verdict.etag).toBe('"e-restored"');
    expect(verdict.s3VersionId).toBe("v-restored");
  });

  it("maps errors[0].code → code for version-not-found", async () => {
    lambdaReplies("restoreCourseDataVersion", {
      ok: false,
      errors: [{ level: "error", code: "version-not-found", path: "versionId", msg: "version gone is no longer available" }],
    });

    const verdict = await restoreCourseDataVersion("way-1", "gone");

    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("version-not-found");
    expect(verdict.errors?.[0].msg).toContain("no longer available");
  });
});

describe("deleteCourseArtifact — EditorResult.errors[0].msg → error (C26)", () => {
  it("surfaces the allowlist rejection reason instead of a generic fallback", async () => {
    // delete-artifact.ts:30-31
    const msg =
      "key 'public/osm-cache/way-1.json' is not deletable — only public/osm-cache-mlgen/, qc-reports/, and seeds/ are allowed";
    lambdaReplies("deleteCourseArtifact", {
      ok: false, errors: [{ level: "error", code: "forbidden-key", path: "key", msg }],
    });

    const res = await deleteCourseArtifact("public/osm-cache/way-1.json");

    expect(res.ok).toBe(false);
    expect(res.error).toBe(msg);
  });

  it("distinguishes a retryable throttle from a permanent rejection", async () => {
    lambdaReplies("deleteCourseArtifact", {
      ok: false, errors: [{ level: "error", code: "s3-throttled", path: "key", msg: "SlowDown" }],
    });
    const res = await deleteCourseArtifact("public/osm-cache-mlgen/way-1.json");
    expect(res.error).toBe("SlowDown");
    expect(res.code).toBe("s3-throttled");
  });

  it("reports ok with no error on success", async () => {
    lambdaReplies("deleteCourseArtifact", { ok: true, deletedKey: "seeds/manual-x.json" });
    const res = await deleteCourseArtifact("seeds/manual-x.json");
    expect(res).toMatchObject({ ok: true });
    expect(res.error).toBeUndefined();
  });
});

describe("saveCourseSeed — EditorResult → SeedSaveResult", () => {
  const seed = { osmId: "manual/x", name: "X" } as unknown as SeedJson;

  it("keeps findings on success (the Lambda already names them findings)", async () => {
    // save-seed.ts:77 { ok:true, key, cacheKey, findings: warnings, ... }
    lambdaReplies("saveCourseSeed", {
      ok: true,
      key: "seeds/manual-x.json",
      cacheKey: "manual-x",
      findings: [{ level: "warning", code: "w", path: "holes[0]", msg: "advisory" }],
    });

    const res = await saveCourseSeed(seed);

    expect(res.ok).toBe(true);
    expect(res.key).toBe("seeds/manual-x.json");
    expect(res.findings).toHaveLength(1);
  });

  it("maps the FAILURE payload's errors+warnings into findings so the panel renders them", async () => {
    // save-seed.ts:59 { ok:false, errors, warnings } — the failure path names them `errors`,
    // which NextSteps.tsx never reads; without normalization all three findings are dropped.
    lambdaReplies("saveCourseSeed", {
      ok: false,
      errors: [
        { level: "error", code: "seed-far-point", path: "holes[3].centerlineCoordinates[1]", msg: "~19.4km from the course location" },
        { level: "error", code: "seed-position-mismatch", path: "holes[3].flagPosition", msg: "must equal the last centerlineCoordinates point" },
      ],
      warnings: [{ level: "warning", code: "seed-advisory", path: "holes", msg: "heads up" }],
    });

    const res = await saveCourseSeed(seed);

    expect(res.ok).toBe(false);
    expect(res.findings).toHaveLength(3);
    expect(res.findings?.map((f) => f.code)).toEqual([
      "seed-far-point", "seed-position-mismatch", "seed-advisory",
    ]);
    expect(res.error).toContain("~19.4km"); // headline reason, never an empty panel
  });

  it("still yields a human-readable error when the Lambda returns no findings at all", async () => {
    lambdaReplies("saveCourseSeed", { ok: false });
    const res = await saveCourseSeed(seed);
    expect(res.ok).toBe(false);
    expect(res.findings).toEqual([]);
  });
});
