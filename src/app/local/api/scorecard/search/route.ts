import { NextResponse } from "next/server";
import { searchCourses } from "@/lib/localflow/opengolfapi";
import { toCandidates } from "@/lib/localflow/scorecard";
import { gate } from "../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /local/api/scorecard/search?q=&lat=&lng=&radius_mi= → { items: ScorecardCandidate[] } */
export async function GET(req: Request) {
  const blocked = gate();
  if (blocked) return blocked;
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ items: [] });
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const radiusMi = Number(url.searchParams.get("radius_mi"));
  try {
    const raw = await searchCourses(q, {
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
      radiusMi: Number.isFinite(radiusMi) && radiusMi > 0 ? radiusMi : undefined,
    });
    return NextResponse.json({ items: toCandidates(raw) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
