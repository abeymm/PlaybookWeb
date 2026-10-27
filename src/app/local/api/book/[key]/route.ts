import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { LOCAL_PATHS, courseJsonPath, playbookDir, printDir } from "@/lib/localflow/config";
import { jobRegistry, tailFile } from "@/lib/localflow/server";
import { findGolfapiId, idSecretAvailable, loadIdSecret } from "@/lib/localflow/bookServer";
import { buildBookCommand, claimRunDir, listRuns, makeRunId, parseBookOptions } from "@/lib/localflow/book";
import { isInsideDir } from "@/lib/localflow/strategy";
import { strategyEditRunning } from "@/lib/localflow/strategyServer";
import type { BookStatusResponse } from "@/lib/localflow/bookTypes";
import { gate, badKey, type KeyParams } from "../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /local/api/book/<key> → job state, log tail of the latest run, runs list (newest first) with summaries. */
export async function GET(_req: Request, ctx: KeyParams) {
  const blocked = gate();
  if (blocked) return blocked;
  const { key } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  const job = jobRegistry().get("book", key) ?? null;
  const body: BookStatusResponse = {
    key,
    canBuild: fs.existsSync(courseJsonPath(key)),
    golfapiCourseId: findGolfapiId(key),
    secretAvailable: idSecretAvailable(),
    job,
    logTail: job ? tailFile(job.logFile) : "",
    runs: listRuns(printDir(key)),
    printDir: printDir(key),
  };
  return NextResponse.json(body);
}

/**
 * POST /local/api/book/<key> — run `core/print_book.py` on the generated course JSON, writing the run to
 * <runDir>/print/<runId>/. The id secret (env, else Keychain) goes ONLY into the child's environment.
 * Body: { variant, edition, handicap, primaryTee, golfapiCourseId?, playbook?, inputsDir? }. `playbook` is a file name in
 * the playbook dir, or (strategy page rebuild) an absolute archive path; `inputsDir` is an earlier run's inputs/ dir.
 * Both absolute forms must resolve (symlinks included) inside this course's print dir.
 */
export async function POST(req: Request, ctx: KeyParams) {
  const blocked = gate();
  if (blocked) return blocked;
  const { key } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  if (strategyEditRunning(key)) return NextResponse.json({ error: "a strategy edit is running for this course" }, { status: 409 });
  const courseJson = courseJsonPath(key);
  if (!fs.existsSync(courseJson)) {
    return NextResponse.json({ error: `generate the course first — no JSON at ${courseJson}` }, { status: 409 });
  }
  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const absPlaybook = typeof raw.playbook === "string" && raw.playbook.startsWith("/");
  const parsed = parseBookOptions({
    ...raw,
    golfapiCourseId: raw.golfapiCourseId || findGolfapiId(key),
    ...(absPlaybook ? { playbook: undefined, playbookPath: raw.playbook } : {}),
  });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const options = parsed.value;
  const realInside = (p: string): string | null => {
    try {
      const real = fs.realpathSync(p);
      return isInsideDir(fs.realpathSync(printDir(key)), real) ? real : null;
    } catch {
      return null;
    }
  };
  if (options.playbookPath) {
    const real = realInside(options.playbookPath);
    if (!real || !fs.statSync(real).isFile()) return NextResponse.json({ error: "playbook must be a file inside this course's print dir" }, { status: 400 });
    options.playbook = real;
    delete options.playbookPath;
  } else if (options.playbook) {
    const pb = path.join(playbookDir(key), options.playbook);
    if (!fs.existsSync(pb)) return NextResponse.json({ error: `no archive at ${pb}` }, { status: 400 });
    options.playbook = pb;
  }
  if (options.inputsDir) {
    const real = realInside(options.inputsDir);
    if (!real || !fs.statSync(real).isDirectory()) return NextResponse.json({ error: "inputsDir must be a directory inside this course's print dir" }, { status: 400 });
    options.inputsDir = real;
  }
  const secret = loadIdSecret();
  if (options.variant === "strategy" && !options.playbook && !secret) {
    return NextResponse.json(
      { error: "no id secret: set PLAYBOOK_ID_SECRET or add the Keychain item `playbook-id-secret`" },
      { status: 409 },
    );
  }
  const runId = makeRunId(new Date());
  let outDir: string;
  try {
    outDir = claimRunDir(printDir(key), runId, jobRegistry().get("book", key)?.status === "running");
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 409 });
  }
  const { args, env } = buildBookCommand({ key, courseJson, outDir, options, secret });
  try {
    const job = jobRegistry().start("book", key, {
      command: LOCAL_PATHS.python,
      args,
      cwd: LOCAL_PATHS.pipelineDir,
      env,
      logFile: path.join(outDir, "book.log"),
    });
    return NextResponse.json({ job, runId }, { status: job.status === "failed" ? 500 : 202 });
  } catch (err) {
    fs.rmSync(outDir, { recursive: true, force: true });   // start() refused: leave no empty run dir
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 409 });
  }
}
