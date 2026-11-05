// server.ts — SERVER-ONLY glue for the /local route handlers: the cohort loader, the real
// process spawner behind JobRegistry, and small filesystem helpers. Kept apart from the pure
// modules (cohort.ts, jobs.ts) so those stay unit-testable without touching disk.

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { JobRegistry, type Spawner } from "./jobs";
import { parseCohort, type CohortEntry } from "./cohort";
import { LOCAL_PATHS, playbookDir, reportJsonPath } from "./config";
import type { FileInfo, PlaybookFile } from "./types";

export type { FileInfo, PlaybookFile };

let cohortCache: CohortEntry[] | null = null;

/** The cohort file, parsed once per server process. */
export function loadCohort(): CohortEntry[] {
  if (!cohortCache) {
    cohortCache = parseCohort(JSON.parse(fs.readFileSync(LOCAL_PATHS.cohortFile, "utf8")));
  }
  return cohortCache;
}

const reportAnomaliesCache = new Map<string, { mtimeMs: number; anomalies: string[] }>();

/**
 * Report existence + distinct anomaly `kind`s for a course's generation report
 * (`<runDir>/cache/<key>.report.json`), cached by file mtime. GET /local/api/generated calls this
 * once per cohort entry (~5.6k small files): the first scan after a restart re-parses everything
 * that changed, later scans in the same process are stat-only for unchanged reports.
 */
export function loadReportAnomalies(key: string): { valid: boolean; anomalies: string[] } {
  const p = reportJsonPath(key);
  let st: fs.Stats;
  try {
    st = fs.statSync(p);
  } catch {
    return { valid: false, anomalies: [] };
  }
  const cached = reportAnomaliesCache.get(key);
  if (cached && cached.mtimeMs === st.mtimeMs) {
    return { valid: true, anomalies: cached.anomalies };
  }
  let anomalies: string[] = [];
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    const raw = Array.isArray(data?.anomalies) ? (data.anomalies as unknown[]) : [];
    const kinds = raw
      .map((a) => (a && typeof a === "object" ? (a as { kind?: unknown }).kind : undefined))
      .filter((k): k is string => typeof k === "string");
    anomalies = [...new Set(kinds)];
  } catch {
    anomalies = [];
  }
  reportAnomaliesCache.set(key, { mtimeMs: st.mtimeMs, anomalies });
  return { valid: true, anomalies };
}

/** Spawns the real process with stdout+stderr appended to the job's log file. */
export const nodeSpawner: Spawner = {
  spawn(spec) {
    fs.mkdirSync(path.dirname(spec.logFile), { recursive: true });
    const log = fs.openSync(spec.logFile, "a");
    fs.writeSync(log, `\n=== ${new Date().toISOString()} ${spec.command} ${spec.args.join(" ")}\n`);
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(spec.command, spec.args, {
        cwd: spec.cwd,
        env: { ...process.env, ...spec.env },
        stdio: ["ignore", log, log],
      });
    } catch (err) {
      fs.closeSync(log);   // a synchronous spawn throw must not leak the log fd
      throw err;
    }
    let exitCb: ((code: number | null) => void) | null = null;
    let done = false;
    const finish = (code: number | null) => {
      if (done) return;
      done = true;
      try {
        fs.closeSync(log);
      } catch {
        /* already closed */
      }
      exitCb?.(code);
    };
    child.on("exit", (code) => finish(code));
    // A spawn failure (e.g. ENOENT for the venv python) arrives here, not as a throw.
    child.on("error", (err) => {
      try {
        fs.appendFileSync(spec.logFile, `spawn error: ${err.message}\n`);
      } catch {
        /* best effort */
      }
      finish(null);
    });
    return {
      pid: child.pid,
      onExit(cb) {
        exitCb = cb;
      },
    };
  },
};

/** One registry per dev-server process, surviving module re-evaluation on hot reload. */
export function jobRegistry(): JobRegistry {
  const g = globalThis as unknown as { __localFlowJobs?: JobRegistry };
  if (!g.__localFlowJobs) g.__localFlowJobs = new JobRegistry(nodeSpawner);
  return g.__localFlowJobs;
}

export function fileInfo(p: string): FileInfo {
  try {
    const st = fs.statSync(p);
    return { exists: st.isFile(), size: st.size, mtime: st.mtime.toISOString() };
  } catch {
    return { exists: false };
  }
}

/** The last `maxBytes` of a log file ("" when absent). */
export function tailFile(p: string, maxBytes = 12_000): string {
  try {
    const st = fs.statSync(p);
    const start = Math.max(0, st.size - maxBytes);
    const fd = fs.openSync(p, "r");
    try {
      const buf = Buffer.alloc(st.size - start);
      fs.readSync(fd, buf, 0, buf.length, start);
      return buf.toString("utf8");
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return "";
  }
}

export function listPlaybooks(key: string): PlaybookFile[] {
  const dir = playbookDir(key);
  let names: string[];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((n) => n.endsWith(".playbook"))
    .map((n) => {
      const st = fs.statSync(path.join(dir, n));
      return { name: n, size: st.size, mtime: st.mtime.toISOString() };
    })
    .sort((a, b) => b.mtime.localeCompare(a.mtime));
}

/** Archive file names are whatever exportPlaybook produced; refuse anything path-like. */
export function isSafePlaybookName(name: string): boolean {
  return /^[A-Za-z0-9 _.()'-]+\.playbook$/.test(name) && !name.includes("..");
}

/** Centre and scorecard provenance of a `[OSMCourse]` file, or null when unreadable. */
export function readCourseFacts(
  file: string,
): { center: { lat: number; lng: number } | null; scorecard: { source: string; id: string } | null; checksOpen: number } | null {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const c = Array.isArray(data) ? data[0] : data;
    if (!c || typeof c !== "object") return null;
    const lat = Number(c.latitude);
    const lng = Number(c.longitude);
    const tags = (c.tags ?? {}) as Record<string, string>;
    const source = tags["scorecard:source"];
    const id = tags["scorecard:id"];
    const items = Array.isArray(c.checks?.items) ? (c.checks.items as { status?: string }[]) : [];
    return {
      center: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
      scorecard: source && id ? { source, id } : null,
      checksOpen: items.filter((i) => i.status === "open").length,
    };
  } catch {
    return null;
  }
}
