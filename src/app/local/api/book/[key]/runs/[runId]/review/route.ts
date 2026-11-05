import fs from "node:fs";
import { NextResponse } from "next/server";
import { printDir } from "@/lib/localflow/config";
import { jobRegistry } from "@/lib/localflow/server";
import {
  allOwnerOk, applyOwnerOk, normalizeOwnerOk, normalizeReviewTable, parseReviewCsv, resolveRunFile, serializeReviewCsv, type OwnerMark,
} from "@/lib/localflow/book";
import { gate, badKey } from "../../../../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string; runId: string }> };

function view(table: ReturnType<typeof parseReviewCsv>) {
  return { columns: table.columns, rows: table.rows, allOk: allOwnerOk(table) };
}

/** GET → the parsed review/review.csv. */
export async function GET(req: Request, ctx: Ctx) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const { key, runId } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  const r = resolveRunFile(printDir(key), runId, "review/review.csv");
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(view(normalizeReviewTable(parseReviewCsv(fs.readFileSync(r.file, "utf8")))));
}

/** PUT { marks: { "<hole>": "yes" | "no" | "" } } → rewrite review.csv with owner_ok set (other columns untouched). */
export async function PUT(req: Request, ctx: Ctx) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const { key, runId } = await ctx.params;
  const bad = badKey(key);
  if (bad) return bad;
  if (jobRegistry().get("book", key)?.status === "running") {
    return NextResponse.json({ error: "a book build is running for this course" }, { status: 409 });
  }
  const body = (await req.json().catch(() => null)) as { marks?: Record<string, unknown> } | null;
  const marks = body?.marks;
  if (!marks || typeof marks !== "object" || Array.isArray(marks)) {
    return NextResponse.json({ error: "body must be { marks: { hole: yes|no|'' } }" }, { status: 400 });
  }
  const clean: Record<string, OwnerMark> = {};
  for (const [hole, v] of Object.entries(marks)) {
    const m = typeof v === "string" ? normalizeOwnerOk(v) : null;
    if (m !== "yes" && m !== "no" && m !== "") {
      return NextResponse.json({ error: `owner_ok for hole ${hole} must be yes, no or empty` }, { status: 400 });
    }
    clean[hole] = m;
  }
  const r = resolveRunFile(printDir(key), runId, "review/review.csv");
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  const table = parseReviewCsv(fs.readFileSync(r.file, "utf8"));
  if (table.ragged?.length) {
    return NextResponse.json({ error: `review.csv has rows with extra cells (data row ${table.ragged.join(", ")}); not rewriting it` }, { status: 400 });
  }
  const holes = new Set(table.rows.map((row) => row.hole));
  const unknown = Object.keys(clean).filter((h) => !holes.has(h));
  if (unknown.length) {
    return NextResponse.json({ error: `unknown hole(s) in marks: ${unknown.join(", ")}` }, { status: 400 });
  }
  const next = normalizeReviewTable(applyOwnerOk(table, clean));
  fs.writeFileSync(r.file, serializeReviewCsv(next));
  return NextResponse.json(view(next));
}
