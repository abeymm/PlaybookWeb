// Single-source rule (owner, 2026-10-04): NAIP is the ONLY imagery source for course maps. This guard fails if any
// source file under src/ carries a non-NAIP imagery/elevation tile URL. OSM *street* tiles are allowed (not imagery).
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const FORBIDDEN: RegExp[] = [
  /arcgisonline\.com/i,
  /World_Imagery/i,
  /wayback/i,
  /elevation-tiles-prod/i,
  /terrarium/i,
  /api\.mapbox\.com/i,
  /mapbox:\/\/styles/i,
  /virtualearth\.net/i,
  /google\.com\/vt/i,
  /mt[0-3]\.google\.com/i,
  /khms\d*\.google/i,
  /maptiler\.com/i,
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs|css|html)$/.test(name) && !p.endsWith("singleSource.test.ts")) out.push(p);
  }
  return out;
}

describe("single imagery source (NAIP only)", () => {
  it("no non-NAIP imagery or terrain tile URLs in src/", () => {
    const root = path.resolve(__dirname, "..", "..", "..");
    const hits: string[] = [];
    for (const f of walk(root)) {
      const text = readFileSync(f, "utf8");
      for (const re of FORBIDDEN) if (re.test(text)) hits.push(`${path.relative(root, f)}: ${re}`);
    }
    expect(hits).toEqual([]);
  });
});
