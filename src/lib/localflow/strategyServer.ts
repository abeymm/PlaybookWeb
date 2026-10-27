// strategyServer.ts — SERVER-ONLY glue for the strategy review/edit routes: reads a run's current
// archive + review + changes, and runs core/strategy_edit.py synchronously for a PUT. The process runner
// is injected (like server.ts's spawner) so the route logic is unit-tested with a fake. The id secret goes
// into the child's ENV only and is scrubbed from anything returned.

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { isValidRunId } from "./book";
import {
  archiveIdFromName, buildStrategyEditCommand, parseEditBody, pickArchive, resolvedPrimaryTee,
  type DirEntry, type StrategyPayload,
} from "./strategy";

export interface ExecResult { stdout: string; stderr: string }
export type ExecFn = (file: string, args: string[], opts: { cwd: string; env: NodeJS.ProcessEnv; timeout: number }) => Promise<ExecResult>;

/** Promisified execFile; rejects with execFile's error (code / killed / signal / stdout / stderr). */
export const nodeExec: ExecFn = (file, args, opts) =>
  new Promise((resolve, reject) => {
    execFile(file, args, { ...opts, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(Object.assign(err, { stdout, stderr }));
      else resolve({ stdout, stderr });
    });
  });

export type Result<T> = { ok: true; value: T } | { ok: false; status: number; error: string };
const fail = (status: number, error: string): { ok: false; status: number; error: string } => ({ ok: false, status, error });

const EDIT_TIMEOUT_MS = 120_000;

function readJson(p: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function listDir(dir: string): DirEntry[] {
  try {
    return fs.readdirSync(dir).flatMap((name) => {
      try {
        const st = fs.statSync(path.join(dir, name));
        return st.isFile() ? [{ name, mtimeMs: st.mtimeMs }] : [];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

/** The run's real dir, or an error: bad id, missing, or a symlink out of the print root. */
export function resolveRunDir(printRoot: string, runId: string): Result<string> {
  if (!isValidRunId(runId)) return fail(400, "invalid run id");
  try {
    const real = fs.realpathSync(path.join(printRoot, runId));
    const root = fs.realpathSync(printRoot);
    if (!real.startsWith(root + path.sep)) return fail(400, "run resolves outside the print dir");
    return { ok: true, value: real };
  } catch {
    return fail(404, `no such run: ${runId}`);
  }
}

/** Current archive (edited if any, else final) with its review, changes, edit log and tees. */
export function loadStrategyPayload(printRoot: string, runId: string): Result<StrategyPayload> {
  const rd = resolveRunDir(printRoot, runId);
  if (!rd.ok) return rd;
  const run = rd.value;
  const finalDir = path.join(run, "strategy", "final");
  const editedDir = path.join(run, "strategy", "edited");
  const pick = pickArchive({ edited: listDir(editedDir), final: listDir(finalDir) });
  if (!pick) return fail(404, `no strategy archive in run ${runId} (strategy/final is missing)`);
  const dir = pick.source === "edited" ? editedDir : finalDir;
  let archivePath: string;
  try {
    archivePath = fs.realpathSync(path.join(dir, pick.name));
  } catch {
    return fail(404, "archive vanished");
  }
  if (!archivePath.startsWith(run + path.sep)) return fail(400, "archive resolves outside the run dir");
  const archive = readJson(archivePath) as StrategyPayload["archive"] | null;
  if (!archive || !Array.isArray(archive.notes)) return fail(500, `${pick.name} is not a playbook archive (no notes array)`);
  const meta = (readJson(path.join(run, "run.json")) ?? {}) as Record<string, unknown>;
  const s = (v: unknown): string | null => (typeof v === "string" && v ? v : v != null && typeof v === "number" ? String(v) : null);
  const settings = (meta.settings && typeof meta.settings === "object" ? meta.settings : {}) as Record<string, unknown>;
  const edited = pick.source === "edited";
  return {
    ok: true,
    value: {
      archive,
      archiveId: archiveIdFromName(pick.name),
      archivePath,
      source: pick.source,
      review: (readJson(path.join(run, "strategy", edited ? "edited/review-edited.json" : "review-final.json")) ?? null) as StrategyPayload["review"],
      changes: (readJson(path.join(finalDir, "changes.json")) ?? null) as StrategyPayload["changes"],
      editLog: edited ? readJson(path.join(editedDir, "edit-log.json")) : null,
      tees: readJson(path.join(run, "tees", "tees.json")),
      primaryTee: resolvedPrimaryTee(meta),
      playbookId: s(meta.playbookId),
      inputsDir: path.join(run, "inputs"),
      runMeta: { edition: s(settings.edition), handicap: s(settings.handicap), golfapiCourseId: s(meta.golfapiCourseId) },
    },
  };
}

// One strategy_edit.py at a time per run (and the book start route treats any as busy): a second PUT gets 409.
const locks = (): Set<string> => {
  const g = globalThis as unknown as { __strategyEditLocks?: Set<string> };
  return (g.__strategyEditLocks ??= new Set());
};
export const strategyEditRunning = (key: string): boolean => [...locks()].some((l) => l.startsWith(`${key}/`));

export interface SaveDeps {
  exec: ExecFn;
  python: string;
  pipelineDir: string;
  secret: string | null;
  key: string;
  printRoot: string;
  courseJson: string;
  /** A book build is running for this course. */
  busy: boolean;
  baseEnv?: NodeJS.ProcessEnv;
}

export interface RouteResult { status: number; body: unknown }

const lastLines = (text: string, n = 20): string => text.trim().split("\n").slice(-n).join("\n");
const lastJsonLine = (text: string): Record<string, unknown> | null => {
  const line = text.trim().split("\n").reverse().find((l) => l.trim().startsWith("{"));
  if (!line) return null;
  try {
    return JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }
};

/** PUT: write edited-notes.json, run strategy_edit.py, and return the fresh GET payload (or a 4xx/5xx body). */
export async function saveStrategyEdit(d: SaveDeps, runId: string, rawBody: unknown): Promise<RouteResult> {
  const lock = `${d.key}/${runId}`;
  if (locks().has(lock)) return { status: 409, body: { error: "another edit is already running for this run" } };
  locks().add(lock);
  try {
    return await saveLocked(d, runId, rawBody);
  } finally {
    locks().delete(lock);
  }
}

async function saveLocked(d: SaveDeps, runId: string, rawBody: unknown): Promise<RouteResult> {
  if (d.busy) return { status: 409, body: { error: "a book build is running for this course" } };
  const parsed = parseEditBody(rawBody);
  if (!parsed.ok) return { status: 400, body: { error: parsed.error } };
  const cur = loadStrategyPayload(d.printRoot, runId);
  if (!cur.ok) return { status: cur.status, body: { error: cur.error } };
  const p = cur.value;
  if (parsed.baseArchiveId !== p.archiveId) {
    return { status: 409, body: { error: `the plan changed since this page loaded (now ${p.archiveId}, you edited ${parsed.baseArchiveId}); reload` } };
  }
  if (!p.primaryTee) return { status: 422, body: { error: "run has no resolved primary tee" } };
  const rd = resolveRunDir(d.printRoot, runId);
  if (!rd.ok) return { status: rd.status, body: { error: rd.error } };
  const run = rd.value;
  const outDir = path.join(run, "strategy", "edited");
  const notesPath = path.join(outDir, "edited-notes.json");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(notesPath, JSON.stringify({ formatVersion: 1, baseArchiveId: parsed.baseArchiveId, notes: parsed.notes }));

  const { args, env } = buildStrategyEditCommand({
    basePath: p.archivePath, notesPath, courseJson: d.courseJson, teesPath: path.join(run, "tees", "tees.json"),
    primaryTee: p.primaryTee, courseKey: d.key, outDir, secret: d.secret,
  });
  const scrub = (t: string): string => (d.secret ? t.split(d.secret).join("***") : t);
  try {
    const { stdout } = await d.exec(d.python, args, {
      cwd: d.pipelineDir, env: { ...(d.baseEnv ?? process.env), ...env }, timeout: EDIT_TIMEOUT_MS,
    });
    if (!lastJsonLine(stdout)) return { status: 500, body: { error: "strategy_edit.py printed no result", log: scrub(lastLines(stdout)) } };
  } catch (e) {
    const err = e as { code?: number | string; killed?: boolean; signal?: string | null; stdout?: string; stderr?: string };
    if (err.killed || err.signal) return { status: 504, body: { error: "strategy_edit.py timed out after 120 s" } };
    const out = `${err.stdout ?? ""}`;
    if (err.code === 2) {
      const j = lastJsonLine(scrub(out));
      return { status: 422, body: j ?? { error: scrub(lastLines(`${out}\n${err.stderr ?? ""}`)) } };
    }
    return { status: 500, body: { error: `strategy_edit.py failed (exit ${err.code})`, log: scrub(lastLines(`${out}\n${err.stderr ?? ""}`)) } };
  }
  const fresh = loadStrategyPayload(d.printRoot, runId);
  return fresh.ok ? { status: 200, body: fresh.value } : { status: fresh.status, body: { error: fresh.error } };
}
