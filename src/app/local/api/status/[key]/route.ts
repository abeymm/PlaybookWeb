import { NextResponse } from "next/server";
import {
  cacheJsonPath, courseJsonPath, reportJsonPath, playbookDir, runDir,
  generateLogPath, exportLogPath, inputJsonPath,
} from "@/lib/localflow/config";
import { fileInfo, jobRegistry, listPlaybooks, tailFile, readCourseFacts } from "@/lib/localflow/server";
import type { JobKind } from "@/lib/localflow/jobs";
import { gate, badKey, type KeyParams } from "../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jobView(kind: JobKind, key: string, logPath: string) {
  const job = jobRegistry().get(kind, key) ?? null;
  return { job, logTail: tailFile(logPath) };
}

/** GET /local/api/status/<key> — everything the page needs to render one course's state. */
export async function GET(req: Request, ctx: KeyParams) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const { key } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  // Centre + scorecard provenance: the generated JSON is authoritative, else the merged input,
  // else the cache file (centre only).
  const facts = readCourseFacts(courseJsonPath(key)) ?? readCourseFacts(inputJsonPath(key)) ?? readCourseFacts(cacheJsonPath(key));
  return NextResponse.json({
    key,
    cache: fileInfo(cacheJsonPath(key)),
    input: fileInfo(inputJsonPath(key)),
    generated: fileInfo(courseJsonPath(key)),
    report: fileInfo(reportJsonPath(key)),
    center: facts?.center ?? null,
    scorecard: facts?.scorecard ?? null,
    checksOpen: facts?.checksOpen ?? 0,
    playbooks: listPlaybooks(key),
    jobs: {
      generate: jobView("generate", key, generateLogPath(key)),
      export: jobView("export", key, exportLogPath(key)),
    },
    paths: {
      runDir: runDir(key),
      courseJson: courseJsonPath(key),
      inputJson: inputJsonPath(key),
      playbookDir: playbookDir(key),
    },
  });
}
