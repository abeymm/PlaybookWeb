import { describe, it, expect, vi, afterEach } from "vitest";
import { defaultOutRoot, isLocalFlowEnabled, isValidCourseKey } from "../config";

describe("isValidCourseKey", () => {
  it("accepts OSM cache keys", () => {
    expect(isValidCourseKey("way-123")).toBe(true);
    expect(isValidCourseKey("relation-14236725")).toBe(true);
    expect(isValidCourseKey("relation-1-hole1-2")).toBe(true);
  });

  it("accepts a lowercase RFC 4122 UUID (plan D9 course key)", () => {
    expect(isValidCourseKey("c80d40c5-1234-4abc-8def-0123456789ab")).toBe(true);
  });

  it("rejects an uppercase UUID", () => {
    expect(isValidCourseKey("C80D40C5-1234-4ABC-8DEF-0123456789AB")).toBe(false);
  });

  it("rejects a UUID with trailing or leading junk", () => {
    expect(isValidCourseKey("c80d40c5-1234-4abc-8def-0123456789ab-x")).toBe(false);
    expect(isValidCourseKey("x-c80d40c5-1234-4abc-8def-0123456789ab")).toBe(false);
    expect(isValidCourseKey("c80d40c5-1234-4abc-8def-0123456789ab/..")).toBe(false);
  });

  it("rejects traversal, separators, and empty", () => {
    expect(isValidCourseKey("..")).toBe(false);
    expect(isValidCourseKey("../etc")).toBe(false);
    expect(isValidCourseKey("way-1..2")).toBe(false);
    expect(isValidCourseKey("way-1/../x")).toBe(false);
    expect(isValidCourseKey("a/b")).toBe(false);
    expect(isValidCourseKey("a\\b")).toBe(false);
    expect(isValidCourseKey("")).toBe(false);
  });
});

describe("isLocalFlowEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is true under next dev", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isLocalFlowEnabled()).toBe(true);
  });

  it("is false in production even with LOCAL_FLOW=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LOCAL_FLOW", "1");
    expect(isLocalFlowEnabled()).toBe(false);
  });

  it("is false under test", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(isLocalFlowEnabled()).toBe(false);
  });

  it("is true under next dev without LOCAL_FLOW", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("LOCAL_FLOW", undefined);
    expect(isLocalFlowEnabled()).toBe(true);
  });
});

describe("defaultOutRoot", () => {
  const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;
  it("defaults to ~/playbook-local", () => {
    expect(defaultOutRoot(env({}), "/Users/x")).toBe("/Users/x/playbook-local");
  });
  it("honours LOCAL_FLOW_OUT_ROOT", () => {
    expect(defaultOutRoot(env({ LOCAL_FLOW_OUT_ROOT: "/a/b" }), "/Users/x")).toBe("/a/b");
  });
  it("never defaults under /tmp", () => {
    expect(defaultOutRoot(env({})).startsWith("/tmp")).toBe(false);
  });
});
