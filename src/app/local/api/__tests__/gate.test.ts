import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { gate } from "../_shared";

function req(headers: Record<string, string>): Request {
  const h = new Headers();
  for (const [k, v] of Object.entries(headers)) h.set(k, v);
  return new Request("http://localhost:3000/local/api/search", { headers: h });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("gate: request builder keeps the Host override", () => {
  it("keeps an explicit host header", () => {
    expect(req({ host: "evil.example" }).headers.get("host")).toBe("evil.example");
    expect(req({}).headers.get("host")).toBeNull();
  });
});

describe("gate: Host under next dev", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  it("allows localhost and 127.0.0.1 with or without a port, any case", () => {
    expect(gate(req({ host: "localhost:3000" }))).toBeNull();
    expect(gate(req({ host: "127.0.0.1:3001" }))).toBeNull();
    expect(gate(req({ host: "LOCALHOST" }))).toBeNull();
  });

  it("refuses a LAN address, a foreign name, and a missing Host with 403", () => {
    expect(gate(req({ host: "192.168.1.5:3000" }))?.status).toBe(403);
    expect(gate(req({ host: "evil.example" }))?.status).toBe(403);
    expect(gate(req({}))?.status).toBe(403);
  });
});

describe("gate: Origin under next dev", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  const host = "localhost:3000";

  it("allows a same-origin Origin", () => {
    expect(gate(req({ host, origin: "http://localhost:3000" }))).toBeNull();
  });

  it("refuses cross-site, null, other-port and unparsable origins with 403", () => {
    expect(gate(req({ host, origin: "http://evil.example" }))?.status).toBe(403);
    expect(gate(req({ host, origin: "null" }))?.status).toBe(403);
    expect(gate(req({ host, origin: "http://localhost:3001" }))?.status).toBe(403);
    expect(gate(req({ host, origin: "not a url" }))?.status).toBe(403);
  });
});

describe("gate: outside next dev", () => {
  it("404s even for a local Host", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(gate(req({ host: "localhost:3000" }))?.status).toBe(404);
  });
});
