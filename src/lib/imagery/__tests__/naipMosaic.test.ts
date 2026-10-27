import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getNaipMosaicId,
  invalidateNaipMosaicId,
  mosaicCacheUntil,
  mosaicIdExpiryMs,
  registerNaipMosaic,
  MOSAIC_EXPIRY_MARGIN_MS,
  MOSAIC_FALLBACK_TTL_MS,
} from "../naipMosaic";

const ok = (searchid: string) => new Response(JSON.stringify({ searchid }), { status: 200 });

describe("naipMosaic", () => {
  beforeEach(() => invalidateNaipMosaicId());

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
    invalidateNaipMosaicId();
    await getNaipMosaicId(fx, now);
    expect(f).toHaveBeenCalledTimes(3);
  });
});
