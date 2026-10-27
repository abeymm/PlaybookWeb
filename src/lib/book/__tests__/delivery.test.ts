import { describe, it, expect, vi } from "vitest";
import { resolveProvider, deliver, type Submission } from "@/lib/book/delivery";

describe("resolveProvider", () => {
  it("explicit log wins in any environment", () => {
    expect(resolveProvider({ BOOK_FORMS_DELIVERY: "log", NODE_ENV: "production" })).toBe("log");
    expect(resolveProvider({ BOOK_FORMS_DELIVERY: "log", NODE_ENV: "development" })).toBe("log");
  });
  it("unset in development falls back to log", () => {
    expect(resolveProvider({ NODE_ENV: "development" })).toBe("log");
    expect(resolveProvider({})).toBe("log");
  });
  it("unset in production is unconfigured", () => {
    expect(resolveProvider({ NODE_ENV: "production" })).toBe("unconfigured");
  });
  it("blank is treated as unset", () => {
    expect(resolveProvider({ BOOK_FORMS_DELIVERY: "  ", NODE_ENV: "production" })).toBe(
      "unconfigured",
    );
    expect(resolveProvider({ BOOK_FORMS_DELIVERY: "", NODE_ENV: "development" })).toBe("log");
  });
  it("unknown values are unconfigured in both environments", () => {
    expect(resolveProvider({ BOOK_FORMS_DELIVERY: "ses", NODE_ENV: "production" })).toBe(
      "unconfigured",
    );
    expect(resolveProvider({ BOOK_FORMS_DELIVERY: "ses", NODE_ENV: "development" })).toBe(
      "unconfigured",
    );
  });
});

const sub: Submission = {
  kind: "course-request",
  email: "golfer@example.com",
  course: "Bandon Dunes",
  receivedAt: "2026-10-27T00:00:00.000Z",
};

describe("deliver", () => {
  it("log provider writes the serialised submission and succeeds", async () => {
    const logger = { info: vi.fn(), warn: vi.fn() };
    const result = await deliver(sub, { BOOK_FORMS_DELIVERY: "log" }, logger);
    expect(result).toEqual({ ok: true, provider: "log" });
    expect(logger.info).toHaveBeenCalledWith("[book-forms] " + JSON.stringify(sub));
    expect(logger.warn).not.toHaveBeenCalled();
  });
  it("unconfigured warns without the email and reports the reason", async () => {
    const logger = { info: vi.fn(), warn: vi.fn() };
    const result = await deliver(sub, { NODE_ENV: "production" }, logger);
    expect(result).toEqual({ ok: false, reason: "unconfigured" });
    expect(logger.warn).toHaveBeenCalledWith(
      "[book-forms] BOOK_FORMS_DELIVERY is not set; submission dropped",
    );
    expect(logger.warn.mock.calls[0][0]).not.toContain("golfer@example.com");
    expect(logger.info).not.toHaveBeenCalled();
  });
});
