import { describe, it, expect, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { confirmSig } from "@/lib/book/confirmSig";
import { toFormRequest } from "@/lib/book/submitForm";
import { deliver, type Submission } from "@/lib/book/delivery";

const SECRET = "test-secret-not-real";
const PINNED = "a19ead0ef0c33b96fc24d418c16481ca2bf67fb39a940b83709af78064e20015";

const preorder: Submission = {
  kind: "scottsdale-preorder",
  name: "Ann Lee",
  email: "golfer@example.com",
  receivedAt: "2026-11-20T01:24:30.894Z",
};
const request: Submission = {
  kind: "course-request",
  email: "golfer@example.com",
  course: "Bandon Dunes",
  receivedAt: "2026-11-20T01:24:30.894Z",
};

describe("confirmSig", () => {
  it("matches the pinned vector shared with the backend", () => {
    expect(confirmSig(SECRET, "golfer@example.com", "2026-11-20T01:24:30.894Z")).toBe(PINNED);
  });
  it("changes when the email or receivedAt changes", () => {
    const base = confirmSig(SECRET, "golfer@example.com", "2026-11-20T01:24:30.894Z");
    expect(confirmSig(SECRET, "other@example.com", "2026-11-20T01:24:30.894Z")).not.toBe(base);
    expect(confirmSig(SECRET, "golfer@example.com", "2026-11-20T01:24:30.895Z")).not.toBe(base);
  });
});

describe("toFormRequest signing", () => {
  it("adds confirmSig to a pre-order when the secret is set", () => {
    expect(toFormRequest(preorder, SECRET).formData.confirmSig).toBe(PINNED);
  });
  it("adds no confirmSig when the secret is unset or blank", () => {
    expect(toFormRequest(preorder).formData).not.toHaveProperty("confirmSig");
    expect(toFormRequest(preorder, "").formData).not.toHaveProperty("confirmSig");
    expect(toFormRequest(preorder, "   ").formData).not.toHaveProperty("confirmSig");
  });
  it("never signs the course request", () => {
    expect(toFormRequest(request, SECRET).formData).not.toHaveProperty("confirmSig");
  });
});

describe("deliver", () => {
  it("sends a signed pre-order through appsync when the secret is in the env", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const logger = { info: vi.fn(), warn: vi.fn() };
    await deliver(preorder, { BOOK_FORMS_DELIVERY: "appsync", BOOK_CONFIRM_SECRET: SECRET }, logger, send);
    expect(send.mock.calls[0][0].formData.confirmSig).toBe(PINNED);
  });
  it("still sends an unsigned pre-order without the secret", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const logger = { info: vi.fn(), warn: vi.fn() };
    const result = await deliver(preorder, { BOOK_FORMS_DELIVERY: "appsync" }, logger, send);
    expect(result.ok).toBe(true);
    expect(send.mock.calls[0][0].formData).not.toHaveProperty("confirmSig");
  });
  it("the log provider prints neither the signature nor the secret", async () => {
    const send = vi.fn();
    const logger = { info: vi.fn(), warn: vi.fn() };
    await deliver(preorder, { BOOK_FORMS_DELIVERY: "log", BOOK_CONFIRM_SECRET: SECRET }, logger, send);
    const out = JSON.stringify([logger.info.mock.calls, logger.warn.mock.calls]);
    expect(out).not.toContain(PINNED);
    expect(out).not.toContain(SECRET);
    expect(out).not.toContain("confirmSig");
    expect(send).not.toHaveBeenCalled();
  });
});

describe("server-only boundary", () => {
  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  }
  const files = walk(join(process.cwd(), "src")).filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes("__tests__"));
  it("no client component imports the signing modules or names the secret", () => {
    const allowed = ["lib/book/confirmSig.ts", "lib/book/submitForm.ts", "lib/book/delivery.ts"];
    for (const f of files) {
      if (allowed.some((a) => f.endsWith(a))) continue;
      const text = readFileSync(f, "utf8");
      expect(text, f).not.toContain("BOOK_CONFIRM_SECRET");
      if (/^\s*["']use client["']/.test(text)) {
        expect(text, f).not.toMatch(/book\/(confirmSig|submitForm|delivery)/);
      }
    }
  });
  it("the secret is never a NEXT_PUBLIC variable", () => {
    for (const f of files) expect(readFileSync(f, "utf8"), f).not.toContain("NEXT_PUBLIC_BOOK_CONFIRM");
  });
});
