import { naipTileUrl } from "@/lib/imagery/naipTiles";
import { getNaipMosaicId, invalidateNaipMosaicId } from "@/lib/imagery/naipMosaic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INT = /^\d{1,7}$/;

async function fetchTile(z: string, x: string, y: string): Promise<Response> {
  const id = await getNaipMosaicId();
  const url = naipTileUrl(id).replace("{z}", z).replace("{x}", x).replace("{y}", y);
  return fetch(url);
}

/** GET /api/naip/tile/{z}/{x}/{y} → the PC NAIP tile (JPEG), using a self-refreshing mosaic id
 *  (PC ids expire ~24 h after registration; see lib/imagery/naipMosaic.ts). */
export async function GET(_req: Request, ctx: { params: Promise<{ z: string; x: string; y: string }> }) {
  const { z, x, y } = await ctx.params;
  if (![z, x, y].every((v) => INT.test(v))) return new Response("bad tile coordinates", { status: 400 });
  try {
    let upstream = await fetchTile(z, x, y);
    if (upstream.status === 404) {
      // Possibly an expired id (PC says "Unknown search ID"); re-register once and retry.
      invalidateNaipMosaicId();
      upstream = await fetchTile(z, x, y);
    }
    return new Response(upstream.status === 204 ? null : upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
        "cache-control": upstream.ok ? "public, max-age=86400" : "no-store",
      },
    });
  } catch (e) {
    return new Response(`NAIP tile upstream error: ${e instanceof Error ? e.message : "unknown"}`, { status: 502 });
  }
}
