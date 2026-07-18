import { describe, it, expect, vi } from "vitest";
import { saveDraft, loadDraft, clearDraft, isDraftStale, debounce, draftKey } from "../autosave";
import type { OSMCourse } from "../types";

function memStore() {
  const m = new Map<string, string>();
  return {
    store: {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    },
    map: m,
  };
}

const course: OSMCourse = {
  osmId: "way/1",
  name: "C",
  latitude: 0,
  longitude: 0,
  tags: {},
  holes: [],
  features: [],
};

describe("autosave — draft persistence (B6.2/B6.3)", () => {
  it("saveDraft → loadDraft round-trips, keyed by courseKey", () => {
    const { store, map } = memStore();
    saveDraft("way-1", course, "etag-1", store);
    expect(map.has(draftKey("way-1"))).toBe(true);
    const d = loadDraft("way-1", store);
    expect(d?.course.name).toBe("C");
    expect(d?.baseEtag).toBe("etag-1");
  });

  it("clearDraft removes it (draft cleared on successful save)", () => {
    const { store } = memStore();
    saveDraft("way-1", course, null, store);
    clearDraft("way-1", store);
    expect(loadDraft("way-1", store)).toBeNull();
  });
});

describe("autosave — stale vs regenerated (B6.5 / R9)", () => {
  it("isDraftStale true when baseEtag differs from current canonical etag", () => {
    const { store } = memStore();
    saveDraft("way-1", course, "etag-OLD", store);
    const d = loadDraft("way-1", store);
    expect(isDraftStale(d, "etag-NEW")).toBe(true); // regenerated after the edit
    expect(isDraftStale(d, "etag-OLD")).toBe(false);
    expect(isDraftStale(d, null)).toBe(false); // unknown current → not treated as stale
  });
});

describe("autosave — debounce (B6.1)", () => {
  it("collapses rapid calls into a single trailing invocation", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 800);
    d(1);
    d(2);
    d(3);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(800);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
    vi.useRealTimers();
  });
});
