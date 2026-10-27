// book.ts — pure-ish logic for the /local "Print book" panel: the print_book.py command line,
// run-dir listing + summaries, review.csv round-trip, and the allowlist for files the routes
// serve. The only I/O is reading a run dir (listRuns / resolveRunFile), so it is testable
// against a temp dir. Shared by the route handlers; types are safe for client imports.
//
// Run-dir layout (written by Training/.../core/print_book.py --out):
//   <runDir>/print/<runId>/{run.json, book.log (this panel's log), render-book-vivid/{book.pdf,
//   contact-sheet.png, report.json}, review/{review.csv, greens-contact.png},
//   strategy/review-final.md, tees/tee-check.md, release/{book.pdf, release.json}}

import fs from "node:fs";
import path from "node:path";
import type { RunSummary } from "./bookTypes";

export type BookVariant = "strategy" | "plain";
export type Handicap = "low" | "medium" | "high";

export interface BookOptions {
  variant: BookVariant;
  edition: string;
  handicap: Handicap;
  /** A scorecard tee name, or "auto". */
  primaryTee: string;
  golfapiCourseId: string;
  /** Name of a `.playbook` in the course's playbook dir; the route resolves it to a path. */
  playbook?: string;
  /** Absolute path of an archive (`.json`/`.playbook`) from a run's strategy dir; the route checks containment and turns it into `playbook`. */
  playbookPath?: string;
  /** Absolute path of an existing run's `inputs/` dir (print_book.py --inputs-dir: skips the NAIP/3DEP read). The route checks containment. */
  inputsDir?: string;
}

const TEE_RE = /^[A-Za-z0-9][A-Za-z0-9 ._()'/&-]{0,39}$/;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/;
const PLAYBOOK_NAME_RE = /^[A-Za-z0-9 _.()'-]+\.playbook$/;
/** A strategy-page rebuild passes the edited archive as an absolute path (the route checks it stays inside the print dir). */
const PLAYBOOK_ABS_RE = /^\/[^\0]*\.(playbook|json)$/;
const noDotDot = (p: string) => !p.split("/").includes("..");

export function parseBookOptions(
  body: unknown,
): { ok: true; value: BookOptions } | { ok: false; error: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const variant = b.variant ?? "strategy";
  if (variant !== "strategy" && variant !== "plain") return { ok: false, error: "variant must be strategy or plain" };
  const edition = String(b.edition ?? "2027");
  if (!/^\d{4}$/.test(edition)) return { ok: false, error: "edition must be a 4-digit year" };
  const handicap = b.handicap ?? "low";
  if (handicap !== "low" && handicap !== "medium" && handicap !== "high") {
    return { ok: false, error: "handicap must be low, medium or high" };
  }
  const primaryTee = String(b.primaryTee ?? "auto");
  if (primaryTee !== "auto" && !TEE_RE.test(primaryTee)) return { ok: false, error: "invalid primary tee" };
  const golfapiCourseId = b.golfapiCourseId == null ? "" : String(b.golfapiCourseId).trim();
  if (!ID_RE.test(golfapiCourseId)) return { ok: false, error: "a GolfAPI course id is required" };
  let playbook: string | undefined;
  if (b.playbook != null && b.playbook !== "") {
    playbook = String(b.playbook);
    if (!PLAYBOOK_NAME_RE.test(playbook) || playbook.includes("..")) return { ok: false, error: "invalid playbook name" };
  }
  let playbookPath: string | undefined;
  if (b.playbookPath != null && b.playbookPath !== "") {
    playbookPath = String(b.playbookPath);
    if (playbook || !PLAYBOOK_ABS_RE.test(playbookPath) || !noDotDot(playbookPath)) return { ok: false, error: "invalid playbook path" };
  }
  let inputsDir: string | undefined;
  if (b.inputsDir != null && b.inputsDir !== "") {
    inputsDir = String(b.inputsDir);
    if (!inputsDir.startsWith("/") || inputsDir.includes("\0") || !noDotDot(inputsDir)) return { ok: false, error: "invalid inputs dir" };
  }
  return { ok: true, value: { variant, edition, handicap, primaryTee, golfapiCourseId, playbook, ...(playbookPath ? { playbookPath } : {}), ...(inputsDir ? { inputsDir } : {}) } };
}

export interface BookCommandInput {
  key: string;
  courseJson: string;
  outDir: string;
  /** `options.playbook`, when set, must already be an absolute path. */
  options: BookOptions;
  secret: string | null;
}

/** argv (after the python binary, run from the pipeline dir) and the child's EXTRA env, kept apart: the secret is env-only. */
export function buildBookCommand(i: BookCommandInput): { args: string[]; env: Record<string, string> } {
  const o = i.options;
  const args = [
    "-u", "core/print_book.py",
    "--golfapi-course-id", o.golfapiCourseId,
    "--course-key", i.key,
    "--course-json", i.courseJson,
    "--primary-tee", o.primaryTee,
    "--variant", o.variant,
    "--edition", o.edition,
    "--handicap", o.handicap,
    "--out", i.outDir,
  ];
  if (o.playbook && o.variant === "strategy") args.push("--playbook", o.playbook);
  if (o.inputsDir) args.push("--inputs-dir", o.inputsDir);
  return { args, env: i.secret ? { PLAYBOOK_ID_SECRET: i.secret } : {} };
}

/** The D9 id secret: env first, else the injected Keychain reader. Never throws; null when unavailable. */
export function resolveIdSecret(
  env: Record<string, string | undefined>,
  readKeychain: () => string | null,
): string | null {
  if (env.PLAYBOOK_ID_SECRET) return env.PLAYBOOK_ID_SECRET;
  try {
    const v = readKeychain()?.trim();
    return v ? v : null;
  } catch {
    return null;
  }
}

/** `text` with every occurrence of `secret` replaced by `***` (literal split/join, no RegExp); unchanged for a null/empty secret. */
export function scrubSecret(text: string, secret: string | null | undefined): string {
  return secret ? text.split(secret).join("***") : text;
}

/** A copy of `env` without PLAYBOOK_ID_SECRET (for children that never need it); the input is not mutated. */
export function releaseChildEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const copy = { ...env };
  delete copy.PLAYBOOK_ID_SECRET;
  return copy;
}

export function golfapiIdFromCourse(data: unknown): string | null {
  const c = (Array.isArray(data) ? data[0] : data) as { apiCourseId?: unknown } | null | undefined;
  const id = c && typeof c === "object" ? c.apiCourseId : null;
  return typeof id === "string" || typeof id === "number" ? String(id) : null;
}

// ---- run ids / summaries ----------------------------------------------------------------

const RUN_ID_RE = /^\d{8}-\d{6}$/;
export const isValidRunId = (s: string): boolean => RUN_ID_RE.test(s);

export function makeRunId(d: Date): string {
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getFullYear(), 4)}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export function parseRunSummary(runId: string, runJson: unknown, report: unknown): RunSummary {
  const run = obj(runJson);
  const rep = obj(report);
  const warnings = Array.isArray(rep.warnings)
    ? rep.warnings.slice(0, 50).map((w) => (typeof w === "string" ? w : JSON.stringify(w)))
    : [];
  return {
    runId,
    status: str(run.status) ?? "unknown",
    failedStage: str(run.failedStage),
    buildId: str(run.buildId),
    revision: num(run.revision),
    variant: str(run.variant),
    edition: str(run.edition),
    finishedAt: str(run.finishedAt),
    pages: num(rep.pages),
    marginViolations: Array.isArray(rep.marginViolations) ? rep.marginViolations.length : null,
    warnings,
    qrTarget: str(rep.qrTarget),
    hasPdf: false,
    hasContact: false,
    hasReview: false,
    released: false,
    hasStrategy: false,
    hasEdited: false,
  };
}

function readJson(p: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}
const isFile = (p: string): boolean => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};

const isDir = (p: string): boolean => {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
};

/** Runs under `<runDir>/print`, newest first. */
export function listRuns(printRoot: string): RunSummary[] {
  let names: string[];
  try {
    names = fs.readdirSync(printRoot);
  } catch {
    return [];
  }
  return names
    .filter((n) => {
      if (!isValidRunId(n)) return false;
      try {
        return fs.statSync(path.join(printRoot, n)).isDirectory();
      } catch {
        return false;   // dangling symlink or vanished entry
      }
    })
    .sort()
    .reverse()
    .map((id) => {
      const d = path.join(printRoot, id);
      const s = parseRunSummary(id, readJson(path.join(d, "run.json")), readJson(path.join(d, "render-book-vivid", "report.json")));
      return {
        ...s,
        hasPdf: isFile(path.join(d, "render-book-vivid", "book.pdf")),
        hasContact: isFile(path.join(d, "render-book-vivid", "contact-sheet.png")),
        hasReview: isFile(path.join(d, "review", "review.csv")),
        released: isFile(path.join(d, "release", "book.pdf")),
        hasStrategy: isDir(path.join(d, "strategy", "final")),
        hasEdited: isDir(path.join(d, "strategy", "edited")),
      };
    });
}

/** Create `<printRoot>/<runId>` unless a build is already running (checked first, so no empty dir is left behind). */
export function claimRunDir(printRoot: string, runId: string, running: boolean): string {
  if (running) throw new Error("a book build is already running for this course");
  const dir = path.join(printRoot, runId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ---- served-file allowlist --------------------------------------------------------------

const SERVED: Record<string, string> = {
  "render-book-vivid/book.pdf": "application/pdf",
  "render-book-vivid/contact-sheet.png": "image/png",
  "render-book-vivid/report.json": "application/json",
  "review/review.csv": "text/csv; charset=utf-8",
  "review/greens-contact.png": "image/png",
  "strategy/review-final.md": "text/markdown; charset=utf-8",
  "tees/tee-check.md": "text/markdown; charset=utf-8",
  "run.json": "application/json",
  "book.log": "text/plain; charset=utf-8",
  "release/book.pdf": "application/pdf",
  "release/release.json": "application/json",
};
export const SERVED_NAMES = Object.keys(SERVED);

export type ResolvedFile =
  | { ok: true; file: string; contentType: string }
  | { ok: false; status: 400 | 404; error: string };

/** `name` must be one of the allowlisted relative names; the real path must stay inside the real run dir. */
export function resolveRunFile(printRoot: string, runId: string, name: string): ResolvedFile {
  if (!isValidRunId(runId)) return { ok: false, status: 400, error: "invalid run id" };
  if (!Object.prototype.hasOwnProperty.call(SERVED, name)) return { ok: false, status: 400, error: "file not allowed" };
  const runDirPath = path.join(printRoot, runId);
  let realRun: string;
  try {
    realRun = fs.realpathSync(runDirPath);
  } catch {
    return { ok: false, status: 404, error: "no such run" };
  }
  let real: string;
  try {
    real = fs.realpathSync(path.join(runDirPath, name));
  } catch {
    return { ok: false, status: 404, error: `no ${name} in this run` };
  }
  if (!real.startsWith(realRun + path.sep) || !fs.statSync(real).isFile()) {
    return { ok: false, status: 400, error: "file resolves outside the run dir" };
  }
  return { ok: true, file: real, contentType: SERVED[name] };
}

// ---- review.csv -------------------------------------------------------------------------

export interface ReviewTable {
  columns: string[];
  rows: Record<string, string>[];
  /** 1-based data-row numbers that had MORE cells than the header (parse only; the extra cells are not kept). */
  ragged?: number[];
}

export function parseReviewCsv(text: string): ReviewTable {
  const records: string[][] = [];
  let field = "";
  let rec: string[] = [];
  let inQuotes = false;
  let any = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') { inQuotes = true; any = true; }
    else if (c === ",") { rec.push(field); field = ""; any = true; }
    else if (c === "\r" || c === "\n") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      if (any || field !== "" || rec.length) { rec.push(field); records.push(rec); }
      field = ""; rec = []; any = false;
    } else { field += c; any = true; }
  }
  if (any || field !== "" || rec.length) { rec.push(field); records.push(rec); }
  const [columns = [], ...body] = records;
  return {
    columns,
    rows: body.map((r) => Object.fromEntries(columns.map((col, i) => [col, r[i] ?? ""]))),
    ragged: body.flatMap((r, i) => (r.length > columns.length ? [i + 1] : [])),
  };
}

const q = (v: string): string => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** CRLF line endings, like Python's csv.DictWriter, so an unchanged table round-trips byte for byte. */
export function serializeReviewCsv(t: ReviewTable): string {
  const lines = [t.columns.map(q).join(","), ...t.rows.map((r) => t.columns.map((c) => q(r[c] ?? "")).join(","))];
  return lines.join("\r\n") + "\r\n";
}

/** The CLI gate compares strip().lower(); mirror it so "Yes" / " yes" read as yes everywhere. */
export function normalizeOwnerOk(v: string | undefined | null): string {
  return (v ?? "").trim().toLowerCase();
}

export function normalizeReviewTable(t: ReviewTable): ReviewTable {
  if (!t.columns.includes("owner_ok")) return t;
  return { ...t, rows: t.rows.map((r) => ({ ...r, owner_ok: normalizeOwnerOk(r.owner_ok) })) };
}

export type OwnerMark = "yes" | "no" | "";

/** Sets owner_ok per hole (unknown holes ignored); returns a new table, adding the column if absent. */
export function applyOwnerOk(t: ReviewTable, marks: Record<string, OwnerMark>): ReviewTable {
  const columns = t.columns.includes("owner_ok") ? t.columns : [...t.columns, "owner_ok"];
  return {
    columns,
    rows: t.rows.map((r) => ({ ...r, owner_ok: Object.prototype.hasOwnProperty.call(marks, r.hole) ? marks[r.hole] : (r.owner_ok ?? "") })),
  };
}

/** The release gate, as print_review.release checks it (the CLI stays the authority). */
export function allOwnerOk(t: ReviewTable): boolean {
  return t.rows.length > 0 && t.rows.every((r) => normalizeOwnerOk(r.owner_ok) === "yes");
}
