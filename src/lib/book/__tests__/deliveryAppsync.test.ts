import { describe, it, expect, vi } from "vitest";
import { resolveProvider, deliver, type Submission } from "@/lib/book/delivery";

const sub: Submission = {
  kind: "scottsdale-preorder",
  name: "Ann Lee",
  email: "ann@example.com",
  receivedAt: "2026-11-13T10:00:00.000Z",
};

describe("resolveProvider with appsync", () => {
  it("appsync is chosen only when asked for, in any environment", () => {
    expect(resolveProvider({ BOOK_FORMS_DELIVERY: "appsync", NODE_ENV: "production" })).toBe("appsync");
    expect(resolveProvider({ BOOK_FORMS_DELIVERY: " appsync ", NODE_ENV: "development" })).toBe("appsync");
  });
  it("still falls back to log in development and unconfigured in production", () => {
    expect(resolveProvider({ NODE_ENV: "development" })).toBe("log");
    expect(resolveProvider({ NODE_ENV: "production" })).toBe("unconfigured");
  });
});

describe("deliver with the appsync provider", () => {
  it("hands the mapped request to the sender and reports success", async () => {
    const logger = { info: vi.fn(), warn: vi.fn() };
    const send = vi.fn().mockResolvedValue(undefined);
    const result = await deliver(sub, { BOOK_FORMS_DELIVERY: "appsync" }, logger, send);
    expect(result).toEqual({ ok: true, provider: "appsync" });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({
      formType: "scottsdale-preorder",
      replyToEmail: "ann@example.com",
    });
  });
  it("reports failure when the sender throws, and keeps the email out of the log", async () => {
    const logger = { info: vi.fn(), warn: vi.fn() };
    const send = vi.fn().mockRejectedValue(new Error("boom"));
    const result = await deliver(sub, { BOOK_FORMS_DELIVERY: "appsync" }, logger, send);
    expect(result).toEqual({ ok: false, reason: "failed" });
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(String(logger.warn.mock.calls[0][0])).not.toContain("ann@example.com");
    expect(String(logger.warn.mock.calls[0][0])).not.toContain("Ann Lee");
  });
  it("the log provider never calls the sender", async () => {
    const logger = { info: vi.fn(), warn: vi.fn() };
    const send = vi.fn();
    const result = await deliver(sub, { BOOK_FORMS_DELIVERY: "log" }, logger, send);
    expect(result).toEqual({ ok: true, provider: "log" });
    expect(send).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("[book-forms] " + JSON.stringify(sub));
  });
  it("unconfigured never calls the sender", async () => {
    const logger = { info: vi.fn(), warn: vi.fn() };
    const send = vi.fn();
    const result = await deliver(sub, { NODE_ENV: "production" }, logger, send);
    expect(result).toEqual({ ok: false, reason: "unconfigured" });
    expect(send).not.toHaveBeenCalled();
  });
});
