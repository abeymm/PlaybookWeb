import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/imagery/naipMosaic", () => ({
  fetchNaipTile: vi.fn(async () => new Response("tile", { status: 200 })),
}));

import { fetchNaipTile } from "@/lib/imagery/naipMosaic";
import { GET } from "../tile/[z]/[x]/[y]/route";

const call = (z: string, x: string, y: string) =>
  GET(new Request("http://localhost/api/naip/tile"), { params: Promise.resolve({ z, x, y }) });

describe("GET /api/naip/tile/{z}/{x}/{y}", () => {
  beforeEach(() => vi.mocked(fetchNaipTile).mockClear());

  it.each([
    ["10", "0", "0"],
    ["20", "0", "0"],
    ["16", String(2 ** 16), "0"],
    ["16", "abc", "0"],
    ["16", "1.5", "0"],
  ])("rejects z=%s x=%s y=%s with 400", async (z, x, y) => {
    const res = await call(z, x, y);
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("bad tile coordinates");
    expect(fetchNaipTile).not.toHaveBeenCalled();
  });

  it("proxies a valid tile through fetchNaipTile", async () => {
    const res = await call("16", "12398", "26248");
    expect(res.status).toBe(200);
    expect(fetchNaipTile).toHaveBeenCalledTimes(1);
    expect(fetchNaipTile).toHaveBeenCalledWith({ z: 16, x: 12398, y: 26248 });
  });
});
