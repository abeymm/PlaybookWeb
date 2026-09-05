// saveFlow.ts — pure decision helpers for the editor save state machine (E1/N2), extracted so the
// flow is unit-testable independently of the React component.

import type { ValidationFinding, SaveVerdict } from "./types";
import { hasErrors } from "./validator";

/** Preflight blocks the staging upload iff there is any error-level finding (warnings never block, R5). */
export function shouldBlockSave(findings: ValidationFinding[]): boolean {
  return hasErrors(findings);
}

export type VerdictKind = "ok" | "conflict" | "error";

/** Conflict codes that route to the "reload and re-apply" recovery UI rather than a plain error. */
const CONFLICT_CODES = new Set(["version-conflict", "etag-conflict"]);

/**
 * Classify a save verdict for the UI: ok | conflict (etag/version) | error.
 *
 * `code` is normalized from the Lambda's `errors[0].code` by api.ts; the fallback below reads the
 * finding directly so an un-normalized verdict cannot silently downgrade a real 412 to a generic
 * error and strand the conflict-recovery UI — which is exactly what shipped, since the Lambda
 * never sets a top-level `code`.
 */
export function classifyVerdict(verdict: SaveVerdict): VerdictKind {
  if (verdict.ok) return "ok";
  const code = verdict.code ?? verdict.errors?.[0]?.code;
  return code !== undefined && CONFLICT_CODES.has(code) ? "conflict" : "error";
}
