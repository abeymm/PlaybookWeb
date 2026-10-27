import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { strategyEditRunning, loadStrategyPayload, saveStrategyEdit, resolveRunDir, type ExecFn, type SaveDeps } from "../strategyServer";

const RUN = "20261026-101500";
const SECRET = "s3cret-value-xyz";
const note = (id: string, shotType: string, hole = 1) => ({ id, hole, shotType, shotOrder: 1100, text: "" });

let root: string;
let run: string;
const put = (rel: string, data: unknown, mtime?: number) => {
  const f = path.join(run, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, typeof data === "string" ? data : JSON.stringify(data));
  if (mtime) fs.utimesSync(f, mtime, mtime);
};

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "strat-"));
  run = path.join(root, RUN);
  put("run.json", { primaryTee: { requested: "auto", resolved: "Black", check: {} }, playbookId: "PB1", golfapiCourseId: "123", settings: { edition: "2028", handicap: "medium", primaryTee: "auto" } });
  put("tees/tees.json", { tees: [] });
  put("strategy/final/FIN1.json", { notes: [note("a", "tee")] });
  put("strategy/final/changes.json", { changes: [], rule_report: [] });
  put("strategy/review-final.json", { holes: [] });
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const deps = (exec: ExecFn, over: Partial<SaveDeps> = {}): SaveDeps => ({
  exec, python: "/py", pipelineDir: "/pipe", secret: SECRET, key: "way-1", printRoot: root, courseJson: "/o/cache/way-1.json", busy: false, baseEnv: {} as NodeJS.ProcessEnv, ...over,
});
const body = { baseArchiveId: "FIN1", notes: [note("a", "tee")] };

describe("loadStrategyPayload", () => {
  it("reads the final archive with review, changes and run facts", () => {
    const r = loadStrategyPayload(root, RUN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toMatchObject({ source: "final", archiveId: "FIN1", primaryTee: "Black", playbookId: "PB1", editLog: null });
    expect(r.value.review).toEqual({ holes: [] });
    expect(r.value.changes).toEqual({ changes: [], rule_report: [] });
    expect(r.value.inputsDir).toBe(path.join(fs.realpathSync(root), RUN, "inputs"));
    expect(r.value.runMeta).toEqual({ edition: "2028", handicap: "medium", golfapiCourseId: "123" });
  });
  it("prefers the newest edited archive and its review/edit log", () => {
    put("strategy/edited/OLD.json", { notes: [note("o", "tee")] }, 1000);
    put("strategy/edited/NEW.json", { notes: [note("n", "tee")] }, 2000);
    put("strategy/edited/review-edited.json", { holes: [{ hole: 1 }] });
    put("strategy/edited/edit-log.json", { edits: 1 });
    const r = loadStrategyPayload(root, RUN);
    expect(r.ok && r.value).toMatchObject({ source: "edited", archiveId: "NEW", editLog: { edits: 1 } });
    expect(r.ok && r.value.review).toEqual({ holes: [{ hole: 1 }] });
  });
  it("errors cleanly for a bad id, a missing run and a run without a strategy", () => {
    expect(loadStrategyPayload(root, "none")).toMatchObject({ ok: false, status: 400 });
    expect(loadStrategyPayload(root, "20200101-000000")).toMatchObject({ ok: false, status: 404 });
    fs.rmSync(path.join(run, "strategy"), { recursive: true });
    expect(loadStrategyPayload(root, RUN)).toMatchObject({ ok: false, status: 404 });
  });
  it("refuses a run dir that is a symlink out of the print root", () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "outside-"));
    fs.symlinkSync(outside, path.join(root, "20260101-000000"));
    expect(resolveRunDir(root, "20260101-000000")).toMatchObject({ ok: false, status: 400 });
    fs.rmSync(outside, { recursive: true, force: true });
  });
});

describe("saveStrategyEdit", () => {
  it("writes edited-notes.json, spawns the script with the secret in env only, and returns the fresh payload", async () => {
    let call: { file: string; args: string[]; env: NodeJS.ProcessEnv; cwd: string; timeout: number } | null = null;
    const exec: ExecFn = async (file, args, opts) => {
      call = { file, args, ...opts };
      put("strategy/edited/EDT1.json", { notes: [note("a", "tee")] });
      put("strategy/edited/review-edited.json", { holes: [] });
      return { stdout: 'log line\n{"archiveId":"EDT1","json":"x","playbook":"y","review":"z","editLog":"w","flagsAfter":0}\n', stderr: "" };
    };
    const r = await saveStrategyEdit(deps(exec), RUN, body);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ source: "edited", archiveId: "EDT1" });
    const c = call!;
    expect(c.file).toBe("/py");
    expect(c.cwd).toBe("/pipe");
    expect(c.timeout).toBe(120_000);
    expect(c.env.PLAYBOOK_ID_SECRET).toBe(SECRET);
    expect(c.args.join(" ")).not.toContain(SECRET);
    const real = fs.realpathSync(run);
    expect(c.args).toEqual([
      "-u", "core/strategy_edit.py", "--base", path.join(real, "strategy/final/FIN1.json"),
      "--notes", path.join(real, "strategy/edited/edited-notes.json"), "--course-json", "/o/cache/way-1.json",
      "--tees", path.join(real, "tees/tees.json"), "--primary-tee", "Black", "--course-key", "way-1",
      "--variant", "strategy", "--out-dir", path.join(real, "strategy/edited"),
    ]);
    expect(JSON.parse(fs.readFileSync(path.join(run, "strategy/edited/edited-notes.json"), "utf8"))).toEqual({
      formatVersion: 1, baseArchiveId: "FIN1", notes: body.notes,
    });
  });
  it("422s when the run has no resolved primary tee, without spawning", async () => {
    put("run.json", { primaryTee: { requested: "auto", resolved: null } });
    let spawned = 0;
    const r = await saveStrategyEdit(deps(async () => { spawned++; return { stdout: "{}", stderr: "" }; }), RUN, body);
    expect(r).toEqual({ status: 422, body: { error: "run has no resolved primary tee" } });
    expect(spawned).toBe(0);
  });
  it("a second PUT for the same run while one is in flight gets 409, and the lock frees afterwards", async () => {
    let release!: () => void;
    const gate = new Promise<void>((res) => { release = res; });
    const exec: ExecFn = async () => { await gate; put("strategy/edited/E2.json", { notes: [note("a", "tee")] }); return { stdout: '{"archiveId":"E2"}\n', stderr: "" }; };
    const first = saveStrategyEdit(deps(exec), RUN, body);
    expect(strategyEditRunning("way-1")).toBe(true);
    expect((await saveStrategyEdit(deps(exec), RUN, body)).status).toBe(409);
    release();
    expect((await first).status).toBe(200);
    expect(strategyEditRunning("way-1")).toBe(false);
  });
  it("maps exit 2 to 422 with the script's body", async () => {
    const exec: ExecFn = async () => { throw Object.assign(new Error("x"), { code: 2, stdout: '{"error":"bad notes","holes":[3]}\n', stderr: "" }); };
    expect(await saveStrategyEdit(deps(exec), RUN, body)).toEqual({ status: 422, body: { error: "bad notes", holes: [3] } });
  });
  it("maps a timeout to 504", async () => {
    const exec: ExecFn = async () => { throw Object.assign(new Error("t"), { killed: true, signal: "SIGTERM", code: null }); };
    expect((await saveStrategyEdit(deps(exec), RUN, body)).status).toBe(504);
  });
  it("maps other failures to 500 with the log tail, secret scrubbed", async () => {
    const exec: ExecFn = async () => { throw Object.assign(new Error("x"), { code: 1, stdout: "", stderr: `Traceback\nboom ${SECRET}\n` }); };
    const r = await saveStrategyEdit(deps(exec), RUN, body);
    expect(r.status).toBe(500);
    const log = (r.body as { log: string }).log;
    expect(log).toContain("boom ***");
    expect(JSON.stringify(r.body)).not.toContain(SECRET);
  });
  it("rejects a bad body, a stale base id and a running build without spawning", async () => {
    let spawned = 0;
    const exec: ExecFn = async () => { spawned++; return { stdout: "{}", stderr: "" }; };
    expect((await saveStrategyEdit(deps(exec), RUN, { notes: [] })).status).toBe(400);
    expect((await saveStrategyEdit(deps(exec), RUN, { ...body, baseArchiveId: "OTHER" })).status).toBe(409);
    expect((await saveStrategyEdit(deps(exec, { busy: true }), RUN, body)).status).toBe(409);
    expect((await saveStrategyEdit(deps(exec), "none", body)).status).toBe(400);
    expect(spawned).toBe(0);
  });
});
