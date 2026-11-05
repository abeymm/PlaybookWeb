import fs from "node:fs";
import { NextResponse } from "next/server";
import {
  LOCAL_PATHS, cacheJsonPath, runDir, generateLogPath, inputDir, inputJsonPath,
} from "@/lib/localflow/config";
import { jobRegistry } from "@/lib/localflow/server";
import { gate, badKey, type KeyParams } from "../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /local/api/generate/<key> → { job } (null when never started in this server process). */
export async function GET(req: Request, ctx: KeyParams) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const { key } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  return NextResponse.json({ job: jobRegistry().get("generate", key) ?? null });
}

/**
 * POST /local/api/generate/<key> — run generate_course.py (the router) locally for an OSM cache course
 * (Phase 1 of the runbook, no upload). US courses go to GolfAPI generation (the id is found by name + location;
 * an ambiguous match fails the job with the candidates in generate.log), other countries to make_coursedata.py.
 * Output lands in the runbook's run-dir convention for both routes: <out>/cache/<key>.json.
 */
export async function POST(req: Request, ctx: KeyParams) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const { key } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  const input = cacheJsonPath(key);
  if (!fs.existsSync(input)) {
    return NextResponse.json({ error: `no OSM cache file at ${input}` }, { status: 400 });
  }
  const out = runDir(key);
  fs.mkdirSync(out, { recursive: true });
  // A scorecard-merged input copy (scorecard/apply) takes precedence over the read-only OSM cache.
  const osmCache = fs.existsSync(inputJsonPath(key)) ? inputDir(key) : LOCAL_PATHS.cacheDir;
  try {
    const job = jobRegistry().start("generate", key, {
      command: LOCAL_PATHS.python,
      args: ["-u", LOCAL_PATHS.generateScript, "--course-key", key, "--osm-cache", osmCache, "--out", out],
      cwd: LOCAL_PATHS.pipelineDir,
      logFile: generateLogPath(key),
    });
    return NextResponse.json({ job }, { status: job.status === "failed" ? 500 : 202 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 409 });
  }
}
