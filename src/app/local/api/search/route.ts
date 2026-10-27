import { NextResponse } from "next/server";
import { searchCohort } from "@/lib/localflow/cohort";
import { loadCohort } from "@/lib/localflow/server";
import { gate } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /local/api/search?q=<name or key>&limit=20 → { items: CohortEntry[] } */
export async function GET(req: Request) {
  const blocked = gate(req);
  if (blocked) return blocked;
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20));
  try {
    return NextResponse.json({ items: searchCohort(loadCohort(), q, limit) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
