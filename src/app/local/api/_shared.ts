// _shared.ts — the two checks every /local handler runs first: the dev-only gate and the
// course-key shape (which also keeps the key out of path traversal).

import { NextResponse } from "next/server";
import { isLocalFlowEnabled, isValidCourseKey } from "@/lib/localflow/config";

export const runtime = "nodejs";

export function gate(): NextResponse | null {
  if (!isLocalFlowEnabled()) {
    return NextResponse.json({ error: "the local flow is only available under `next dev`" }, { status: 404 });
  }
  return null;
}

export function badKey(key: string): NextResponse | null {
  if (!isValidCourseKey(key)) {
    return NextResponse.json({ error: `invalid course key '${key}'` }, { status: 400 });
  }
  return null;
}

export type KeyParams = { params: Promise<{ key: string }> };
