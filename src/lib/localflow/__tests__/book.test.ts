import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildBookCommand, parseBookOptions, makeRunId, isValidRunId, parseRunSummary, listRuns,
  parseReviewCsv, serializeReviewCsv, applyOwnerOk, allOwnerOk, resolveRunFile, resolveIdSecret,
  golfapiIdFromCourse, normalizeOwnerOk, normalizeReviewTable, claimRunDir,
} from "../book";

const OPTS = {
  variant: "strategy" as const, edition: "2027", handicap: "low" as const, primaryTee: "auto",
  golfapiCourseId: "012141520641012976252",
};

describe("parseBookOptions", () => {
  it("applies the owner defaults", () => {
    const r = parseBookOptions({ golfapiCourseId: "123456" });
    expect(r).toEqual({ ok: true, value: { variant: "strategy", edition: "2027", handicap: "low", primaryTee: "auto", golfapiCourseId: "123456", playbook: undefined } });
  });
  it("rejects a bad variant, edition, handicap", () => {
    expect(parseBookOptions({ variant: "fancy", golfapiCourseId: "1" }).ok).toBe(false);
    expect(parseBookOptions({ edition: "20x7", golfapiCourseId: "1" }).ok).toBe(false);
    expect(parseBookOptions({ handicap: "scratch", golfapiCourseId: "1" }).ok).toBe(false);
  });
  it("requires a GolfAPI id and refuses flag-looking values", () => {
    expect(parseBookOptions({}).ok).toBe(false);
    expect(parseBookOptions({ golfapiCourseId: "--release" }).ok).toBe(false);
    expect(parseBookOptions({ golfapiCourseId: "1", primaryTee: "--out" }).ok).toBe(false);
    expect(parseBookOptions({ golfapiCourseId: "1", primaryTee: "Black/Blue" }).ok).toBe(true);
  });
  it("only accepts a playbook file name, never a path", () => {
    expect(parseBookOptions({ golfapiCourseId: "1", playbook: "TPC.playbook" }).ok).toBe(true);
    expect(parseBookOptions({ golfapiCourseId: "1", playbook: "../x.playbook" }).ok).toBe(false);
    expect(parseBookOptions({ golfapiCourseId: "1", playbook: "/etc/x.playbook" }).ok).toBe(false);
  });
});

describe("inputsDir and absolute playbook", () => {
  it("accepts an absolute inputs dir and archive path, rejects traversal and relative", () => {
    const ok = parseBookOptions({ golfapiCourseId: "1", inputsDir: "/o/print/20261026-101500/inputs", playbookPath: "/o/print/20261026-101500/strategy/edited/AB.json" });
    expect(ok).toMatchObject({ ok: true, value: { inputsDir: "/o/print/20261026-101500/inputs", playbookPath: "/o/print/20261026-101500/strategy/edited/AB.json" } });
    expect(parseBookOptions({ golfapiCourseId: "1", inputsDir: "../inputs" }).ok).toBe(false);
    expect(parseBookOptions({ golfapiCourseId: "1", inputsDir: "/o/print/../../etc" }).ok).toBe(false);
    expect(parseBookOptions({ golfapiCourseId: "1", inputsDir: "--out" }).ok).toBe(false);
    expect(parseBookOptions({ golfapiCourseId: "1", playbookPath: "/o/print/../x.json" }).ok).toBe(false);
    expect(parseBookOptions({ golfapiCourseId: "1", playbookPath: "/o/x.txt" }).ok).toBe(false);
    expect(parseBookOptions({ golfapiCourseId: "1", playbook: "A.playbook", playbookPath: "/o/x.json" }).ok).toBe(false);
  });
  it("adds --inputs-dir to the argv only when set", () => {
    const base = { key: "k", courseJson: "/c.json", outDir: "/o", secret: null };
    expect(buildBookCommand({ ...base, options: OPTS }).args).not.toContain("--inputs-dir");
    const { args } = buildBookCommand({ ...base, options: { ...OPTS, inputsDir: "/o/print/r/inputs" } });
    expect(args[args.indexOf("--inputs-dir") + 1]).toBe("/o/print/r/inputs");
  });
});

describe("buildBookCommand", () => {
  const base = { key: "way-78388948", courseJson: "/o/coursedata_way-78388948/cache/way-78388948.json", outDir: "/o/coursedata_way-78388948/print/20261026-101500" };
  it("builds the print_book.py argv from the course JSON and run dir", () => {
    const { args } = buildBookCommand({ ...base, options: OPTS, secret: "s3cret" });
    expect(args.slice(0, 2)).toEqual(["-u", "core/print_book.py"]);
    const flag = (f: string) => args[args.indexOf(f) + 1];
    expect(flag("--golfapi-course-id")).toBe("012141520641012976252");
    expect(flag("--course-key")).toBe("way-78388948");
    expect(flag("--course-json")).toBe(base.courseJson);
    expect(flag("--out")).toBe(base.outDir);
    expect(flag("--variant")).toBe("strategy");
    expect(flag("--edition")).toBe("2027");
    expect(flag("--handicap")).toBe("low");
    expect(flag("--primary-tee")).toBe("auto");
    expect(args).not.toContain("--release");
  });
  it("passes the secret ONLY in env, never in argv", () => {
    const { args, env } = buildBookCommand({ ...base, options: OPTS, secret: "s3cret-value" });
    expect(env.PLAYBOOK_ID_SECRET).toBe("s3cret-value");
    expect(args.join(" ")).not.toContain("s3cret-value");
    expect(args).not.toContain("--id-secret");
  });
  it("omits the env secret when there is none, and adds --playbook when given", () => {
    const { args, env } = buildBookCommand({ ...base, options: { ...OPTS, playbook: "/p/X.playbook" }, secret: null });
    expect(env).toEqual({});
    expect(args[args.indexOf("--playbook") + 1]).toBe("/p/X.playbook");
  });
});

describe("run ids", () => {
  it("makes sortable local ids and validates them", () => {
    expect(makeRunId(new Date(2026, 9, 26, 10, 15, 3))).toBe("20261026-101503");
    expect(isValidRunId("20261026-101503")).toBe(true);
    expect(isValidRunId("../x")).toBe(false);
    expect(isValidRunId("20261026-101503/..")).toBe(false);
  });
});

describe("parseRunSummary", () => {
  it("summarises run.json + report.json", () => {
    const s = parseRunSummary("20261026-101503",
      { status: "ok", buildId: "ECE6-FE42", revision: 2, variant: "strategy", edition: "2027", finishedAt: "t" },
      { pages: 40, marginViolations: [{}, {}], warnings: ["a", { b: 1 }], qrTarget: "https://playbook.golf/protected/X" });
    expect(s).toMatchObject({ runId: "20261026-101503", status: "ok", buildId: "ECE6-FE42", revision: 2, pages: 40, marginViolations: 2, qrTarget: "https://playbook.golf/protected/X" });
    expect(s.warnings).toEqual(["a", '{"b":1}']);
  });
  it("survives missing and malformed files", () => {
    const s = parseRunSummary("20261026-101503", null, 5);
    expect(s.status).toBe("unknown");
    expect(s.pages).toBeNull();
    expect(s.marginViolations).toBeNull();
    expect(s.warnings).toEqual([]);
  });
});

describe("review.csv", () => {
  const csv = 'build_id,hole,side_tags,best_line,notes,owner_ok\r\nAB,1,"SOFT, LEFT",Line A,"say ""hi""\nnext",\r\nAB,2,x,y,,yes\r\n';
  it("round-trips including quotes, commas, newlines and unknown columns", () => {
    const t = parseReviewCsv(csv);
    expect(t.columns).toEqual(["build_id", "hole", "side_tags", "best_line", "notes", "owner_ok"]);
    expect(t.rows).toHaveLength(2);
    expect(t.rows[0].side_tags).toBe("SOFT, LEFT");
    expect(t.rows[0].notes).toBe('say "hi"\nnext');
    expect(serializeReviewCsv(t)).toBe(csv);
  });
  it("applies owner_ok by hole and checks the release gate", () => {
    const t = parseReviewCsv(csv);
    expect(allOwnerOk(t)).toBe(false);
    const t2 = applyOwnerOk(t, { "1": "yes", "9": "yes" });
    expect(t2.rows[0].owner_ok).toBe("yes");
    expect(t.rows[0].owner_ok).toBe("");   // input is not mutated
    expect(allOwnerOk(t2)).toBe(true);
    expect(allOwnerOk({ columns: ["hole", "owner_ok"], rows: [] })).toBe(false);
  });
  it("adds owner_ok when the file lacks the column", () => {
    const t = applyOwnerOk(parseReviewCsv("hole,x\r\n1,a\r\n"), { "1": "yes" });
    expect(t.columns).toEqual(["hole", "x", "owner_ok"]);
    expect(serializeReviewCsv(t)).toBe("hole,x,owner_ok\r\n1,a,yes\r\n");
  });
});

describe("resolveIdSecret", () => {
  it("prefers env, then the keychain reader, else null", () => {
    expect(resolveIdSecret({ PLAYBOOK_ID_SECRET: "e" }, () => "k")).toBe("e");
    expect(resolveIdSecret({}, () => "k\n")).toBe("k");
    expect(resolveIdSecret({}, () => null)).toBeNull();
    expect(resolveIdSecret({ PLAYBOOK_ID_SECRET: "" }, () => { throw new Error("x"); })).toBeNull();
  });
});

describe("golfapiIdFromCourse", () => {
  it("reads apiCourseId from an array or object", () => {
    expect(golfapiIdFromCourse([{ apiCourseId: "012" }])).toBe("012");
    expect(golfapiIdFromCourse({ apiCourseId: 77 })).toBe("77");
    expect(golfapiIdFromCourse([{}])).toBeNull();
    expect(golfapiIdFromCourse(null)).toBeNull();
  });
});

describe("filesystem helpers", () => {
  let root: string;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), "book-")); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  const mkRun = (id: string, run: object | null, report: object | null) => {
    const d = path.join(root, id);
    fs.mkdirSync(path.join(d, "render-book-vivid"), { recursive: true });
    if (run) fs.writeFileSync(path.join(d, "run.json"), JSON.stringify(run));
    if (report) fs.writeFileSync(path.join(d, "render-book-vivid", "report.json"), JSON.stringify(report));
    return d;
  };

  it("lists runs newest first with summaries, ignoring non-run entries", () => {
    mkRun("20261025-090000", { status: "failed", failedStage: "build" }, null);
    const d2 = mkRun("20261026-101503", { status: "ok", buildId: "AB" }, { pages: 40 });
    fs.writeFileSync(path.join(d2, "render-book-vivid", "book.pdf"), "%PDF");
    fs.writeFileSync(path.join(root, "notes.txt"), "x");
    fs.mkdirSync(path.join(root, "junk"));
    const runs = listRuns(root);
    expect(runs.map((r) => r.runId)).toEqual(["20261026-101503", "20261025-090000"]);
    expect(runs[0]).toMatchObject({ status: "ok", pages: 40, hasPdf: true, released: false });
    expect(runs[1]).toMatchObject({ status: "failed", failedStage: "build", hasPdf: false });
  });
  it("flags runs that have a strategy/final and a strategy/edited dir", () => {
    const d = mkRun("20261026-101503", { status: "ok" }, null);
    mkRun("20261025-090000", { status: "ok" }, null);
    fs.mkdirSync(path.join(d, "strategy", "final"), { recursive: true });
    expect(listRuns(root).map((r) => [r.hasStrategy, r.hasEdited])).toEqual([[true, false], [false, false]]);
    fs.mkdirSync(path.join(d, "strategy", "edited"));
    expect(listRuns(root)[0]).toMatchObject({ hasStrategy: true, hasEdited: true });
  });
  it("returns [] when the print dir does not exist", () => {
    expect(listRuns(path.join(root, "nope"))).toEqual([]);
  });

  it("resolves only allowlisted names inside the run dir", () => {
    const d = mkRun("20261026-101503", { status: "ok" }, { pages: 40 });
    fs.writeFileSync(path.join(d, "render-book-vivid", "book.pdf"), "%PDF");
    const ok = resolveRunFile(root, "20261026-101503", "render-book-vivid/book.pdf");
    expect(ok).toMatchObject({ ok: true, contentType: "application/pdf" });
    expect(ok.ok && ok.file).toBe(fs.realpathSync(path.join(d, "render-book-vivid", "book.pdf")));
    expect(resolveRunFile(root, "20261026-101503", "../../etc/passwd").ok).toBe(false);
    expect(resolveRunFile(root, "20261026-101503", "/etc/passwd").ok).toBe(false);
    expect(resolveRunFile(root, "20261026-101503", "inputs/course.json").ok).toBe(false);
    expect(resolveRunFile(root, "..", "run.json").ok).toBe(false);
    expect(resolveRunFile(root, "20261026-101503", "review/review.csv")).toMatchObject({ ok: false, status: 404 });
  });
  it("rejects an allowlisted name that is a symlink leaving the run dir", () => {
    const d = mkRun("20261026-101503", { status: "ok" }, null);
    const secret = path.join(root, "outside.json");
    fs.writeFileSync(secret, "{}");
    fs.symlinkSync(secret, path.join(d, "run.json".replace("run", "x")));
    fs.rmSync(path.join(d, "run.json"), { force: true });
    fs.symlinkSync(secret, path.join(d, "run.json"));
    expect(resolveRunFile(root, "20261026-101503", "run.json")).toMatchObject({ ok: false, status: 400 });
  });
});

describe("owner_ok normalisation (CLI uses strip().lower())", () => {
  it("normalises Yes / ' yes ' like the CLI gate", () => {
    expect(normalizeOwnerOk(" Yes ")).toBe("yes");
    expect(normalizeOwnerOk("NO")).toBe("no");
    expect(normalizeOwnerOk(undefined)).toBe("");
    const t = normalizeReviewTable(parseReviewCsv("hole,owner_ok\r\n1, Yes\r\n2,\r\n"));
    expect(t.rows.map((r) => r.owner_ok)).toEqual(["yes", ""]);
  });
});

describe("ragged review rows", () => {
  it("flags rows with more cells than the header", () => {
    const t = parseReviewCsv("hole,owner_ok\r\n1,yes\r\n2,yes,extra\r\n");
    expect(t.ragged).toEqual([2]);
    expect(parseReviewCsv("hole,owner_ok\r\n1,yes\r\n").ragged).toEqual([]);
  });
});

describe("claimRunDir", () => {
  it("does not create the run dir when a build is already running", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "claim-"));
    try {
      expect(() => claimRunDir(root, "20261026-101503", true)).toThrow(/already running/);
      expect(fs.readdirSync(root)).toEqual([]);
      expect(claimRunDir(root, "20261026-101503", false)).toBe(path.join(root, "20261026-101503"));
      expect(fs.existsSync(path.join(root, "20261026-101503"))).toBe(true);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
});

describe("listRuns robustness", () => {
  it("skips a dangling symlink named like a run id", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "dang-"));
    try {
      fs.symlinkSync(path.join(root, "missing"), path.join(root, "20261026-101503"));
      expect(listRuns(root)).toEqual([]);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
});
