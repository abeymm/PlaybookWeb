// saveFlow.ts — pure decision helpers for the editor save state machine (E1/N2), extracted so the
// flow is unit-testable independently of the React component.

import type { ValidationFinding, SaveVerdict } from "./types";
import { hasErrors } from "./validator";

/** Preflight blocks the staging upload iff there is any error-level finding (warnings never block, R5). */
export function shouldBlockSave(findings: ValidationFinding[]): boolean {
  return hasErrors(findings);
}

export type VerdictKind = "ok" | "conflict" | "error";

/** Classify a save verdict for the UI: ok | conflict (etag/version) | error. */
export function classifyVerdict(verdict: SaveVerdict): VerdictKind {
  if (verdict.ok) return "ok";
  if (verdict.code === "version-conflict" || verdict.code === "etag-conflict") return "conflict";
  return "error";
}
