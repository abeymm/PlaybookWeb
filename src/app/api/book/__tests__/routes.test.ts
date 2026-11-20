import { describe, it, expect, vi, afterEach } from "vitest";
import { POST as requestPost } from "@/app/api/book/request/route";
import * as requestModule from "@/app/api/book/request/route";

function post(url: string, body: string, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}
const courseReq = (b: unknown) => post("http://localhost/api/book/request", JSON.stringify(b));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/book/request", () => {
  it("returns 200 for a valid course request", async () => {
    vi.stubEnv("BOOK_FORMS_DELIVERY", "log");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await requestPost(courseReq({ email: "a@b.com", course: "Bandon Dunes" }));
    expect(res.status).toBe(200);
    expect(String(info.mock.calls[0][0])).toContain("Bandon Dunes");
  });
  it("returns 400 with fields.course on a missing course", async () => {
    const res = await requestPost(courseReq({ email: "a@b.com" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.fields.course).toBe("Tell us the course name (2 to 120 characters).");
    expect(json.fields.email).toBeUndefined();
  });
  it("delivers a valid groupSize as a number", async () => {
    vi.stubEnv("BOOK_FORMS_DELIVERY", "log");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await requestPost(
      courseReq({ email: "a@b.com", course: "Bandon Dunes", groupSize: "12" }),
    );
    expect(res.status).toBe(200);
    expect(String(info.mock.calls[0][0])).toContain('"groupSize":12');
  });
  it("returns 400 with fields.groupSize on a bad groupSize", async () => {
    const res = await requestPost(
      courseReq({ email: "a@b.com", course: "Bandon Dunes", groupSize: "abc" }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.fields.groupSize).toBe("Enter the number of players (1 to 999).");
  });
  it("omits groupSize from the log line when not sent", async () => {
    vi.stubEnv("BOOK_FORMS_DELIVERY", "log");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await requestPost(courseReq({ email: "a@b.com", course: "Bandon Dunes" }));
    expect(res.status).toBe(200);
    expect(String(info.mock.calls[0][0])).not.toContain("groupSize");
  });
  it("honeypot returns 200 without delivery", async () => {
    vi.stubEnv("BOOK_FORMS_DELIVERY", "log");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await requestPost(courseReq({ website: "x" }));
    expect(res.status).toBe(200);
    expect(info).not.toHaveBeenCalled();
  });
  it("returns 503 in production when delivery is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BOOK_FORMS_DELIVERY", "unknown-provider");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await requestPost(courseReq({ email: "a@b.com", course: "Bandon Dunes" }));
    expect(res.status).toBe(503);
  });
  it("returns 400 on invalid JSON", async () => {
    const res = await requestPost(post("http://localhost/api/book/request", "{not json"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "Send a JSON object." });
  });
  it("returns 400 on a non-JSON content type", async () => {
    const res = await requestPost(
      post("http://localhost/api/book/request", "email=a@b.com", { "content-type": "text/plain" }),
    );
    expect(res.status).toBe(400);
  });
  it("returns 413 on an oversized body", async () => {
    const res = await requestPost(courseReq({ email: "a@b.com", pad: "x".repeat(5000) }));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ ok: false, error: "Request too large." });
  });
  it("returns 413 when content-length declares an oversized body", async () => {
    const res = await requestPost(
      post("http://localhost/api/book/request", "{}", { "content-length": "99999" }),
    );
    expect(res.status).toBe(413);
  });
  it("exports only POST and runtime", () => {
    expect(Object.keys(requestModule).sort()).toEqual(["POST", "runtime"]);
  });
});
