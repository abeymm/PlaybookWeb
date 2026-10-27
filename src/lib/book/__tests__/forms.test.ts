import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  normalizeCourseName,
  normalizeGroupSize,
  parseSampleRequest,
  parseCourseRequest,
} from "@/lib/book/forms";

describe("normalizeEmail", () => {
  it("trims and lower-cases a valid address", () => {
    expect(normalizeEmail("  Abey@Example.COM ")).toBe("abey@example.com");
  });
  it.each(["a b@example.com", "no-at.example.com", "a@example", "a@example.c", "", "   "])(
    "rejects %j",
    (bad) => {
      expect(normalizeEmail(bad)).toBeNull();
    },
  );
  it("rejects non-strings", () => {
    expect(normalizeEmail(42)).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });
  it("accepts exactly 254 chars and rejects 255", () => {
    const at = (n: number) => `${"a".repeat(n - "@example.com".length)}@example.com`;
    expect(normalizeEmail(at(254))).not.toBeNull();
    expect(normalizeEmail(at(255))).toBeNull();
  });
});

describe("normalizeCourseName", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeCourseName("  Pebble   Beach   Links ")).toBe("Pebble Beach Links");
  });
  it("rejects 1 char, accepts exactly 2", () => {
    expect(normalizeCourseName("a")).toBeNull();
    expect(normalizeCourseName("ab")).toBe("ab");
  });
  it("accepts exactly 120 and rejects 121", () => {
    expect(normalizeCourseName("a".repeat(120))).toBe("a".repeat(120));
    expect(normalizeCourseName("a".repeat(121))).toBeNull();
  });
  it("rejects control characters", () => {
    expect(normalizeCourseName("Pebble\u0007Beach")).toBeNull();
    expect(normalizeCourseName("Pebble\u007fBeach")).toBeNull();
    expect(normalizeCourseName("Pebble\u0000Beach")).toBeNull();
    expect(normalizeCourseName("Pebble\tBeach")).toBeNull();
  });
  it("rejects non-strings", () => {
    expect(normalizeCourseName(5)).toBeNull();
  });
});

describe("parseSampleRequest", () => {
  it("accepts a valid body and defaults updates to false", () => {
    expect(parseSampleRequest({ email: " A@B.com " })).toEqual({
      ok: true,
      value: { email: "a@b.com", updates: false, spam: false },
    });
  });
  it("keeps updates: true", () => {
    const r = parseSampleRequest({ email: "a@b.com", updates: true });
    expect(r.ok && r.value.updates).toBe(true);
  });
  it("rejects non-boolean updates", () => {
    expect(parseSampleRequest({ email: "a@b.com", updates: "yes" })).toEqual({
      ok: false,
      error: "updates must be true or false.",
      fields: {},
    });
  });
  it.each([null, "text", ["a@b.com"], 5, undefined])("rejects non-object body %j", (body) => {
    expect(parseSampleRequest(body)).toEqual({
      ok: false,
      error: "Send a JSON object.",
      fields: {},
    });
  });
  it("reports a bad email as a field error", () => {
    expect(parseSampleRequest({ email: "nope" })).toEqual({
      ok: false,
      error: "Check the highlighted fields.",
      fields: { email: "Enter a valid email address." },
    });
  });
  it("flags a missing email", () => {
    const r = parseSampleRequest({});
    expect(!r.ok && r.fields.email).toBe("Enter a valid email address.");
  });
  it("treats a filled honeypot as spam without validating anything else", () => {
    expect(parseSampleRequest({ website: "http://spam", email: "bad", updates: 3 })).toEqual({
      ok: true,
      value: { email: "", updates: false, spam: true },
    });
  });
  it("ignores an empty honeypot and unknown keys", () => {
    const r = parseSampleRequest({ website: "", email: "a@b.com", extra: 1 });
    expect(r).toEqual({ ok: true, value: { email: "a@b.com", updates: false, spam: false } });
  });
});

describe("parseCourseRequest", () => {
  it("accepts and normalises", () => {
    expect(parseCourseRequest({ email: "A@b.com", course: "  Bandon   Dunes " })).toEqual({
      ok: true,
      value: { email: "a@b.com", course: "Bandon Dunes", spam: false },
    });
  });
  it("reports email and course errors together", () => {
    expect(parseCourseRequest({ email: "x", course: "y" })).toEqual({
      ok: false,
      error: "Check the highlighted fields.",
      fields: {
        email: "Enter a valid email address.",
        course: "Tell us the course name (2 to 120 characters).",
      },
    });
  });
  it("flags a missing course only", () => {
    const r = parseCourseRequest({ email: "a@b.com" });
    expect(r).toEqual({
      ok: false,
      error: "Check the highlighted fields.",
      fields: { course: "Tell us the course name (2 to 120 characters)." },
    });
  });
  it("honeypot returns spam", () => {
    const r = parseCourseRequest({ website: "x" });
    expect(r).toEqual({ ok: true, value: { email: "", course: "", spam: true } });
  });
  it("rejects non-object body", () => {
    const r = parseCourseRequest(null);
    expect(!r.ok && r.error).toBe("Send a JSON object.");
  });
});

describe("normalizeGroupSize", () => {
  it.each([undefined, null, "", "   "])("treats %j as omitted", (v) => {
    expect(normalizeGroupSize(v)).toEqual({ ok: true, value: undefined });
  });
  it("accepts digit strings and integers in 1 to 999", () => {
    expect(normalizeGroupSize(" 12 ")).toEqual({ ok: true, value: 12 });
    expect(normalizeGroupSize("1")).toEqual({ ok: true, value: 1 });
    expect(normalizeGroupSize("999")).toEqual({ ok: true, value: 999 });
    expect(normalizeGroupSize(40)).toEqual({ ok: true, value: 40 });
  });
  it.each(["abc", "0", "1000", "12 players", "2.5", "-3", "１２", 2.5, 0, 1000, NaN, Infinity, true, {}, []])(
    "rejects %j",
    (bad) => {
      expect(normalizeGroupSize(bad)).toEqual({ ok: false });
    },
  );
});

describe("parseCourseRequest groupSize", () => {
  const base = { email: "a@b.com", course: "Bandon Dunes" };
  it("omits groupSize when absent or blank", () => {
    const r = parseCourseRequest({ ...base, groupSize: "  " });
    expect(r).toEqual({ ok: true, value: { email: "a@b.com", course: "Bandon Dunes", spam: false } });
    expect(r.ok && "groupSize" in r.value).toBe(false);
  });
  it("includes a valid groupSize", () => {
    expect(parseCourseRequest({ ...base, groupSize: "12" })).toEqual({
      ok: true,
      value: { email: "a@b.com", course: "Bandon Dunes", groupSize: 12, spam: false },
    });
  });
  it("flags a bad groupSize together with other errors", () => {
    expect(parseCourseRequest({ email: "x", course: "Bandon Dunes", groupSize: "abc" })).toEqual({
      ok: false,
      error: "Check the highlighted fields.",
      fields: {
        email: "Enter a valid email address.",
        groupSize: "Enter the number of players (1 to 999).",
      },
    });
  });
  it("flags a bad groupSize alone", () => {
    const r = parseCourseRequest({ ...base, groupSize: "1000" });
    expect(!r.ok && r.fields).toEqual({ groupSize: "Enter the number of players (1 to 999)." });
  });
});
