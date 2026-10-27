// _shared.ts — the two checks every /local handler runs first: the dev-only, localhost-only gate and the
// course-key shape (which also keeps the key out of path traversal).

import { NextResponse } from "next/server";
import { isLocalFlowEnabled, isValidCourseKey } from "@/lib/localflow/config";

export const runtime = "nodejs";

/** True when the Host is localhost/127.0.0.1 (any port) and any Origin names that same host. */
export function isLocalRequest(req: Request): boolean {
  const host = req.headers.get("host");
  if (!host) return false;
  const hostname = host.replace(/:\d+$/, "").toLowerCase();
  if (hostname !== "localhost" && hostname !== "127.0.0.1") return false;
  const origin = req.headers.get("origin");
  if (origin === null) return true;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export function gate(req: Request): NextResponse | null {
  if (!isLocalFlowEnabled()) {
    return NextResponse.json({ error: "the local flow is only available under `next dev`" }, { status: 404 });
  }
  if (!isLocalRequest(req)) {
    return NextResponse.json({ error: "/local/api only answers same-origin requests from localhost" }, { status: 403 });
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
