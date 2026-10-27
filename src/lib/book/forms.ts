/**
 * Pure validation for the two /book forms. No Next.js imports, so it is easy to unit test.
 *
 * The optional `groupSize` on the course-request form backs the "Tournaments and groups: ask us"
 * link. There is no public group price; the owner replies by email.
 */

export type FieldErrors = { email?: string; course?: string; groupSize?: string };

export type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; fields: FieldErrors };

export type SampleRequest = { email: string; updates: boolean; spam: boolean };
export type CourseRequest = { email: string; course: string; groupSize?: number; spam: boolean };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_MAX = 254;
const COURSE_MIN = 2;
const COURSE_MAX = 120;
const GROUP_SIZE_MIN = 1;
const GROUP_SIZE_MAX = 999;
const GROUP_SIZE_DIGITS = /^[0-9]{1,3}$/;

const MSG_NOT_OBJECT = "Send a JSON object.";
const MSG_FIELDS = "Check the highlighted fields.";
const MSG_UPDATES = "updates must be true or false.";
const MSG_EMAIL = "Enter a valid email address.";
const MSG_COURSE = "Tell us the course name (2 to 120 characters).";
const MSG_GROUP_SIZE = "Enter the number of players (1 to 999).";

function isPlainObject(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

function hasControlChar(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/** Trims and lower-cases an email; returns null when it is not a valid address. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length === 0 || email.length > EMAIL_MAX) return null;
  return EMAIL_PATTERN.test(email) ? email : null;
}

/**
 * Trims a course name and collapses internal whitespace to single spaces; returns null when
 * it is not 2 to 120 characters or contains a control character.
 */
export function normalizeCourseName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (hasControlChar(trimmed)) return null;
  const course = trimmed.replace(/\s+/g, " ");
  if (course.length < COURSE_MIN || course.length > COURSE_MAX) return null;
  return course;
}

/**
 * Optional group size. undefined, null, or a blank string means omitted. Otherwise a string of
 * 1 to 3 ASCII digits or a finite integer, with a value from 1 to 999.
 */
export function normalizeGroupSize(value: unknown): { ok: true; value?: number } | { ok: false } {
  if (value === undefined || value === null) return { ok: true, value: undefined };
  let n: number;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return { ok: true, value: undefined };
    if (!GROUP_SIZE_DIGITS.test(trimmed)) return { ok: false };
    n = Number(trimmed);
  } else if (typeof value === "number" && Number.isInteger(value)) {
    n = value;
  } else {
    return { ok: false };
  }
  if (n < GROUP_SIZE_MIN || n > GROUP_SIZE_MAX) return { ok: false };
  return { ok: true, value: n };
}

function isHoneypotHit(body: Record<string, unknown>): boolean {
  return typeof body.website === "string" && body.website.length > 0;
}

function fieldFailure(fields: FieldErrors): Parsed<never> {
  return { ok: false, error: MSG_FIELDS, fields };
}

/** Validates the "Send me the sample hole" body. */
export function parseSampleRequest(body: unknown): Parsed<SampleRequest> {
  if (!isPlainObject(body)) return { ok: false, error: MSG_NOT_OBJECT, fields: {} };
  if (isHoneypotHit(body)) return { ok: true, value: { email: "", updates: false, spam: true } };
  if (body.updates !== undefined && typeof body.updates !== "boolean") {
    return { ok: false, error: MSG_UPDATES, fields: {} };
  }
  const email = normalizeEmail(body.email);
  if (email === null) return fieldFailure({ email: MSG_EMAIL });
  return { ok: true, value: { email, updates: body.updates === true, spam: false } };
}

/** Validates the "Not listed? Tell us the course" body. */
export function parseCourseRequest(body: unknown): Parsed<CourseRequest> {
  if (!isPlainObject(body)) return { ok: false, error: MSG_NOT_OBJECT, fields: {} };
  if (isHoneypotHit(body)) return { ok: true, value: { email: "", course: "", spam: true } };
  const email = normalizeEmail(body.email);
  const course = normalizeCourseName(body.course);
  const groupSize = normalizeGroupSize(body.groupSize);
  const fields: FieldErrors = {};
  if (email === null) fields.email = MSG_EMAIL;
  if (course === null) fields.course = MSG_COURSE;
  if (!groupSize.ok) fields.groupSize = MSG_GROUP_SIZE;
  if (email === null || course === null || !groupSize.ok) return fieldFailure(fields);
  const value: CourseRequest = { email, course, spam: false };
  if (groupSize.value !== undefined) value.groupSize = groupSize.value;
  return { ok: true, value };
}
