/**
 * Pure validation for the TPC Scottsdale pre-order form: a name and an email, nothing else.
 * Unknown fields in the body are dropped, so no other personal data can reach storage.
 * No Next.js imports, so it is easy to unit test.
 */
import { hasControlChar, normalizeEmail, type Parsed } from "./forms";

export type Preorder = { name: string; email: string; spam: boolean };

const NAME_MIN = 2;
const NAME_MAX = 80;
// The form mailer puts values into an HTML email without escaping them, so markup characters
// are refused here at the door.
const NAME_FORBIDDEN = /[<>&"]/;
const EMAIL_FORBIDDEN = /[<>"]/;

const MSG_NOT_OBJECT = "Send a JSON object.";
const MSG_FIELDS = "Check the highlighted fields.";
const MSG_NAME = "Enter your name (2 to 80 characters).";
const MSG_EMAIL = "Enter a valid email address.";

/**
 * Trims a name and collapses internal whitespace to single spaces; returns null when it is not
 * 2 to 80 characters, contains a control character, or contains < > & ".
 */
export function normalizeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (hasControlChar(trimmed) || NAME_FORBIDDEN.test(trimmed)) return null;
  const name = trimmed.replace(/\s+/g, " ");
  if (name.length < NAME_MIN || name.length > NAME_MAX) return null;
  return name;
}

function isPlainObject(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

/** Validates the pre-order body. A filled honeypot (`website`) is reported as spam. */
export function parsePreorder(body: unknown): Parsed<Preorder> {
  if (!isPlainObject(body)) return { ok: false, error: MSG_NOT_OBJECT, fields: {} };
  if (typeof body.website === "string" && body.website.length > 0) {
    return { ok: true, value: { name: "", email: "", spam: true } };
  }
  const name = normalizeName(body.name);
  const rawEmail = normalizeEmail(body.email);
  const email = rawEmail !== null && !EMAIL_FORBIDDEN.test(rawEmail) ? rawEmail : null;
  if (name === null || email === null) {
    return {
      ok: false,
      error: MSG_FIELDS,
      fields: { ...(name === null ? { name: MSG_NAME } : {}), ...(email === null ? { email: MSG_EMAIL } : {}) },
    };
  }
  return { ok: true, value: { name, email, spam: false } };
}
