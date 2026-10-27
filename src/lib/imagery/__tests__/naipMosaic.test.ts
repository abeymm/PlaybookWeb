import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchNaipTile,
  getNaipMosaicId,
  invalidateNaipMosaicId,
  mosaicCacheUntil,
  mosaicIdExpiryMs,
  registerNaipMosaic,
  resetNaipMosaicState,
  MOSAIC_EXPIRY_MARGIN_MS,
  MOSAIC_FALLBACK_TTL_MS,
  MOSAIC_REREGISTER_MIN_MS,
} from "../naipMosaic";

const ok = (searchid: string) => new Response(JSON.stringify({ searchid }), { status: 200 });

describe("naipMosaic", () => {
  beforeEach(() => resetNaipMosaicState());

  it("parses the expiry from a pc1 id, null otherwise", () => {
    expect(mosaicIdExpiryMs("pc1.1793154259.abc")).toBe(1793154259000);
    expect(mosaicIdExpiryMs("295b22a1cc2df6b2aca068c5b4eceb04")).toBeNull();
  });

  it("caches until shortly before expiry, or a fallback TTL for legacy ids", () => {
    const now = 1_793_150_000_000; // within the 12 h cap of the id's expiry
    expect(mosaicCacheUntil("pc1.1793154259.abc", now)).toBe(1793154259000 - MOSAIC_EXPIRY_MARGIN_MS);
    expect(mosaicCacheUntil("legacy", now)).toBe(now + MOSAIC_FALLBACK_TTL_MS);
  });

  it("registers the NAIP search with a POST and reads searchid", async () => {
    const f = vi.fn().mockResolvedValue(ok("pc1.1793154259.abc"));
    expect(await registerNaipMosaic(f as unknown as typeof fetch)).toBe("pc1.1793154259.abc");
    const [url, init] = f.mock.calls[0];
    expect(url).toContain("/mosaic/register");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body).collections).toEqual(["naip"]);
  });

  it("throws on HTTP error or missing id", async () => {
    await expect(registerNaipMosaic((async () => new Response("x", { status: 500 })) as typeof fetch)).rejects.toThrow(/500/);
    await expect(registerNaipMosaic((async () => ok("")) as typeof fetch)).rejects.toThrow(/no searchid/);
  });

  it("reuses the cached id, shares concurrent registrations, and re-registers after expiry/invalidate", async () => {
    const now = 1_793_000_000_000;
    const f = vi.fn().mockImplementation(async () => ok("pc1.1793154259.abc"));
    const fx = f as unknown as typeof fetch;
    const [a, b] = await Promise.all([getNaipMosaicId(fx, now), getNaipMosaicId(fx, now)]);
    expect(a).toBe(b);
    await getNaipMosaicId(fx, now + 1000);
    expect(f).toHaveBeenCalledTimes(1);
    await getNaipMosaicId(fx, 1793154259000); // past expiry-margin
    expect(f).toHaveBeenCalledTimes(2);
    expect(invalidateNaipMosaicId(now)).toBe(true);
    await getNaipMosaicId(fx, now);
    expect(f).toHaveBeenCalledTimes(3);
  });
});

describe("fetchNaipTile", () => {
  beforeEach(() => resetNaipMosaicState());

  const now = 1_793_000_000_000;
  const coords = { z: 16, x: 12398, y: 26248 };
  type Tile = () => Response;

  /** Fake fetch: register POSTs answer a live id; tile GETs answer the next queued response. */
  function fakeFetch(tiles: Tile[]) {
    const queue = [...tiles];
    const f = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/mosaic/register")) return ok("pc1.1793154259.abc");
      const next = queue.shift();
      if (!next) throw new Error("no tile response queued");
      return next();
    });
    const registers = () => f.mock.calls.filter(([u]) => String(u).includes("/mosaic/register")).length;
    const tileCalls = () => f.mock.calls.filter(([u]) => !String(u).includes("/mosaic/register"));
    return { fx: f as unknown as typeof fetch, registers, tileCalls };
  }
  const jpeg = () => new Response("JPEGDATA", { status: 200, headers: { "content-type": "image/jpeg" } });
  const unknownId = () => new Response(JSON.stringify({ error: "Unknown search ID." }), { status: 404 });

  it("passes a 200 image through with the public cache header", async () => {
    const { fx, tileCalls } = fakeFetch([jpeg]);
    const res = await fetchNaipTile(coords, fx, now);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(res.headers.get("cache-control")).toBe("public, max-age=86400");
    expect(await res.text()).toBe("JPEGDATA");
    expect(String(tileCalls()[0][0])).toContain("/tiles/WebMercatorQuad/16/12398/26248@1x");
  });

  it("passes a 204 through with the public cache header", async () => {
    const { fx } = fakeFetch([() => new Response(null, { status: 204 })]);
    const res = await fetchNaipTile(coords, fx, now);
    expect(res.status).toBe(204);
    expect(res.headers.get("cache-control")).toBe("public, max-age=86400");
  });

  it("re-registers once on an Unknown search ID 404 and retries", async () => {
    const { fx, registers, tileCalls } = fakeFetch([unknownId, jpeg]);
    const res = await fetchNaipTile(coords, fx, now);
    expect(res.status).toBe(200);
    expect(registers()).toBe(2);
    expect(tileCalls()).toHaveLength(2);
  });

  it("does not re-register on another 404 and answers a plain 502", async () => {
    const { fx, registers } = fakeFetch([() => new Response("No assets found", { status: 404 })]);
    const res = await fetchNaipTile(coords, fx, now);
    expect(res.status).toBe(502);
    expect(await res.text()).toBe("NAIP tile upstream error");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(registers()).toBe(1);
  });

  it("throttles re-registration to once per MOSAIC_REREGISTER_MIN_MS", async () => {
    const { fx, registers } = fakeFetch([unknownId, jpeg, unknownId, unknownId, jpeg]);
    expect((await fetchNaipTile(coords, fx, now)).status).toBe(200);
    expect(registers()).toBe(2);
    const throttled = await fetchNaipTile(coords, fx, now + 30_000);
    expect(throttled.status).toBe(502);
    expect(registers()).toBe(2);
    expect(MOSAIC_REREGISTER_MIN_MS).toBe(60_000);
    expect((await fetchNaipTile(coords, fx, now + 60_000)).status).toBe(200);
    expect(registers()).toBe(3);
  });

  it("never echoes upstream text and rejects non-image 200s", async () => {
    const a = fakeFetch([() => new Response("secret upstream text", { status: 500 })]);
    const r1 = await fetchNaipTile(coords, a.fx, now);
    expect(r1.status).toBe(502);
    expect(await r1.text()).not.toContain("secret upstream text");
    resetNaipMosaicState();
    const b = fakeFetch([() => new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } })]);
    const r2 = await fetchNaipTile(coords, b.fx, now);
    expect(r2.status).toBe(502);
    expect(await r2.text()).toBe("NAIP tile upstream error");
  });

  it("answers a plain 502 when fetch throws", async () => {
    const f = vi.fn().mockRejectedValue(new Error("boom"));
    const res = await fetchNaipTile(coords, f as unknown as typeof fetch, now);
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("boom");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
