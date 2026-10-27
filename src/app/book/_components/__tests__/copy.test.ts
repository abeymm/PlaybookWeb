import { describe, it, expect } from "vitest";
import * as copy from "../copy";

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (typeof value === "object" && value !== null) {
    Object.values(value).forEach((v) => collectStrings(v, out));
  }
  return out;
}

const all = collectStrings(Object.values(copy));

describe("book copy rules", () => {
  it("collects strings from every export", () => {
    expect(all.length).toBeGreaterThan(50);
  });
  it("never says serious amateur", () => {
    expect(all.filter((s) => /serious amateur/i.test(s))).toEqual([]);
  });
  it("says the only once, in the owner-confirmed app eyebrow", () => {
    expect(all.filter((s) => /\bthe only\b/i.test(s))).toEqual([copy.APP.eyebrow]);
  });
  it("never names a data source or method", () => {
    expect(all.filter((s) => /\b(NAIP|3DEP|GolfAPI|OpenStreetMap|OSM|lidar)\b/i.test(s))).toEqual([]);
  });
});

describe("companion app", () => {
  it("has five why-this-book cards and no edition card", () => {
    expect(copy.WHY_THIS_BOOK.cards.length).toBe(5);
    expect(copy.WHY_THIS_BOOK.cards.some((c) => c.key === "edition")).toBe(false);
  });
  it("links to /get with six items", () => {
    expect(copy.APP.href).toBe("/get");
    expect(copy.APP.items.length).toBe(6);
  });
});

describe("update promise and FAQ", () => {
  const items: readonly copy.FaqItem[] = copy.FAQ.items;
  it("uses the same promise in the play-later band", () => {
    expect(copy.PLAY_LATER.items[2].body).toBe(copy.UPDATE_PROMISE);
  });
  it("answers the changes FAQ with the promise and no placeholder", () => {
    const item = items.find((i) => i.id === "changes");
    expect(item?.answer).toContain(copy.UPDATE_PROMISE);
    expect(item?.placeholder).toBeUndefined();
  });
  it("links the courses FAQ to the request band", () => {
    const item = items.find((i) => i.id === "which-courses");
    expect(item?.link?.href).toBe("#request");
  });
});

describe("sample and hero", () => {
  it("points the sample at the public PDF", () => {
    expect(copy.SAMPLE.pdfHref).toBe("/book/sample-tpc-stadium.pdf");
  });
  it("has no launch note in the hero", () => {
    expect("launchNote" in copy.HERO).toBe(false);
  });
});
