import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NAIP_PROTOCOL,
  createNaipTileLoader,
  defaultFetchBytes,
  parseNaipProtocolUrl,
  registerNaipProtocol,
  resetNaipProtocolForTests,
  type ComposeTile,
  type NaipLoaderDeps,
} from "../naipProtocol";
import { NAIP_TILES } from "../naipTiles";
import * as shiftModule from "../naipDatumShift";

// Harding Park tile at z18 (shift ~ +2.5 px east, -1.2 px north).
function tileOf(lat: number, lng: number, z: number): { z: number; x: number; y: number } {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const r = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  return { z, x, y };
}
const H = tileOf(37.7244, -122.4936, 18);

function bytes(tag: number): ArrayBuffer {
  return new Uint8Array([tag, tag, tag]).buffer;
}

function makeDeps(over: Partial<NaipLoaderDeps> = {}): NaipLoaderDeps & {
  fetchBytes: ReturnType<typeof vi.fn>;
  compose: ReturnType<typeof vi.fn>;
  loadShiftModule: ReturnType<typeof vi.fn>;
} {
  return {
    fetchBytes: vi.fn(async (url: string) => bytes(url.length % 250)),
    compose: vi.fn(async () => bytes(99)),
    loadShiftModule: vi.fn(async () => shiftModule),
    ...over,
  } as never;
}

const run = (loader: ReturnType<typeof createNaipTileLoader>, url: string, ac = new AbortController()) =>
  loader({ url }, ac);

describe("parseNaipProtocolUrl", () => {
  it("parses naip://z/x/y", () => {
    expect(parseNaipProtocolUrl("naip://18/41/99")).toEqual({ z: 18, x: 41, y: 99 });
  });
  it("rejects malformed urls", () => {
    expect(() => parseNaipProtocolUrl("naip://a/b/c")).toThrow();
    expect(() => parseNaipProtocolUrl("https://x/1/2/3")).toThrow();
  });
});

describe("createNaipTileLoader", () => {
  let info: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    info = vi.spyOn(console, "info").mockImplementation(() => {});
  });
  afterEach(() => info.mockRestore());

  it("below z16 passes the plain PC tile bytes through, without loading the shift table or composing", async () => {
    const deps = makeDeps({ fetchBytes: vi.fn(async () => bytes(5)) });
    const loader = createNaipTileLoader(deps);
    const t = tileOf(37.7244, -122.4936, 14);
    const out = await run(loader, `naip://${t.z}/${t.x}/${t.y}`);
    expect(deps.fetchBytes).toHaveBeenCalledTimes(1);
    expect(deps.fetchBytes.mock.calls[0][0]).toBe(
      NAIP_TILES.replace("{z}", `${t.z}`).replace("{x}", `${t.x}`).replace("{y}", `${t.y}`),
    );
    expect(deps.loadShiftModule).not.toHaveBeenCalled();
    expect(deps.compose).not.toHaveBeenCalled();
    expect(new Uint8Array(out.data)).toEqual(new Uint8Array(bytes(5)));
  });

  it("at z18 in CONUS fetches the main tile + shift neighbours and composes (main tile first)", async () => {
    const deps = makeDeps();
    const loader = createNaipTileLoader(deps);
    const out = await run(loader, `naip://${H.z}/${H.x}/${H.y}`);
    expect(deps.fetchBytes).toHaveBeenCalledTimes(4);
    expect(deps.compose).toHaveBeenCalledTimes(1);
    const composed: ComposeTile[] = deps.compose.mock.calls[0][0];
    expect(composed).toHaveLength(4);
    expect(composed[0].offsetX).toBeLessThan(0); // main tile moves west
    expect(composed.every((t) => t.bytes !== null)).toBe(true);
    expect(new Uint8Array(out.data)).toEqual(new Uint8Array(bytes(99)));
  });

  it("rejects when the main tile fails, so maplibre raises its normal tile error", async () => {
    const mainUrl = NAIP_TILES.replace("{z}", `${H.z}`).replace("{x}", `${H.x}`).replace("{y}", `${H.y}`);
    const deps = makeDeps({
      fetchBytes: vi.fn(async (url: string) => {
        if (url === mainUrl) throw new Error("NAIP tile 404");
        return bytes(1);
      }),
    });
    await expect(run(createNaipTileLoader(deps), `naip://${H.z}/${H.x}/${H.y}`)).rejects.toThrow("NAIP tile 404");
    expect(deps.compose).not.toHaveBeenCalled();
  });

  it("rejects on the passthrough path too (z<16 main failure)", async () => {
    const deps = makeDeps({ fetchBytes: vi.fn(async () => Promise.reject(new Error("net down"))) });
    await expect(run(createNaipTileLoader(deps), "naip://12/655/1582")).rejects.toThrow("net down");
  });

  it("a failing neighbour is NOT an error: it is drawn as missing (null bytes)", async () => {
    const mainUrl = NAIP_TILES.replace("{z}", `${H.z}`).replace("{x}", `${H.x}`).replace("{y}", `${H.y}`);
    const deps = makeDeps({
      fetchBytes: vi.fn(async (url: string) => {
        if (url !== mainUrl) throw new Error("404");
        return bytes(7);
      }),
    });
    const out = await run(createNaipTileLoader(deps), `naip://${H.z}/${H.x}/${H.y}`);
    expect(out.data).toBeDefined();
    const composed: ComposeTile[] = deps.compose.mock.calls[0][0];
    expect(composed[0].bytes).not.toBeNull();
    expect(composed.slice(1).every((t) => t.bytes === null)).toBe(true);
  });

  it("honours an aborted signal (rejects, does not compose)", async () => {
    const ac = new AbortController();
    const deps = makeDeps({
      fetchBytes: vi.fn(async (_url: string, signal: AbortSignal) => {
        ac.abort();
        if (signal.aborted) throw new DOMException("aborted", "AbortError");
        return bytes(1);
      }),
    });
    await expect(run(createNaipTileLoader(deps), `naip://${H.z}/${H.x}/${H.y}`, ac)).rejects.toThrow();
    expect(deps.compose).not.toHaveBeenCalled();
  });

  it("an abort during neighbour fetches rejects instead of drawing a partial tile", async () => {
    const ac = new AbortController();
    const mainUrl = NAIP_TILES.replace("{z}", `${H.z}`).replace("{x}", `${H.x}`).replace("{y}", `${H.y}`);
    const deps = makeDeps({
      fetchBytes: vi.fn(async (url: string) => {
        if (url === mainUrl) return bytes(1);
        ac.abort();
        throw new Error("neighbour failed");
      }),
    });
    await expect(run(createNaipTileLoader(deps), `naip://${H.z}/${H.x}/${H.y}`, ac)).rejects.toThrow();
  });

  it("outside CONUS passes through and logs console.info once", async () => {
    const deps = makeDeps();
    const loader = createNaipTileLoader(deps);
    const london = tileOf(51.5, -0.12, 18);
    await run(loader, `naip://18/${london.x}/${london.y}`);
    await run(loader, `naip://18/${london.x + 1}/${london.y}`);
    expect(deps.compose).not.toHaveBeenCalled();
    expect(deps.fetchBytes).toHaveBeenCalledTimes(2);
    expect(info).toHaveBeenCalledTimes(1);
  });

  it("throws on a URL it cannot parse", async () => {
    await expect(run(createNaipTileLoader(makeDeps()), "naip://nope")).rejects.toThrow();
  });
});

describe("defaultFetchBytes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects non-OK responses with the status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 404 })));
    await expect(defaultFetchBytes("https://x/t", new AbortController().signal)).rejects.toThrow(/404/);
  });

  it("resolves a 204 as an empty buffer (same bytes the raster path saw before)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    const buf = await defaultFetchBytes("https://x/t", new AbortController().signal);
    expect(buf.byteLength).toBe(0);
  });

  it("passes the abort signal to fetch", async () => {
    const f = vi.fn(async () => new Response(new Uint8Array([1]), { status: 200 }));
    vi.stubGlobal("fetch", f);
    const ac = new AbortController();
    await defaultFetchBytes("https://x/t", ac.signal);
    expect((f.mock.calls[0] as unknown[])[1]).toMatchObject({ signal: ac.signal });
  });
});

describe("registerNaipProtocol", () => {
  beforeEach(() => resetNaipProtocolForTests());

  it("registers the naip scheme exactly once per page", () => {
    const addProtocol = vi.fn();
    registerNaipProtocol({ addProtocol });
    registerNaipProtocol({ addProtocol });
    expect(addProtocol).toHaveBeenCalledTimes(1);
    expect(addProtocol.mock.calls[0][0]).toBe(NAIP_PROTOCOL);
    expect(typeof addProtocol.mock.calls[0][1]).toBe("function");
  });
});
