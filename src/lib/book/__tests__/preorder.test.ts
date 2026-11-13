import { describe, it, expect } from "vitest";
import { normalizeName, parsePreorder } from "@/lib/book/preorder";

describe("normalizeName", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeName("  Ann   Marie  Lee ")).toBe("Ann Marie Lee");
  });
  it("accepts apostrophes, hyphens and accents", () => {
    expect(normalizeName("Zoë O'Brien-Smith")).toBe("Zoë O'Brien-Smith");
  });
  it("rejects 1 char, accepts exactly 2", () => {
    expect(normalizeName("a")).toBeNull();
    expect(normalizeName("Al")).toBe("Al");
  });
  it("accepts exactly 80 and rejects 81", () => {
    expect(normalizeName("a".repeat(80))).toBe("a".repeat(80));
    expect(normalizeName("a".repeat(81))).toBeNull();
  });
  it.each(["Ann\u0007Lee", "Ann\tLee", "Ann\u007fLee", "Ann\nLee"])("rejects control char in %j", (bad) => {
    expect(normalizeName(bad)).toBeNull();
  });
  it.each(["<b>Ann</b>", "Ann & Lee", 'Ann "Lee"'])("rejects markup characters in %j", (bad) => {
    expect(normalizeName(bad)).toBeNull();
  });
  it("rejects non-strings and blanks", () => {
    expect(normalizeName(5)).toBeNull();
    expect(normalizeName(undefined)).toBeNull();
    expect(normalizeName("   ")).toBeNull();
  });
});

describe("parsePreorder", () => {
  it("accepts and normalises name and email", () => {
    expect(parsePreorder({ name: "  Ann  Lee ", email: " Ann@Example.COM " })).toEqual({
      ok: true,
      value: { name: "Ann Lee", email: "ann@example.com", spam: false },
    });
  });
  it("ignores unknown fields, so no other personal data is kept", () => {
    const result = parsePreorder({ name: "Ann Lee", email: "a@b.com", phone: "555", groupSize: 4 });
    expect(result).toEqual({ ok: true, value: { name: "Ann Lee", email: "a@b.com", spam: false } });
  });
  it("reports name and email errors together", () => {
    const result = parsePreorder({ name: "", email: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields.name).toBe("Enter your name (2 to 80 characters).");
      expect(result.fields.email).toBe("Enter a valid email address.");
      expect(result.error).toBe("Check the highlighted fields.");
    }
  });
  it("reports only the bad field", () => {
    const result = parsePreorder({ name: "Ann Lee", email: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields.name).toBeUndefined();
      expect(result.fields.email).toBeDefined();
    }
  });
  it("rejects an email with markup characters", () => {
    expect(parsePreorder({ name: "Ann Lee", email: "<img>@example.com" }).ok).toBe(false);
  });
  it("flags a honeypot hit as spam without validating", () => {
    expect(parsePreorder({ website: "http://spam.example" })).toEqual({
      ok: true,
      value: { name: "", email: "", spam: true },
    });
  });
  it("rejects bodies that are not objects", () => {
    for (const body of [null, "x", 5, [], undefined]) {
      expect(parsePreorder(body)).toEqual({ ok: false, error: "Send a JSON object.", fields: {} });
    }
  });
});
