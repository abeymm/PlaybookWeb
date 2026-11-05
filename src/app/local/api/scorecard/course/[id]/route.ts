import { NextResponse } from "next/server";
import { getCourseDetail } from "@/lib/localflow/opengolfapi";
import { normalizeScorecard, assessScorecard } from "@/lib/localflow/scorecard";
import { gate } from "../../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /local/api/scorecard/course/<opengolfapi id>?holes=18 → { scorecard, quality } (preview). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const holes = Number(new URL(req.url).searchParams.get("holes")) || 18;
  try {
    const scorecard = normalizeScorecard(await getCourseDetail(id));
    return NextResponse.json({ scorecard, quality: assessScorecard(scorecard, holes) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
