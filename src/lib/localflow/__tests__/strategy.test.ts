import { describe, it, expect } from "vitest";
import {
  chainOrder, groupByHole, rechain, moveTarget, setText, addLayup, deleteLayup, chainLine, haversineYd, shotDistanceYd,
  diffNotes, pickArchive, resolvedPrimaryTee, mapFitKey, needsFit, buildStrategyEditCommand, isInsideDir, parseEditBody, greenPoint, type ArchiveNote,
} from "../strategy";

const note = (o: Partial<ArchiveNote> & { id: string; shotType: ArchiveNote["shotType"] }): ArchiveNote => ({
  hole: 1, shotOrder: 1100, shotLat: 33.0, shotLng: -111.0, shotAlt: 0, targetLat: 0, targetLng: 0, targetAlt: 0,
  text: "", playbookId: "PB", createdAt: 1, media: [], isDraft: false, isFavorite: false, ...o,
});

// Deliberately NOT in hole order, like the real file.
const hole1 = (): ArchiveNote[] => [
  note({ id: "g", shotType: "green", shotOrder: 1400, shotLat: 33.003, shotLng: -111.0 }),
  note({ id: "a", shotType: "approach", shotOrder: 1300, shotLat: 33.002, shotLng: -111.0, targetLat: 33.003, targetLng: -111.0 }),
  note({ id: "t", shotType: "tee", shotOrder: 1100, shotLat: 33.0, shotLng: -111.0, targetLat: 33.001, targetLng: -111.0 }),
  note({ id: "l", shotType: "layup", shotOrder: 1200, shotLat: 33.001, shotLng: -111.0, targetLat: 33.002, targetLng: -111.0 }),
  note({ id: "t2", hole: 2, shotType: "tee", shotOrder: 2100, targetLat: 33.1, targetLng: -111.1 }),
];

describe("chains", () => {
  it("orders by shotType then shotOrder", () => {
    expect(chainOrder(hole1().filter((n) => n.hole === 1)).map((n) => n.id)).toEqual(["t", "l", "a", "g"]);
    const odd = [note({ id: "x", shotType: "layup", shotOrder: 1300 }), note({ id: "y", shotType: "layup", shotOrder: 1200 }), note({ id: "z", shotType: "tee", shotOrder: 9999 })];
    expect(chainOrder(odd).map((n) => n.id)).toEqual(["z", "y", "x"]);
  });
  it("groups by hole, holes ascending", () => {
    const g = groupByHole(hole1());
    expect([...g.keys()]).toEqual([1, 2]);
    expect(g.get(1)!.map((n) => n.id)).toEqual(["t", "l", "a", "g"]);
  });
  it("rechain makes each origin follow the previous target but never moves the tee or green", () => {
    const chain = chainOrder(hole1().filter((n) => n.hole === 1)).map((n) => (n.id === "t" ? { ...n, targetLat: 33.0015 } : n));
    const r = rechain(chain);
    expect(r[0].shotLat).toBe(33.0);
    expect(r[1].shotLat).toBe(33.0015);
    expect(r[2].shotLat).toBe(33.002);
    expect(r[3].shotLat).toBe(33.003);   // green origin is the green point: locked
  });
});

describe("edits", () => {
  it("moveTarget moves the target and the next origin follows; other holes untouched", () => {
    const out = moveTarget(hole1(), "l", { lat: 33.0021, lng: -111.0001 });
    const l = out.find((n) => n.id === "l")!;
    const a = out.find((n) => n.id === "a")!;
    expect([l.targetLat, l.targetLng]).toEqual([33.0021, -111.0001]);
    expect([a.shotLat, a.shotLng]).toEqual([33.0021, -111.0001]);
    expect(out.find((n) => n.id === "g")!.shotLat).toBe(33.003);
    expect(out.find((n) => n.id === "t2")).toEqual(hole1().find((n) => n.id === "t2"));
    expect(out).toHaveLength(5);
  });
  it("moveTarget ignores the green note and unknown ids", () => {
    expect(moveTarget(hole1(), "g", { lat: 1, lng: 1 })).toEqual(hole1());
    expect(moveTarget(hole1(), "nope", { lat: 1, lng: 1 })).toEqual(hole1());
  });
  it("setText changes only that note", () => {
    const out = setText(hole1(), "a", "hit it left");
    expect(out.find((n) => n.id === "a")!.text).toBe("hit it left");
    expect(out.filter((n) => n.text !== "")).toHaveLength(1);
  });
  it("addLayup inserts right after the tee, at the midpoint of tee target to green", () => {
    const out = addLayup(hole1(), 1, "new-id", Date.UTC(2026, 9, 26))!;
    const chain = chainOrder(out.filter((n) => n.hole === 1));
    expect(chain.map((n) => n.id)).toEqual(["t", "new-id", "l", "a", "g"]);
    const nl = chain[1];
    expect(nl.shotType).toBe("layup");
    expect(nl.targetLat).toBeCloseTo((33.001 + 33.003) / 2, 9);
    expect([nl.shotLat, nl.shotLng]).toEqual([33.001, -111.0]);   // starts at the tee target
    expect(chain[2].shotLat).toBeCloseTo(nl.targetLat, 9);          // the old layup now starts where the new one lands
    expect(chain.map((n) => n.shotOrder)).toEqual([1100, 1200, 1300, 1400, 1500]);
    expect(nl.playbookId).toBe("PB");
    expect(out.filter((n) => n.hole === 2)).toHaveLength(1);
    expect(out).toHaveLength(6);
  });
  it("addLayup returns null without a tee target or green", () => {
    expect(addLayup(hole1().filter((n) => n.id !== "t"), 1, "x", 0)).toBeNull();
    expect(addLayup(hole1(), 9, "x", 0)).toBeNull();
  });
  it("deleteLayup removes only layups and rechains", () => {
    const out = deleteLayup(hole1(), "l");
    const chain = chainOrder(out.filter((n) => n.hole === 1));
    expect(chain.map((n) => n.id)).toEqual(["t", "a", "g"]);
    expect(chain[1].shotLat).toBe(33.001);
    expect(chain.map((n) => n.shotOrder)).toEqual([1100, 1200, 1300]);
    expect(deleteLayup(hole1(), "t")).toEqual(hole1());
  });
  it("the green note follows the last target (origin AND target), like strategy_finalize", () => {
    const out = moveTarget(hole1(), "a", { lat: 33.0031, lng: -111.0002 });
    const g = out.find((n) => n.id === "g")!;
    expect([g.shotLat, g.shotLng, g.targetLat, g.targetLng]).toEqual([33.0031, -111.0002, 33.0031, -111.0002]);
    const chain = chainOrder(out.filter((n) => n.hole === 1));
    expect(greenPoint(chain)).toEqual({ lat: 33.0031, lng: -111.0002 });
    expect(chainLine(chain).at(-1)).toEqual({ lat: 33.0031, lng: -111.0002 });
  });
  it("chainLine runs tee origin, targets, green point", () => {
    const line = chainLine(chainOrder(hole1().filter((n) => n.hole === 1)));
    expect(line.map((p) => p.lat)).toEqual([33.0, 33.001, 33.002, 33.003]);
    expect(greenPoint(chainOrder(hole1().filter((n) => n.hole === 1)))).toEqual({ lat: 33.003, lng: -111.0 });
  });
});

describe("map fit", () => {
  it("fits on first sync, on a new hole and when the bbox arrives; never on a drag; never with nothing to fit", () => {
    const first = mapFitKey(1, null, true);
    expect(needsFit("", first)).toBe(true);
    expect(needsFit(first, mapFitKey(1, null, true))).toBe(false);          // drag / text edit: same key
    const withBbox = mapFitKey(1, [[1, 2], [3, 4]], true);
    expect(needsFit(first, withBbox)).toBe(true);                           // course polygons arrived later
    expect(needsFit(withBbox, mapFitKey(2, [[1, 2], [3, 4]], true))).toBe(true);
    expect(needsFit("", mapFitKey(1, null, false))).toBe(false);
  });
});

describe("distance", () => {
  it("one degree of latitude is ~121,700 yards", () => {
    expect(haversineYd({ lat: 33, lng: -111 }, { lat: 34, lng: -111 })).toBeGreaterThan(121_600);
    expect(haversineYd({ lat: 33, lng: -111 }, { lat: 34, lng: -111 })).toBeLessThan(121_800);
  });
  it("shotDistanceYd is null without a target", () => {
    expect(shotDistanceYd(hole1().find((n) => n.id === "g")!)).toBeNull();
    expect(shotDistanceYd(hole1().find((n) => n.id === "t")!)!).toBeCloseTo(121.7, 0);
  });
});

describe("diffNotes", () => {
  it("is empty when nothing changed (even after a rechain)", () => {
    expect(diffNotes(hole1(), rechain(hole1()).length ? hole1() : []).count).toBe(0);
  });
  it("a drag and a drag back within ~1 cm counts 0; a real move counts 1", () => {
    const away = moveTarget(hole1(), "l", { lat: 33.0021, lng: -111 });
    expect(diffNotes(hole1(), moveTarget(away, "l", { lat: 33.002 + 5e-8, lng: -111 - 5e-8 })).count).toBe(0);
    expect(diffNotes(hole1(), moveTarget(away, "l", { lat: 33.002 + 2e-7, lng: -111 })).count).toBe(1);
  });
  it("text revert and add-then-delete count 0", () => {
    expect(diffNotes(hole1(), setText(setText(hole1(), "a", "x"), "a", "")).count).toBe(0);
    expect(diffNotes(hole1(), deleteLayup(addLayup(hole1(), 1, "n", 0)!, "n")).count).toBe(0);
  });
  it("counts moved targets, text edits, added and deleted notes once each", () => {
    let n = moveTarget(hole1(), "l", { lat: 33.0021, lng: -111 });   // l changed; a's origin follows (not counted)
    n = setText(n, "l", "x");                                          // same note: still one
    n = setText(n, "t", "y");
    n = addLayup(n, 2, "n2", 0) ?? n;                                  // hole 2 has no green: stays unchanged
    n = n.filter((x) => x.id !== "a");
    const d = diffNotes(hole1(), n);
    expect(d.changed.sort()).toEqual(["l", "t"]);
    expect(d.deleted).toEqual(["a"]);
    expect(d.added).toEqual([]);
    expect(d.count).toBe(3);
    const added = addLayup(hole1(), 1, "n1", 0)!;
    expect(diffNotes(hole1(), added)).toMatchObject({ added: ["n1"], count: 1 });
  });
});

describe("pickArchive", () => {
  const f = (name: string, mtimeMs: number) => ({ name, mtimeMs });
  it("prefers the newest edited archive and ignores helper files", () => {
    const r = pickArchive({
      edited: [f("review-edited.json", 9), f("edit-log.json", 9), f("edited-notes.json", 9), f("OLD.json", 1), f("NEW.json", 5), f("NEW.playbook", 9)],
      final: [f("FIN.json", 3), f("changes.json", 3)],
    });
    expect(r).toEqual({ source: "edited", name: "NEW.json" });
  });
  it("falls back to final, else null", () => {
    expect(pickArchive({ edited: [f("edit-log.json", 1)], final: [f("changes.json", 1), f("FIN.json", 1)] })).toEqual({ source: "final", name: "FIN.json" });
    expect(pickArchive({ edited: [], final: [f("changes.json", 1)] })).toBeNull();
  });
});

describe("buildStrategyEditCommand", () => {
  const i = {
    basePath: "/r/strategy/final/ABC.json", notesPath: "/r/strategy/edited/edited-notes.json", courseJson: "/o/cache/k.json",
    teesPath: "/r/tees/tees.json", primaryTee: "Black/Blue", courseKey: "way-1", outDir: "/r/strategy/edited",
  };
  it("builds the argv and keeps the secret out of it", () => {
    const { args, env } = buildStrategyEditCommand({ ...i, secret: "s3cret-xyz" });
    expect(args).toEqual([
      "-u", "core/strategy_edit.py", "--base", i.basePath, "--notes", i.notesPath, "--course-json", i.courseJson,
      "--tees", i.teesPath, "--primary-tee", "Black/Blue", "--course-key", "way-1", "--variant", "strategy", "--out-dir", i.outDir,
    ]);
    expect(args.join(" ")).not.toContain("s3cret-xyz");
    expect(env).toEqual({ PLAYBOOK_ID_SECRET: "s3cret-xyz" });
    expect(buildStrategyEditCommand({ ...i, secret: null }).env).toEqual({});
  });
});

describe("isInsideDir", () => {
  it("accepts descendants only", () => {
    expect(isInsideDir("/o/print", "/o/print/2026/inputs")).toBe(true);
    expect(isInsideDir("/o/print", "/o/print")).toBe(false);
    expect(isInsideDir("/o/print", "/o/print-evil/x")).toBe(false);
    expect(isInsideDir("/o/print", "/o/print/../secret")).toBe(false);
    expect(isInsideDir("/o/print", "/o/print/a/../b")).toBe(true);
    expect(isInsideDir("/o/print", "relative/x")).toBe(false);
    expect(isInsideDir("/", "/etc")).toBe(false);
  });
});

describe("parseEditBody", () => {
  it("validates shape", () => {
    expect(parseEditBody({}).ok).toBe(false);
    expect(parseEditBody({ baseArchiveId: "ABC-1", notes: [] }).ok).toBe(false);
    expect(parseEditBody({ baseArchiveId: "--x y", notes: hole1() }).ok).toBe(false);
    expect(parseEditBody({ baseArchiveId: "ABC-1", notes: [{ id: "a", hole: 1, shotType: "bogus", text: "" }] }).ok).toBe(false);
    expect(parseEditBody({ baseArchiveId: "ABC-1", notes: hole1() }).ok).toBe(true);
  });
  it("uses own-property checks, caps the note count and text length, rejects non-string text", () => {
    const ok = hole1()[0];
    expect(parseEditBody({ baseArchiveId: "A", notes: [{ ...ok, shotType: "toString" }] }).ok).toBe(false);
    expect(parseEditBody({ baseArchiveId: "A", notes: [{ ...ok, shotType: "constructor" }] }).ok).toBe(false);
    expect(parseEditBody({ baseArchiveId: "A", notes: [{ ...ok, text: 5 }] }).ok).toBe(false);
    expect(parseEditBody({ baseArchiveId: "A", notes: [{ ...ok, text: "x".repeat(501) }] }).ok).toBe(false);
    expect(parseEditBody({ baseArchiveId: "A", notes: [{ ...ok, text: "x".repeat(500) }] }).ok).toBe(true);
    expect(parseEditBody({ baseArchiveId: "A", notes: Array.from({ length: 201 }, () => ok) }).ok).toBe(false);
  });
  it("resolvedPrimaryTee reads the run.json object shape, never auto", () => {
    expect(resolvedPrimaryTee({ primaryTee: { requested: "auto", resolved: "Black" } })).toBe("Black");
    expect(resolvedPrimaryTee({ primaryTee: { requested: "auto", resolved: null } })).toBeNull();
    expect(resolvedPrimaryTee({ primaryTee: { resolved: "auto" } })).toBeNull();
    expect(resolvedPrimaryTee({ primaryTee: "Blue" })).toBe("Blue");
    expect(resolvedPrimaryTee({})).toBeNull();
  });
});
