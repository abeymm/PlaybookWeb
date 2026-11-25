import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import * as copy from "../copy";
import { APP_PLAYBOOKS, EVENT_FACTS, isPlaceholder, isProtectedPlaybookLink } from "@/lib/book/scottsdale";

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (typeof value === "object" && value !== null) Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

const all = collectStrings(Object.values(copy));
const text = all.join("\n");

describe("copy rules for players", () => {
  it("collects strings from every export", () => {
    expect(all.length).toBeGreaterThan(20);
  });
  it("uses no em dash or en dash", () => {
    expect(all.filter((s) => /[–—]/.test(s))).toEqual([]);
  });
  it("never names a data source or method", () => {
    expect(all.filter((s) => /\b(NAIP|3DEP|USGS|GolfAPI|OpenStreetMap|OSM|lidar|satellite|machine learning|AI)\b/i.test(s))).toEqual([]);
  });
  it("never names a competitor", () => {
    expect(
      all.filter((s) => /strackaline|arccos|18birdies|golfshot|grint|hole19|golflogix|garmin|shot scope|skycaddie|bushnell|golfpad/i.test(s)),
    ).toEqual([]);
  });
  it("never names a handicap level or says serious amateur", () => {
    expect(all.filter((s) => /handicap|serious amateur|low[- ]handicap|mid[- ]handicap|scratch/i.test(s))).toEqual([]);
  });
  it("makes no score promise and gives no course count", () => {
    expect(all.filter((s) => /\b(lower your score|shoot lower|save strokes|cut strokes|break \d+|guarantee)/i.test(s))).toEqual([]);
    expect(all.filter((s) => /\b\d[\d,]*\s+courses\b/i.test(s))).toEqual([]);
  });
});

describe("event facts on the page", () => {
  it("states the three prices, once each, from the event facts", () => {
    expect(EVENT_FACTS.preorderPrice).toBe("$40");
    expect(EVENT_FACTS.tablePrice).toBe("$50");
    expect(EVENT_FACTS.storePrice).toBe("$79");
    for (const price of ["$40", "$50", "$79"]) expect(text).toContain(price);
    expect(new Set(text.match(/\$\d+/g))).toEqual(new Set(["$40", "$50", "$79"]));
  });
  it("never shows the old table price", () => {
    expect(text).not.toContain("$45");
  });
  it("keeps the Get the app link on the app block", () => {
    expect(copy.APPS.getApp).toBe("Get the app");
    expect(copy.APPS.getAppHref).toBe("/get");
  });
  it("says tax is extra", () => {
    expect(text).toMatch(/plus tax/i);
  });
  it("gives the pickup day and how to pay", () => {
    expect(EVENT_FACTS.pickupDay).toBe("Saturday, Dec 5");
    expect(text).toContain("Saturday, Dec 5");
    expect(text).toMatch(/card or cash/i);
  });
  it("makes the money-back promise", () => {
    expect(text).toMatch(/money back/i);
  });
  it("covers the two courses", () => {
    expect(text).toContain("Champions");
    expect(text).toContain("Stadium");
    expect(copy.HERO.headline).toMatch(/two courses/i);
  });
  it("tells players what the email is used for", () => {
    expect(copy.PREORDER.emailUse).toMatch(/only/i);
    expect(copy.PREORDER.emailUse).toMatch(/email/i);
  });
  it("asks for nothing beyond name and email", () => {
    expect(collectStrings(copy.PREORDER)).not.toEqual(expect.arrayContaining([expect.stringMatching(/phone|address|quantity/i)]));
  });
});

describe("app Playbook links", () => {
  it("has one slot for each course", () => {
    expect(APP_PLAYBOOKS.map((a) => a.course)).toEqual(["Champions", "Stadium"]);
  });
  it("accepts only sign-in (protected) links, never public ones", () => {
    expect(isProtectedPlaybookLink("https://playbook.golf/protected/ABC123")).toBe(true);
    expect(isProtectedPlaybookLink("https://playbook.golf/public/ABC123")).toBe(false);
    expect(isProtectedPlaybookLink("https://playbook.golf/private/ABC123")).toBe(false);
    expect(isProtectedPlaybookLink("https://evil.example/protected/ABC123")).toBe(false);
    expect(isProtectedPlaybookLink("http://playbook.golf/protected/ABC123")).toBe(false);
    expect(isProtectedPlaybookLink("https://playbook.golf/protected/")).toBe(false);
    expect(isProtectedPlaybookLink("https://playbook.golf/protected/a/../../public/x")).toBe(false);
  });
  const PRINTED = {
    Champions: "https://playbook.golf/protected/2C24F87D-1A90-416B-9918-69450C670E25?src=book",
    Stadium: "https://playbook.golf/protected/41699184-D8F6-4460-BDD1-05B57ECC9F68?src=book",
  } as const;
  it("holds the exact links printed on the back cover of the book", () => {
    for (const app of APP_PLAYBOOKS) expect(app.href).toBe(PRINTED[app.course]);
  });
  it("every link is a protected link", () => {
    for (const app of APP_PLAYBOOKS) expect(isProtectedPlaybookLink(app.href)).toBe(true);
  });
  it("keeps no bracket placeholder for the two course links", () => {
    expect(all.filter((s) => /^\[.*(Champions|Stadium).*\]$/.test(s))).toEqual([]);
    expect(copy.APPS).not.toHaveProperty("placeholder");
  });
  it("gives each course a png QR picture under /scottsdale/ that exists", () => {
    for (const app of APP_PLAYBOOKS) {
      expect(app.qr).toMatch(/^\/scottsdale\/qr-[a-z]+\.png$/);
      expect(existsSync(path.join(process.cwd(), "public", app.qr))).toBe(true);
    }
    expect(new Set(APP_PLAYBOOKS.map((a) => a.qr)).size).toBe(2);
  });
  it("has copy strings for the copy button and the QR line", () => {
    expect(copy.APPS.copyLink).toBe("Copy link");
    expect(copy.APPS.copied).toBe("Copied");
    expect(copy.APPS.linkLabel("Champions")).toBe("Open the Champions Playbook");
    expect(copy.APPS.qrAlt("Stadium")).toBe("QR code for the Stadium Playbook");
  });
  it("says the Playbooks need a free sign-in", () => {
    const body = copy.APPS.body.join(" ");
    expect(body).toMatch(/free/i);
    expect(body).toMatch(/sign[- ]in/i);
  });
});

/** Strings a reader sees on the page: no meta tags, alt text, links, picture paths, screen-reader-only text (srNote, copyFailed) or [placeholders]. */
function visibleStrings(value: unknown, key = "", out: string[] = []): string[] {
  if (typeof value === "string") {
    if (!/^(alt|src|srNote|copyFailed)$|href$/i.test(key) && !value.startsWith("[")) out.push(value);
  } else if (Array.isArray(value)) value.forEach((v) => visibleStrings(v, key, out));
  else if (typeof value === "object" && value !== null) {
    for (const [k, v] of Object.entries(value)) visibleStrings(v, k, out);
  }
  return out;
}
const onPage = Object.fromEntries(Object.entries(copy).filter(([key]) => key !== "PAGE"));
const visible = [
  ...visibleStrings(Object.values(onPage)),
  ...APP_PLAYBOOKS.map((a) => copy.APPS.linkLabel(a.course)),
  ...APP_PLAYBOOKS.map((a) => a.course),
];
const visibleText = visible.join("\n");
const wordCount = (s: string): number => s.split(/\s+/).filter((w) => /[A-Za-z0-9$]/.test(w)).length;
const WORD_LIMIT = 330;
const count = (re: RegExp): number => (visibleText.match(re) ?? []).length;

describe("short page: word budget and repeats", () => {
  it("keeps reader-visible copy, without the footer disclaimer, at the word limit", () => {
    expect(wordCount(visibleText.replace(copy.FOOTER.disclaimer, ""))).toBeLessThanOrEqual(WORD_LIMIT);
  });
  it("says each fact once or twice, no more", () => {
    expect(count(/\$40/g)).toBeLessThanOrEqual(2);
    expect(count(/\$50/g)).toBe(1);
    expect(count(/\$79/g)).toBe(1);
    expect(count(/registration/gi)).toBeLessThanOrEqual(3);
    expect(count(/plus tax/gi)).toBe(2);
    expect(count(/card or cash/gi)).toBe(1);
    expect(count(/both courses/gi)).toBeLessThanOrEqual(2);
  });
  it("has no copy sentence longer than 25 words", () => {
    const long = visible.flatMap((s) => s.split(/(?<=[.!?])\s+/)).filter((sentence) => wordCount(sentence) > 25);
    expect(long).toEqual([]);
  });
});

describe("hero", () => {
  it("has the draft B headline, a short sub line and the two links", () => {
    expect(copy.HERO.headline).toBe("Two courses you have not played. A plan for every shot.");
    expect(wordCount(copy.HERO.sub)).toBeLessThanOrEqual(30);
    expect(copy.HERO.cta).toBe("Pre-order for $40");
    expect(copy.HERO.sampleLink).toBe("See hole 1");
  });
});

describe("the one example", () => {
  const { tee, green } = copy.SAMPLE;
  const pictures = [...tee.pictures, green.picture];
  it("shows exactly three pictures, all Champions hole 1, and the sub-line says so", () => {
    expect(pictures).toHaveLength(3);
    for (const p of tee.pictures) expect(p.src).toMatch(/^\/scottsdale\/sample-hole1-[\w-]+\.webp$/);
    expect(green.picture.src).toBe("/scottsdale/sample-champions1-greenmap.webp");
    expect(copy.SAMPLE.headline).toBe("Champions hole 1, from the book");
  });
  it("does not use the old green maps, and the green picture has no caption", () => {
    const json = JSON.stringify(copy);
    expect(json).not.toContain("sample-hole1-greenmap");
    expect(json).not.toContain("sample-champions9-greenmap");
    expect(json).not.toMatch(/hole 9/i);
    expect(green.picture).not.toHaveProperty("caption");
  });
  it("gives the safe-side and take-care lines, and keeps the draft alt text", () => {
    expect(green.uses).toContainEqual({ label: "Green edge:", text: "safe side to miss." });
    expect(green.uses).toContainEqual({ label: "Amber edge or dot:", text: "take care." });
    expect(green.picture.alt).toBe("The green map for Champions hole 1: slope arrows and the safe side.");
    expect(tee.pictures[0].alt).toBe("The hole map for Champions hole 1: the planned shots on a photo of the hole.");
    expect(tee.pictures[1].alt).toBe("The view from the tee on Champions hole 1: two aim posts.");
  });
  it("gives the Tournaments line and the Local Rules line", () => {
    const t = green.uses.find((u) => u.label === "Tournaments:");
    expect(t?.text).toMatch(/Tournament Mode turns slope and altitude off/);
    expect(green.localRules).toBe("Check the event's Local Rules.");
  });
  it("gives each an alt and whole-number size", () => {
    for (const p of pictures) {
      expect(p.alt.length).toBeGreaterThan(0);
      expect(Number.isInteger(p.width) && p.width > 0).toBe(true);
      expect(Number.isInteger(p.height) && p.height > 0).toBe(true);
    }
  });
  it("uses no picture path twice and no feature picture", () => {
    const srcs = (JSON.stringify(copy).match(/"\/scottsdale\/[^"]+\.webp"/g) ?? []).map((s) => s.replace(/"/g, ""));
    expect(new Set(srcs).size).toBe(srcs.length);
    expect(srcs.filter((s) => s.includes("feature-"))).toEqual([]);
  });
  it("points at files that exist under public", () => {
    for (const p of pictures) expect(existsSync(path.join(process.cwd(), "public", p.src))).toBe(true);
  });
  it("has the two numbered subheads", () => {
    expect(tee.subhead).toBe("1. On the tee");
    expect(green.subhead).toBe("2. Into the green");
  });
  it("keeps the two tee pictures together, with 1 to 3 label lines", () => {
    expect(tee.pictures).toHaveLength(2);
    expect(tee.lines.length).toBeGreaterThanOrEqual(1);
    expect(tee.lines.length).toBeLessThanOrEqual(3);
  });
  it("lists 3 to 5 green lines, each a label line; only the Tournaments line runs past 15 words", () => {
    expect(green.uses.length).toBeGreaterThanOrEqual(3);
    expect(green.uses.length).toBeLessThanOrEqual(5);
    for (const u of [...green.uses, ...tee.lines]) {
      expect(u.label).toMatch(/:$/);
      if (u.label !== "Tournaments:") expect(wordCount(u.text)).toBeLessThanOrEqual(15);
    }
  });
});

describe("the app block", () => {
  it("has the draft B heading and body", () => {
    expect(copy.APPS.headline).toBe("Same plan in the free app");
    expect(copy.APPS.body.join(" ")).toBe("Use it in your practice rounds. A free sign-in is necessary.");
  });
});

describe("the sample PDF", () => {
  const file = path.join(process.cwd(), "public", copy.SAMPLE.pdfHref);
  it("exists, is non-empty and starts with the PDF header", () => {
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeGreaterThan(0);
    expect(readFileSync(file).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});

describe("struck-through store price", () => {
  const line = copy.PRICING.introLine;
  it("holds the store price once, in the one-time introductory line", () => {
    expect(line.price).toBe(EVENT_FACTS.storePrice);
    expect(line.before).toBe("One-time introductory price. The two-course book is normally");
    expect(count(/\$79/g)).toBe(1);
  });
  it("tells a screen reader this is not the price to pay", () => {
    expect(line.srNote).toMatch(/not (the|your) price/i);
  });
  it("keeps the five price lines in draft B order", () => {
    expect(copy.PRICING.rows.map((r) => r.label)).toEqual(["Pre-order:", "At the table:", "Pick up:", "Pay:", "Money back:"]);
  });
  it("renders the strike with an s element", () => {
    const src = readFileSync(path.join(process.cwd(), "src/app/scottsdale/_components/Sections.tsx"), "utf8");
    expect(src).toMatch(/<s>/);
    expect(src).toContain("introLine");
  });
});

describe("no placeholder shown to buyers", () => {
  it("isPlaceholder is true only for a whole [bracketed] string", () => {
    expect(isPlaceholder("[Registration hours]")).toBe(true);
    expect(isPlaceholder("  [x]  ")).toBe(true);
    expect(isPlaceholder("Pre-order [soon]")).toBe(false);
    expect(isPlaceholder("[open")).toBe(false);
    expect(isPlaceholder("open]")).toBe(false);
    expect(isPlaceholder("")).toBe(false);
  });
  it("keeps the hours placeholder in copy so the missing fact stays visible to developers", () => {
    expect(isPlaceholder(copy.PRICING.hoursPlaceholder)).toBe(true);
  });
  it("lists every placeholder in copy, and Sections guards the hours line with isPlaceholder", () => {
    const placeholders = all.filter(isPlaceholder);
    expect(placeholders).toEqual([copy.PRICING.hoursPlaceholder]);
    const src = readFileSync(path.join(process.cwd(), "src/app/scottsdale/_components/Sections.tsx"), "utf8");
    expect(src).toContain("isPlaceholder(PRICING.hoursPlaceholder)");
    expect(src).not.toMatch(/data-placeholder/);
  });
});

describe("copy button strings and picture sizes", () => {
  it("has the failure string", () => {
    expect(copy.APPS.copyFailed).toBe("Copy the link by hand.");
  });
  it("sizes the tee pictures to their real max widths, not 100vw", () => {
    const src = readFileSync(path.join(process.cwd(), "src/app/scottsdale/_components/Sections.tsx"), "utf8");
    expect(src).not.toContain("100vw");
  });
});
