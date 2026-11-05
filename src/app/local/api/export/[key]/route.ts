import fs from "node:fs";
import { NextResponse } from "next/server";
import {
  LOCAL_PATHS, courseJsonPath, playbookDir, exportLogPath,
} from "@/lib/localflow/config";
import { jobRegistry } from "@/lib/localflow/server";
import { gate, badKey, type KeyParams } from "../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /local/api/export/<key> → { job } */
export async function GET(req: Request, ctx: KeyParams) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const { key } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  return NextResponse.json({ job: jobRegistry().get("export", key) ?? null });
}

/**
 * POST /local/api/export/<key> — build the `.playbook` archive from the generated JSON with the
 * iOS test-target tool (PlaybookArchiveExportTool), which reuses the app's own import + export
 * code. Runs `Scripts/run-tests.sh` in the iOS checkout; needs a booted simulator.
 */
export async function POST(req: Request, ctx: KeyParams) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const { key } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  const input = courseJsonPath(key);
  if (!fs.existsSync(input)) {
    return NextResponse.json({ error: `generate the course first — no JSON at ${input}` }, { status: 409 });
  }
  const outDir = playbookDir(key);
  fs.mkdirSync(outDir, { recursive: true });
  try {
    const job = jobRegistry().start("export", key, {
      command: "bash",
      args: ["Scripts/run-tests.sh", "PlaybookArchiveExportTool"],
      cwd: LOCAL_PATHS.iosDir,
      env: {
        TEST_RUNNER_PLAYBOOK_EXPORT_INPUT: input,
        TEST_RUNNER_PLAYBOOK_EXPORT_OUTDIR: outDir,
      },
      logFile: exportLogPath(key),
    });
    return NextResponse.json({ job }, { status: job.status === "failed" ? 500 : 202 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 409 });
  }
}
