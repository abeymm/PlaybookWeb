// autosave.ts — editor draft persistence (Design Resolution: debounced localStorage per courseKey
// + restore-on-open + stale-vs-regenerated detection R9).
//
// Storage is injected so the logic is unit-testable without a DOM. In the browser, pass
// window.localStorage (the default when omitted and one is available).

import type { OSMCourse } from "./types";

export interface EditorDraft {
  courseKey: string;
  savedAt: string; // ISO
  /** ETag of the canonical object the edit was based on (for stale-vs-regenerated, R9). */
  baseEtag: string | null;
  course: OSMCourse;
}

const PREFIX = "coursedata-draft:";

export function draftKey(courseKey: string): string {
  return `${PREFIX}${courseKey}`;
}

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function resolveStore(store?: Store): Store | null {
  if (store) return store;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
}

export function saveDraft(
  courseKey: string,
  course: OSMCourse,
  baseEtag: string | null,
  store?: Store
): void {
  const s = resolveStore(store);
  if (!s) return;
  const draft: EditorDraft = { courseKey, savedAt: new Date().toISOString(), baseEtag, course };
  try {
    s.setItem(draftKey(courseKey), JSON.stringify(draft));
  } catch {
    // Quota / private-mode failures are non-fatal — the draft is a convenience, not the source of truth.
  }
}

export function loadDraft(courseKey: string, store?: Store): EditorDraft | null {
  const s = resolveStore(store);
  if (!s) return null;
  const raw = s.getItem(draftKey(courseKey));
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as EditorDraft;
    return d && d.courseKey === courseKey && d.course ? d : null;
  } catch {
    return null;
  }
}

export function clearDraft(courseKey: string, store?: Store): void {
  const s = resolveStore(store);
  if (!s) return;
  try {
    s.removeItem(draftKey(courseKey));
  } catch {
    /* ignore */
  }
}

/**
 * True when the canonical object was regenerated after this draft was based on it — the draft's
 * baseEtag no longer matches the current canonical ETag (R9 / B6.5). The caller must warn and
 * never silently clobber.
 */
export function isDraftStale(draft: EditorDraft | null, currentEtag: string | null): boolean {
  if (!draft) return false;
  if (draft.baseEtag == null || currentEtag == null) return false;
  return draft.baseEtag !== currentEtag;
}

/** Minimal trailing-edge debounce (used to throttle autosave writes). */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): ((...args: A) => void) & { cancel: () => void } {
  let t: ReturnType<typeof setTimeout> | null = null;
  const wrapped = (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn(...args);
    }, ms);
  };
  wrapped.cancel = () => {
    if (t) clearTimeout(t);
    t = null;
  };
  return wrapped;
}
