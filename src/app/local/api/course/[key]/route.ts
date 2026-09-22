import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { cacheJsonPath, courseJsonPath } from "@/lib/localflow/config";
import { validateCourseData, splitFindings } from "@/lib/coursedata/validator";
import { gate, badKey, type KeyParams } from "../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /local/api/course/<key>?source=generated|cache → the `[OSMCourse]` JSON file as-is. */
export async function GET(req: Request, ctx: KeyParams) {
  const blocked = gate();
  if (blocked) return blocked;
  const { key } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  const source = new URL(req.url).searchParams.get("source") ?? "generated";
  const file = source === "cache" ? cacheJsonPath(key) : courseJsonPath(key);
  try {
    const text = fs.readFileSync(file, "utf8");
    return new NextResponse(text, { headers: { "content-type": "application/json" } });
  } catch {
    return NextResponse.json({ error: `no ${source} course JSON at ${file}` }, { status: 404 });
  }
}

/**
 * PUT /local/api/course/<key> — save corrections. The body is the full `[OSMCourse]` array;
 * it is validated strict (the same gate the editor Lambda applies) and rejected with the
 * findings on any error. The previous file is kept beside it as `<key>.prev.json`.
 */
export async function PUT(req: Request, ctx: KeyParams) {
  const blocked = gate();
  if (blocked) return blocked;
  const { key } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  const findings = validateCourseData(body, true);
  const { errors, warnings } = splitFindings(findings);
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, findings }, { status: 400 });
  }
  const file = courseJsonPath(key);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (fs.existsSync(file)) fs.copyFileSync(file, file.replace(/\.json$/, ".prev.json"));
    fs.writeFileSync(file, JSON.stringify(body));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
  return NextResponse.json({ ok: true, findings: warnings, path: file });
}
