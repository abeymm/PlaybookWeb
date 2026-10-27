import fs from "node:fs";
import { NextResponse } from "next/server";
import { printDir } from "@/lib/localflow/config";
import { resolveRunFile } from "@/lib/localflow/book";
import { scrubChildOutput } from "@/lib/localflow/bookServer";
import { gate, badKey } from "../../../../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string; runId: string }> };

/** GET /local/api/book/<key>/runs/<runId>/file?name=render-book-vivid/book.pdf → an allowlisted run file. */
export async function GET(req: Request, ctx: Ctx) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const { key, runId } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  const name = new URL(req.url).searchParams.get("name") ?? "";
  const r = resolveRunFile(printDir(key), runId, name);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  const data = name === "book.log" ? Buffer.from(scrubChildOutput(fs.readFileSync(r.file, "utf8"))) : fs.readFileSync(r.file);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "content-type": r.contentType,
      "content-length": String(data.length),
      "content-disposition": `inline; filename="${name.split("/").pop()}"`,
      "cache-control": "no-store",
    },
  });
}
