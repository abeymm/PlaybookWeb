import { describe, it, expect, vi, afterEach } from "vitest";
import { scrubChildOutput } from "../bookServer";

describe("scrubChildOutput", () => {
  afterEach(() => { vi.unstubAllEnvs(); });
  it("replaces the env secret everywhere", () => {
    vi.stubEnv("PLAYBOOK_ID_SECRET", "fake-secret-XYZ123");
    expect(scrubChildOutput("start fake-secret-XYZ123 mid fake-secret-XYZ123 end")).toBe("start *** mid *** end");
  });
});
