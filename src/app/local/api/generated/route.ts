import fs from "node:fs";
import { NextResponse } from "next/server";
import { courseJsonPath } from "@/lib/localflow/config";
import { loadCohort, loadReportAnomalies } from "@/lib/localflow/server";
import { reviewStatus } from "@/lib/localflow/reviewStatus";
import { gate } from "../_shared";
import type { GeneratedEntry } from "@/lib/localflow/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /local/api/generated?q= → { items: GeneratedEntry[], total }
 * Every cohort course whose generated courseData exists under the run root (LOCAL_FLOW_OUT_ROOT/
 * coursedata_<key>/cache/<key>.json), plus review-status inputs for the picker's grouping:
 * `anomalies` (distinct `kind`s from the course's report, mtime-cached — see
 * `loadReportAnomalies`) and `status` (`reviewStatus`, combining `anomalies`/`valid` with the
 * cohort record's `fragmentOf`/`exclude`). `q` filters by name or key (case-insensitive
 * substring). No row cap here — the picker groups the full set client-side and caps what it
 * renders per section; `total` is just `items.length`, kept for API-shape stability.
 */
export async function GET(req: Request) {
  const blocked = gate();
  if (blocked) return blocked;
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  const items: GeneratedEntry[] = [];
  for (const e of loadCohort()) {
    let st: fs.Stats;
    try {
      st = fs.statSync(courseJsonPath(e.courseKey));
    } catch {
      continue;
    }
    if (q && !e.name.toLowerCase().includes(q) && !e.courseKey.toLowerCase().includes(q)) continue;
    const { valid, anomalies } = loadReportAnomalies(e.courseKey);
    const status = reviewStatus({ valid, anomalies, fragmentOf: e.fragmentOf, exclude: e.exclude });
    items.push({ ...e, generatedAt: st.mtime.toISOString(), valid, anomalies, status });
  }
  items.sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ items, total: items.length });
}
