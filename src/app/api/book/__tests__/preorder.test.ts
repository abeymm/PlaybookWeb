import { describe, it, expect, vi, afterEach } from "vitest";
import { POST } from "@/app/api/book/preorder/route";

function post(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/book/preorder", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}
const json = (b: unknown) => post(JSON.stringify(b));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/book/preorder", () => {
  it("returns 200 for a valid pre-order and logs name and email in development", async () => {
    vi.stubEnv("BOOK_FORMS_DELIVERY", "log");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await POST(json({ name: "Ann Lee", email: "Ann@Example.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const line = String(info.mock.calls[0][0]);
    expect(line).toContain('"kind":"scottsdale-preorder"');
    expect(line).toContain('"name":"Ann Lee"');
    expect(line).toContain('"email":"ann@example.com"');
  });
  it("stores nothing beyond name, email and time", async () => {
    vi.stubEnv("BOOK_FORMS_DELIVERY", "log");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await POST(json({ name: "Ann Lee", email: "a@b.com", phone: "555-0100" }));
    const logged = JSON.parse(String(info.mock.calls[0][0]).replace("[book-forms] ", ""));
    expect(Object.keys(logged).sort()).toEqual(["email", "kind", "name", "receivedAt"]);
  });
  it("returns 400 with field errors for a bad name and email", async () => {
    const res = await POST(json({ name: "", email: "nope" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.fields.name).toBe("Enter your name (2 to 80 characters).");
    expect(body.fields.email).toBe("Enter a valid email address.");
  });
  it("returns 400 when only the email is bad", async () => {
    const res = await POST(json({ name: "Ann Lee", email: "nope" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fields.name).toBeUndefined();
  });
  it("returns 400 for a non-JSON content type and for broken JSON", async () => {
    expect((await POST(post("{}", { "content-type": "text/plain" }))).status).toBe(400);
    expect((await POST(post("{not json"))).status).toBe(400);
  });
  it("returns 413 for an oversized body", async () => {
    const res = await POST(post(JSON.stringify({ name: "Ann Lee", email: "a@b.com", pad: "x".repeat(5000) })));
    expect(res.status).toBe(413);
  });
  it("honeypot returns 200 without delivery", async () => {
    vi.stubEnv("BOOK_FORMS_DELIVERY", "log");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await POST(json({ website: "x" }));
    expect(res.status).toBe(200);
    expect(info).not.toHaveBeenCalled();
  });
  it("returns 503 with the pre-order message when delivery is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BOOK_FORMS_DELIVERY", "unknown-provider");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await POST(json({ name: "Ann Lee", email: "a@b.com" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("support@playbook.golf");
    expect(body.error).toContain("pre-order");
  });
});
