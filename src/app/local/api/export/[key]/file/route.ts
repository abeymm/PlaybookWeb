import fs from "node:fs";
import { NextResponse } from "next/server";
import { playbookDir } from "@/lib/localflow/config";
import { isSafePlaybookName } from "@/lib/localflow/server";
import { resolvePlaybookFile } from "@/lib/localflow/book";
import { gate, badKey, type KeyParams } from "../../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /local/api/export/<key>/file?name=<Course>.playbook → the archive as a download. */
export async function GET(req: Request, ctx: KeyParams) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const { key } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  const name = new URL(req.url).searchParams.get("name") ?? "";
  if (!isSafePlaybookName(name)) {
    return NextResponse.json({ error: "invalid archive name" }, { status: 400 });
  }
  const r = resolvePlaybookFile(playbookDir(key), name);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  const data = fs.readFileSync(r.file);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "content-type": "application/zip",
      "content-length": String(data.length),
      "content-disposition": `attachment; filename="${name}"`,
    },
  });
}
