import { describe, it, expect } from "vitest";
import { interpretSubmitResult, toFormRequest } from "@/lib/book/submitForm";
import type { Submission } from "@/lib/book/delivery";

const preorder: Submission = {
  kind: "scottsdale-preorder",
  name: "Ann Lee",
  email: "ann@example.com",
  receivedAt: "2026-11-13T10:00:00.000Z",
};

describe("toFormRequest", () => {
  it("maps a pre-order to the mailer's arguments, with the player as reply-to", () => {
    expect(toFormRequest(preorder)).toEqual({
      formType: "scottsdale-preorder",
      subject: "TPC Scottsdale book pre-order: Ann Lee",
      formData: { name: "Ann Lee", email: "ann@example.com", receivedAt: "2026-11-13T10:00:00.000Z" },
      replyToEmail: "ann@example.com",
    });
  });
  it("keeps the course-request mapping, with group size only when present", () => {
    const base: Submission = {
      kind: "course-request",
      email: "a@b.com",
      course: "Bandon Dunes",
      receivedAt: "2026-11-13T10:00:00.000Z",
    };
    expect(toFormRequest(base).formData).toEqual({
      email: "a@b.com",
      course: "Bandon Dunes",
      receivedAt: "2026-11-13T10:00:00.000Z",
    });
    expect(toFormRequest({ ...base, groupSize: 8 }).formData).toMatchObject({ groupSize: 8 });
  });
  it("strips line breaks from the subject", () => {
    const req = toFormRequest({ ...preorder, name: "Ann Lee" });
    expect(req.subject).not.toMatch(/[\r\n]/);
  });
});

describe("interpretSubmitResult", () => {
  it("accepts a success flag as an object or as a JSON string", () => {
    expect(interpretSubmitResult({ success: true, messageId: "m1" })).toEqual({ ok: true });
    expect(interpretSubmitResult(JSON.stringify({ success: true }))).toEqual({ ok: true });
  });
  it("rejects success: false and keeps the reason", () => {
    expect(interpretSubmitResult({ success: false, error: "ses down" })).toEqual({
      ok: false,
      error: "ses down",
    });
  });
  it.each([null, undefined, "not json", 5, [], {}, { success: "true" }])("rejects %j", (raw) => {
    expect(interpretSubmitResult(raw).ok).toBe(false);
  });
});
