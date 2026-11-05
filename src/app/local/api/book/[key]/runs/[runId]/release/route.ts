import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { LOCAL_PATHS, printDir } from "@/lib/localflow/config";
import { jobRegistry } from "@/lib/localflow/server";
import { isValidRunId, releaseChildEnv } from "@/lib/localflow/book";
import { scrubChildOutput } from "@/lib/localflow/bookServer";
import { gate, badKey } from "../../../../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

type Ctx = { params: Promise<{ key: string; runId: string }> };

/**
 * POST → `print_book.py --release --out <runDir>`. The CLI is the review gate (build id + owner_ok=yes on
 * every row); a blocked release comes back as 409 with its message. The id secret is stripped from the
 * child's env and scrubbed from its output.
 */
export async function POST(req: Request, ctx: Ctx) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const { key, runId } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  if (!isValidRunId(runId)) return NextResponse.json({ error: "invalid run id" }, { status: 400 });
  if (jobRegistry().get("book", key)?.status === "running") {
    return NextResponse.json({ error: "a book build is running for this course" }, { status: 409 });
  }
  const outDir = path.join(printDir(key), runId);
  try {
    const { stdout, stderr } = await execFileAsync(
      LOCAL_PATHS.python, ["-u", "core/print_book.py", "--release", "--out", outDir],
      { cwd: LOCAL_PATHS.pipelineDir, encoding: "utf8", timeout: 120_000, env: releaseChildEnv(process.env) },
    );
    const message = scrubChildOutput(`${stdout}${stderr}`.trim());
    return NextResponse.json({ released: true, path: path.join(outDir, "release", "book.pdf"), message });
  } catch (e) {
    const err = e as { code?: number | string; killed?: boolean; signal?: string | null; stdout?: string; stderr?: string };
    if (err.killed || err.signal) {
      return NextResponse.json({ error: "release timed out after 120 s" }, { status: 504 });
    }
    const message = scrubChildOutput(`${err.stdout ?? ""}${err.stderr ?? ""}`.trim());
    return NextResponse.json({ error: message || `release failed (exit ${err.code})` }, { status: err.code === 2 ? 409 : 500 });
  }
}
