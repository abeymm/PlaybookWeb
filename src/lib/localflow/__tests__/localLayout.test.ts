import { describe, it, expect, vi, afterEach } from "vitest";
import LocalLayout from "@/app/local/layout";

describe("LocalLayout gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("404s (throws notFound) outside next dev", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => LocalLayout({ children: null })).toThrow();
  });

  it("renders under next dev", () => {
    vi.stubEnv("NODE_ENV", "development");
    const el = LocalLayout({ children: null });
    expect(el).toHaveProperty("type");
  });
});
