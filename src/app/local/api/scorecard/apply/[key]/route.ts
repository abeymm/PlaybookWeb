import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { cacheJsonPath, courseJsonPath, inputJsonPath } from "@/lib/localflow/config";
import { getCourseDetail } from "@/lib/localflow/opengolfapi";
import { normalizeScorecard, applyScorecard, assessScorecard } from "@/lib/localflow/scorecard";
import { validateCourseData, splitFindings } from "@/lib/coursedata/validator";
import type { OSMCourse } from "@/lib/coursedata/types";
import { gate, badKey, type KeyParams } from "../../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readCourses(file: string): OSMCourse[] | null {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(data) ? (data as OSMCourse[]) : [data as OSMCourse];
  } catch {
    return null;
  }
}

/**
 * POST /local/api/scorecard/apply/<key>  body { id }
 * Merges the OpenGolfAPI scorecard into BOTH copies that exist:
 *   - the input copy (cache course → runDir/input/<key>.json) — Generate prefers it, so the
 *     pipeline sees real pars and per-tee lengths;
 *   - the generated JSON, when present — validated strict before writing, previous kept as .prev.
 */
export async function POST(req: Request, ctx: KeyParams) {
  const blocked = gate();
  if (blocked) return blocked;
  const { key } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  let id = "";
  try {
    id = String(((await req.json()) as { id?: string }).id ?? "");
  } catch {
    /* handled below */
  }
  if (!id) return NextResponse.json({ error: "body must be { id }" }, { status: 400 });

  let scorecard;
  try {
    scorecard = normalizeScorecard(await getCourseDetail(id));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }

  // 1) input copy — always (source: existing input copy, else the read-only cache file)
  const inputFile = inputJsonPath(key);
  const source = readCourses(inputFile) ?? readCourses(cacheJsonPath(key));
  if (!source) return NextResponse.json({ error: `no cache course for ${key}` }, { status: 400 });
  const inputApplied = applyScorecard(source[0], scorecard);
  fs.mkdirSync(path.dirname(inputFile), { recursive: true });
  fs.writeFileSync(inputFile, JSON.stringify([inputApplied.course, ...source.slice(1)]));

  // 2) generated JSON — only when it exists, only when the merge validates
  let generated: { path: string; changes: string[]; skipped: string[]; findings: unknown[]; written: boolean; checks: number } | null = null;
  const genFile = courseJsonPath(key);
  const gen = readCourses(genFile);
  if (gen) {
    const applied = applyScorecard(gen[0], scorecard);
    const merged = [applied.course, ...gen.slice(1)];
    const findings = validateCourseData(merged, true);
    const { errors } = splitFindings(findings);
    const written = errors.length === 0;
    if (written) {
      fs.copyFileSync(genFile, genFile.replace(/\.json$/, ".prev.json"));
      fs.writeFileSync(genFile, JSON.stringify(merged));
    }
    generated = { path: genFile, changes: applied.changes, skipped: applied.skipped, findings, written, checks: applied.checks.length };
  }

  return NextResponse.json({
    ok: generated ? generated.written : true,
    scorecard: { id: scorecard.id, name: scorecard.name, parTotal: scorecard.parTotal, holes: scorecard.holes.length, tees: scorecard.tees.length },
    quality: assessScorecard(scorecard, source[0].holes.length),
    input: { path: inputFile, changes: inputApplied.changes, skipped: inputApplied.skipped, checks: inputApplied.checks.length },
    generated,
  });
}
