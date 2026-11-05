import { parseNaipTileCoords } from "@/lib/imagery/naipTiles";
import { fetchNaipTile } from "@/lib/imagery/naipMosaic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/naip/tile/{z}/{x}/{y} → the PC NAIP tile (JPEG), using a self-refreshing mosaic id
 *  (PC ids expire ~24 h after registration; validation, throttled re-registration and filtering in lib/imagery/naipMosaic.ts). */
export async function GET(_req: Request, ctx: { params: Promise<{ z: string; x: string; y: string }> }) {
  const { z, x, y } = await ctx.params;
  const coords = parseNaipTileCoords(z, x, y);
  if (!coords) return new Response("bad tile coordinates", { status: 400 });
  return fetchNaipTile(coords);
}
