import { NextResponse } from "next/server";
import { LOCAL_PATHS, courseJsonPath, printDir } from "@/lib/localflow/config";
import { jobRegistry } from "@/lib/localflow/server";
import { loadIdSecret } from "@/lib/localflow/bookServer";
import { loadStrategyPayload, nodeExec, saveStrategyEdit } from "@/lib/localflow/strategyServer";
import { gate, badKey } from "../../../../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string; runId: string }> };

/** GET → the run's current plan: newest strategy/edited archive, else strategy/final, with review, changes, edit log, tees. */
export async function GET(_req: Request, ctx: Ctx) {
  const blocked = gate();
  if (blocked) return blocked;
  const { key, runId } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  const r = loadStrategyPayload(printDir(key), runId);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r.value);
}

/**
 * PUT { baseArchiveId, notes } → core/strategy_edit.py (synchronous, 120 s): re-derives the plan from the
 * edited notes into strategy/edited/. 422 = the script rejected the notes (body = its {error, holes});
 * 504 = timeout. The id secret goes only into the child's environment.
 */
export async function PUT(req: Request, ctx: Ctx) {
  const blocked = gate();
  if (blocked) return blocked;
  const { key, runId } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  const body = await req.json().catch(() => null);
  const r = await saveStrategyEdit(
    {
      exec: nodeExec, python: LOCAL_PATHS.python, pipelineDir: LOCAL_PATHS.pipelineDir, secret: loadIdSecret(), key,
      printRoot: printDir(key), courseJson: courseJsonPath(key), busy: jobRegistry().get("book", key)?.status === "running",
    },
    runId,
    body,
  );
  return NextResponse.json(r.body, { status: r.status });
}
