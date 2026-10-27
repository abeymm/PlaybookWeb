// strategy.ts — pure logic for the /local strategy review & edit page: note chains per hole, client-side
// rechaining for display, shot distances, the unsaved-edit diff, which archive file is "current" in a run,
// and the strategy_edit.py argv. No node: imports, so client components can use it; the server glue
// (fs + spawn) lives in strategyServer.ts.

export type ShotType = "tee" | "layup" | "approach" | "green";
export interface LatLng { lat: number; lng: number }

/** One archive note. Tee/layup/approach notes have a target; the green note sits at the last target (origin and target both), as strategy_finalize makes it. */
export interface ArchiveNote {
  id: string;
  hole: number;
  shotType: ShotType;
  shotOrder?: number;
  shotLat: number;
  shotLng: number;
  shotAlt: number;
  targetLat: number;
  targetLng: number;
  targetAlt: number;
  text: string;
  playbookId: string;
  createdAt: number;
  media: unknown[];
  isDraft: boolean;
  isFavorite: boolean;
}

export interface Flag { code: string; message: string }
export interface ReviewShot {
  order?: number; id: string; type: string; distance_yd?: number; remaining_to_green_yd?: number;
  flags?: Flag[]; target_surface?: string; overlap?: Record<string, number>;
}
export interface ReviewHole { hole: number; par?: number; shots: ReviewShot[]; flags?: Flag[]; warnings?: unknown[] }
export interface ReviewDoc { holes: ReviewHole[]; summary?: { flag_counts?: Record<string, number> } }
export interface ChangeRow { hole: number; note_id: string; type: string; field: string; before: unknown; after: unknown; rule: string; reason: string }
export interface RuleReportRow { hole: number; rule: string; status: string; detail: string }
export interface ChangesDoc { changes?: ChangeRow[]; rule_report?: RuleReportRow[]; deleted_notes?: unknown[] }

export interface StrategyPayload {
  archive: { notes: ArchiveNote[] } & Record<string, unknown>;
  archiveId: string;
  /** Absolute path of the archive JSON that `archive` was read from (the "playbook" for a rebuild). */
  archivePath: string;
  source: "edited" | "final";
  review: ReviewDoc | null;
  changes: ChangesDoc | null;
  editLog: unknown | null;
  tees: unknown;
  primaryTee: string | null;
  playbookId: string | null;
  /** `<run>/inputs`, for `--inputs-dir` on a rebuild. */
  inputsDir: string;
  runMeta: { edition: string | null; handicap: string | null; golfapiCourseId: string | null };
}

// ---- chains -------------------------------------------------------------------------------

const SHOT_RANK: Record<ShotType, number> = { tee: 0, layup: 1, approach: 2, green: 3 };
const rank = (t: string): number => SHOT_RANK[t as ShotType] ?? 9;

export const hasTarget = (n: ArchiveNote): boolean => !(n.targetLat === 0 && n.targetLng === 0);
export const isMovable = (n: ArchiveNote): boolean => n.shotType === "tee" || n.shotType === "layup" || n.shotType === "approach";

/** Chain order: shotType tee < layup < approach < green, then shotOrder. The file's own order means nothing. */
export function chainOrder(notes: readonly ArchiveNote[]): ArchiveNote[] {
  return [...notes].sort((a, b) => rank(a.shotType) - rank(b.shotType) || (a.shotOrder ?? 0) - (b.shotOrder ?? 0));
}

export function groupByHole(notes: readonly ArchiveNote[]): Map<number, ArchiveNote[]> {
  const m = new Map<number, ArchiveNote[]>();
  for (const n of notes) m.set(n.hole, [...(m.get(n.hole) ?? []), n]);
  for (const [h, list] of m) m.set(h, chainOrder(list));
  return new Map([...m.entries()].sort((a, b) => a[0] - b[0]));
}

/** Display-only rechain: each note after the first starts where the previous target landed; the green note's origin AND target move there too. */
export function rechain(chain: readonly ArchiveNote[]): ArchiveNote[] {
  const out: ArchiveNote[] = [];
  chain.forEach((n, i) => {
    const prev = out[i - 1];
    if (i === 0 || !prev || !hasTarget(prev)) { out.push(n); return; }
    const at = { shotLat: prev.targetLat, shotLng: prev.targetLng };
    out.push({ ...n, ...at, ...(n.shotType === "green" ? { targetLat: at.shotLat, targetLng: at.shotLng } : {}) });
  });
  return out;
}

const replaceHole = (notes: readonly ArchiveNote[], hole: number, next: readonly ArchiveNote[]): ArchiveNote[] => {
  const byId = new Map(next.map((n) => [n.id, n]));
  return notes.filter((n) => n.hole !== hole || byId.has(n.id)).map((n) => byId.get(n.id) ?? n);
};

const holeChain = (notes: readonly ArchiveNote[], hole: number) => chainOrder(notes.filter((n) => n.hole === hole));

/** Moves a tee/layup/approach target and rechains that hole. Unknown id, or a green note: unchanged. */
export function moveTarget(notes: readonly ArchiveNote[], id: string, to: LatLng): ArchiveNote[] {
  const note = notes.find((n) => n.id === id);
  if (!note || !isMovable(note)) return [...notes];
  const moved = holeChain(notes, note.hole).map((n) => (n.id === id ? { ...n, targetLat: to.lat, targetLng: to.lng } : n));
  return replaceHole(notes, note.hole, rechain(moved));
}

export function setText(notes: readonly ArchiveNote[], id: string, text: string): ArchiveNote[] {
  return notes.map((n) => (n.id === id ? { ...n, text } : n));
}

/** shotOrder = hole*1000 + n*100 by chain position (n from 1), the archive convention. */
function renumber(chain: readonly ArchiveNote[]): ArchiveNote[] {
  return chain.map((n, i) => ({ ...n, shotOrder: n.hole * 1000 + (i + 1) * 100 }));
}

/** The green point of a hole: the green note's origin, else the last target in the chain. */
export function greenPoint(chain: readonly ArchiveNote[]): LatLng | null {
  const g = chain.find((n) => n.shotType === "green");
  if (g) return { lat: g.shotLat, lng: g.shotLng };
  const last = [...chain].reverse().find(hasTarget);
  return last ? { lat: last.targetLat, lng: last.targetLng } : null;
}

export const midpoint = (a: LatLng, b: LatLng): LatLng => ({ lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 });

/** Inserts a layup right after the tee, targeted at the midpoint of (tee target → green). Null when the hole has no tee target or green note. */
export function addLayup(notes: readonly ArchiveNote[], hole: number, id: string, nowMs: number): ArchiveNote[] | null {
  const chain = holeChain(notes, hole);
  const tee = chain.find((n) => n.shotType === "tee");
  const greenNote = rechain(chain).find((n) => n.shotType === "green");
  if (!tee || !hasTarget(tee) || !greenNote) return null;
  const to = midpoint({ lat: tee.targetLat, lng: tee.targetLng }, { lat: greenNote.shotLat, lng: greenNote.shotLng });
  const layup: ArchiveNote = {
    id, hole, shotType: "layup", shotOrder: 0,
    shotLat: tee.targetLat, shotLng: tee.targetLng, shotAlt: tee.targetAlt,
    targetLat: to.lat, targetLng: to.lng, targetAlt: tee.targetAlt,
    text: "", playbookId: tee.playbookId,
    createdAt: nowMs / 1000 - 978307200,   // the app's Date reference (2001-01-01) seconds
    media: [], isDraft: false, isFavorite: false,
  };
  const at = chain.indexOf(tee) + 1;
  const next = renumber(rechain([...chain.slice(0, at), layup, ...chain.slice(at)]));
  return [...notes.filter((n) => n.hole !== hole), ...next];
}

export function deleteLayup(notes: readonly ArchiveNote[], id: string): ArchiveNote[] {
  const note = notes.find((n) => n.id === id);
  if (!note || note.shotType !== "layup") return [...notes];
  const next = renumber(rechain(holeChain(notes, note.hole).filter((n) => n.id !== id)));
  return [...notes.filter((n) => n.hole !== note.hole), ...next];
}

/** Polyline for the map: tee origin → each target → green point. */
export function chainLine(chain: readonly ArchiveNote[]): LatLng[] {
  const pts: LatLng[] = [];
  const tee = chain[0];
  if (tee && tee.shotType !== "green") pts.push({ lat: tee.shotLat, lng: tee.shotLng });
  for (const n of chain) if (n.shotType !== "green" && hasTarget(n)) pts.push({ lat: n.targetLat, lng: n.targetLng });
  const g = greenPoint(chain);
  const last = pts[pts.length - 1];
  if (g && (!last || last.lat !== g.lat || last.lng !== g.lng)) pts.push(g);
  return pts;
}

/** Identity of "what the map should be fitted to": a new hole, or its bbox arriving later, refits; a drag or text edit never does. */
export function mapFitKey(hole: number, bbox: unknown, hasLine: boolean): string {
  return `${hole}:${bbox ? JSON.stringify(bbox) : hasLine ? "chain" : "none"}`;
}

/** True when the map has not yet been fitted to this key (so the first sync after init always fits). */
export const needsFit = (lastKey: string, key: string): boolean => key !== lastKey && !key.endsWith(":none");

// ---- distance ------------------------------------------------------------------------------

const EARTH_M = 6371008.8;
const YD_PER_M = 1.0936133;

export function haversineYd(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h))) * YD_PER_M;
}

/** Origin → target yards for a shot, or null when it has no target (the green note is a point, not a shot). */
export function shotDistanceYd(n: ArchiveNote): number | null {
  return hasTarget(n) && n.shotType !== "green" ? haversineYd({ lat: n.shotLat, lng: n.shotLng }, { lat: n.targetLat, lng: n.targetLng }) : null;
}

// ---- unsaved-edit diff ----------------------------------------------------------------------

export interface NotesDiff { changed: string[]; added: string[]; deleted: string[]; count: number }
const EPS = 1e-7;   // degrees, ~1 cm: a drag and a drag back is no edit

/** Edits that count: tee/layup/approach target and text on kept notes, plus added and deleted notes. */
export function diffNotes(base: readonly ArchiveNote[], edited: readonly ArchiveNote[]): NotesDiff {
  const baseById = new Map(base.map((n) => [n.id, n]));
  const editedIds = new Set(edited.map((n) => n.id));
  const changed: string[] = [];
  const added: string[] = [];
  for (const n of edited) {
    const b = baseById.get(n.id);
    if (!b) { added.push(n.id); continue; }
    // The green note's target just follows the last target, so only movable notes' targets count.
    const moved = isMovable(n) && (Math.abs(b.targetLat - n.targetLat) > EPS || Math.abs(b.targetLng - n.targetLng) > EPS);
    if (moved || b.text !== n.text) changed.push(n.id);
  }
  const deleted = base.filter((n) => !editedIds.has(n.id)).map((n) => n.id);
  return { changed, added, deleted, count: changed.length + added.length + deleted.length };
}

// ---- which archive is current ---------------------------------------------------------------

export interface DirEntry { name: string; mtimeMs: number }
const NOT_ARCHIVE = new Set(["changes.json", "edit-log.json", "edited-notes.json"]);

export const isArchiveJsonName = (name: string): boolean =>
  name.endsWith(".json") && !NOT_ARCHIVE.has(name) && !name.startsWith("review-");

export const archiveIdFromName = (name: string): string => name.replace(/\.json$/, "");

/** The newest strategy/edited archive JSON if there is one, else the newest strategy/final one. */
export function pickArchive(files: { edited: readonly DirEntry[]; final: readonly DirEntry[] }):
  { source: "edited" | "final"; name: string } | null {
  const newest = (list: readonly DirEntry[]) =>
    [...list].filter((f) => isArchiveJsonName(f.name)).sort((a, b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name))[0];
  const e = newest(files.edited);
  if (e) return { source: "edited", name: e.name };
  const f = newest(files.final);
  return f ? { source: "final", name: f.name } : null;
}

// ---- strategy_edit.py -----------------------------------------------------------------------

export interface StrategyEditInput {
  basePath: string;
  notesPath: string;
  courseJson: string;
  teesPath: string;
  primaryTee: string;
  courseKey: string;
  outDir: string;
  secret: string | null;
}

/** argv after the python binary (run from the pipeline dir) and the child's EXTRA env; the secret is env-only. */
export function buildStrategyEditCommand(i: StrategyEditInput): { args: string[]; env: Record<string, string> } {
  return {
    args: [
      "-u", "core/strategy_edit.py",
      "--base", i.basePath,
      "--notes", i.notesPath,
      "--course-json", i.courseJson,
      "--tees", i.teesPath,
      "--primary-tee", i.primaryTee,
      "--course-key", i.courseKey,
      "--variant", "strategy",
      "--out-dir", i.outDir,
    ],
    env: i.secret ? { PLAYBOOK_ID_SECRET: i.secret } : {},
  };
}

// ---- path containment (string-only, so this file stays client-safe) ------------------------------

function normalizeAbs(p: string): string | null {
  if (!p.startsWith("/") || p.includes("\0")) return null;
  const out: string[] = [];
  for (const seg of p.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") { if (!out.pop()) return null; continue; }
    out.push(seg);
  }
  return "/" + out.join("/");
}

/** True when `child` is strictly inside `parent` (both absolute); `..` is resolved, never trusted. */
export function isInsideDir(parent: string, child: string): boolean {
  const p = normalizeAbs(parent);
  const c = normalizeAbs(child);
  if (!p || !c || p === "/") return false;
  return c.startsWith(p + "/");
}

export const MAX_NOTES = 200;
export const MAX_TEXT = 500;

/** The tee a run resolved: run.json `primaryTee` is {requested, resolved, ...} (a bare string is accepted); "auto" is never a tee. */
export function resolvedPrimaryTee(runJson: unknown): string | null {
  const pt = (runJson && typeof runJson === "object" ? (runJson as { primaryTee?: unknown }).primaryTee : null) as unknown;
  const v = pt && typeof pt === "object" ? (pt as { resolved?: unknown }).resolved : pt;
  return typeof v === "string" && v && v !== "auto" ? v : null;
}

/** Validates the PUT body; returns the notes or an error message. */
export function parseEditBody(body: unknown): { ok: true; baseArchiveId: string; notes: ArchiveNote[] } | { ok: false; error: string } {
  const b = (body && typeof body === "object" ? body : {}) as { baseArchiveId?: unknown; notes?: unknown };
  if (typeof b.baseArchiveId !== "string" || !/^[A-Za-z0-9-]{1,64}$/.test(b.baseArchiveId)) return { ok: false, error: "baseArchiveId is required" };
  if (!Array.isArray(b.notes) || b.notes.length === 0) return { ok: false, error: "notes must be a non-empty array" };
  if (b.notes.length > MAX_NOTES) return { ok: false, error: `at most ${MAX_NOTES} notes` };
  for (const n of b.notes as Record<string, unknown>[]) {
    const okType = n && typeof n.shotType === "string" && Object.prototype.hasOwnProperty.call(SHOT_RANK, n.shotType);
    if (!n || typeof n.id !== "string" || !n.id || !Number.isInteger(n.hole) || !okType || typeof n.text !== "string") {
      return { ok: false, error: "every note needs id, hole, shotType and text (a string)" };
    }
    if (n.text.length > MAX_TEXT) return { ok: false, error: `note text is limited to ${MAX_TEXT} characters` };
  }
  return { ok: true, baseArchiveId: b.baseArchiveId, notes: b.notes as ArchiveNote[] };
}
