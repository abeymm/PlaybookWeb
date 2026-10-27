import { describe, it, expect } from "vitest";
import { BOOK_FACTS, BOOK_PRICING } from "@/lib/book/catalog";
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
    expect(copy.PLAY_LATER.body.toLowerCase()).toContain(copy.UPDATE_PROMISE.toLowerCase());
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

describe("review cuts", () => {
  it("sets the hero eyebrow to the collection and edition", () => {
    expect(copy.HERO.eyebrow).toBe(`Top US golf destinations · ${BOOK_FACTS.editionYear} edition`);
  });
  it("drops the hero chips and groups link", () => {
    expect("chipSpread" in copy.HERO).toBe(false);
    expect("groupsLink" in copy.HERO).toBe(false);
  });
  it("drops the design and plan sections", () => {
    expect("DESIGN" in copy).toBe(false);
    expect("PLAN" in copy).toBe(false);
  });
  it("keeps the stakes to a headline", () => {
    expect("body" in copy.STAKES).toBe(false);
  });
  it("has three plain result sentences", () => {
    expect(copy.RESULTS.items).toHaveLength(3);
    expect(copy.RESULTS.items.every((item) => typeof item === "string")).toBe(true);
  });
  it("builds the one packs line", () => {
    const line = copy.HERO.packs(BOOK_PRICING.packs.tiers, BOOK_PRICING.packs.freeShippingFrom).join(" · ");
    expect(line).toBe("2 books $89 · 3 or more $39 each · free shipping from $100");
  });
  it("ends the empathy line at So have we.", () => {
    expect(copy.WHY_A_BOOK.empathy.endsWith("So have we.")).toBe(true);
  });
  it("states the specs line from the book facts", () => {
    expect(copy.WHY_A_BOOK.specs).toContain(BOOK_FACTS.size);
    expect(copy.WHY_A_BOOK.specs).toContain(`${BOOK_FACTS.pages} pages`);
    expect(copy.WHY_A_BOOK.specs).toContain("[Paper and cover.]");
  });
  it("gives the page description its own wording", () => {
    expect(copy.PAGE.description).not.toBe(copy.HERO.subhead);
  });
  it("ends the app body on the pocket line", () => {
    expect(copy.APP.body.endsWith("The book stays in your pocket.")).toBe(true);
    expect(copy.APP.body).not.toContain("live maths");
  });
  it("has no body line in the final band", () => {
    expect("body" in copy.FINAL).toBe(false);
  });
  it("ends the figure caption on one spread per hole", () => {
    expect(copy.HERO.figcaption.endsWith("One spread per hole.")).toBe(true);
  });
});
