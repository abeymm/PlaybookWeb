import { describe, it, expect } from "vitest";
import * as copy from "../copy";
import { APP_PLAYBOOKS, EVENT_FACTS, isProtectedPlaybookLink } from "@/lib/book/scottsdale";

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
    expect(EVENT_FACTS.tablePrice).toBe("$45");
    expect(EVENT_FACTS.storePrice).toBe("$79");
    for (const price of ["$40", "$45", "$79"]) expect(text).toContain(price);
    expect(new Set(text.match(/\$\d+/g))).toEqual(new Set(["$40", "$45", "$79"]));
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
  it("covers both courses in one book", () => {
    expect(text).toContain("Champions");
    expect(text).toContain("Stadium");
    expect(text).toMatch(/both courses in one book/i);
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
  it("any link that is set is a protected link", () => {
    for (const app of APP_PLAYBOOKS) {
      if (app.href !== null) expect(isProtectedPlaybookLink(app.href)).toBe(true);
    }
  });
  it("a link that is not set shows a marked placeholder", () => {
    expect(copy.APPS.placeholder("Champions")).toMatch(/^\[.*Champions.*\]$/);
  });
  it("says the Playbooks need a free sign-in", () => {
    expect(copy.APPS.body).toMatch(/free/i);
    expect(copy.APPS.body).toMatch(/sign[- ]in/i);
  });
});
