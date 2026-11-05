// naipProtocol — MapLibre custom protocol `naip://{z}/{x}/{y}` serving datum-corrected NAIP tiles (D24).
//
// The PC mosaic is null-datum NAD83(2011), ~0.8-1.3 m off true WGS84 (see naipDatumShift.ts). For zoom >= 16 and
// inside the shift table's CONUS coverage this loader fetches the tile (plus the neighbours its shift exposes),
// redraws them on a 256x256 canvas offset by the interpolated shift, and returns the re-encoded image. Everywhere
// else it returns the plain PC tile bytes untouched.
//
// Error contract (unchanged from the raster source this replaces): if the MAIN tile cannot be fetched (404, 5xx,
// network, abort) the loader rejects, so MapLibre emits the same `error` event with sourceId "naip" that
// SeedMap/CourseMap already count to trigger the OSM fallback. A 204 (below z11, which maps never request) is a
// successful empty body exactly as before. Missing/undecodable NEIGHBOUR tiles are never errors: that part of
// the edge keeps whatever the main tile provides.

import { NAIP_TILES } from "./naipTiles";
import { NAIP_SHIFT_MINZOOM, type ShiftedTilePart } from "./naipDatumShift";

export const NAIP_PROTOCOL = "naip";

const TILE_SIZE = 256;
const JPEG_QUALITY = 0.95;

export interface ComposeTile {
  /** Encoded image bytes, or null when this (neighbour) tile could not be fetched. */
  bytes: ArrayBuffer | null;
  offsetX: number;
  offsetY: number;
}

type ShiftModule = typeof import("./naipDatumShift");

export interface NaipLoaderDeps {
  fetchBytes: (url: string, signal: AbortSignal) => Promise<ArrayBuffer>;
  compose: (tiles: ComposeTile[]) => Promise<ArrayBuffer>;
  loadShiftModule: () => Promise<ShiftModule>;
}

export interface NaipTileResponse {
  data: ArrayBuffer;
}

export type NaipTileLoader = (params: { url: string }, abortController: AbortController) => Promise<NaipTileResponse>;

/** Parse `naip://{z}/{x}/{y}`. */
export function parseNaipProtocolUrl(url: string): { z: number; x: number; y: number } {
  const m = /^naip:\/\/(\d+)\/(\d+)\/(\d+)$/.exec(url);
  if (!m) throw new Error(`Invalid NAIP tile URL: ${url}`);
  return { z: Number(m[1]), x: Number(m[2]), y: Number(m[3]) };
}

function pcTileUrl(z: number, x: number, y: number): string {
  return NAIP_TILES.replace("{z}", `${z}`).replace("{x}", `${x}`).replace("{y}", `${y}`);
}

/** fetch → bytes; non-2xx rejects (like a failing raster tile did). */
export async function defaultFetchBytes(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`NAIP tile request failed: ${res.status} ${url}`);
  return res.arrayBuffer();
}

async function decode(bytes: ArrayBuffer): Promise<ImageBitmap> {
  return createImageBitmap(new Blob([bytes]));
}

/** Draw the parts onto a 256x256 canvas and return JPEG bytes. The first part is the main tile: its decode errors
 *  propagate; a neighbour that fails to decode is skipped. */
export async function defaultCompose(tiles: ComposeTile[]): Promise<ArrayBuffer> {
  const useOffscreen = typeof OffscreenCanvas !== "undefined";
  const canvas = useOffscreen ? new OffscreenCanvas(TILE_SIZE, TILE_SIZE) : document.createElement("canvas");
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new Error("NAIP tile compose: no 2d canvas context");

  // Decode first (the main tile's failure propagates; a neighbour that cannot be decoded is dropped).
  const drawn: { bmp: ImageBitmap; offsetX: number; offsetY: number }[] = [];
  for (let i = 0; i < tiles.length; i += 1) {
    const t = tiles[i];
    if (!t.bytes) continue;
    try {
      drawn.push({ bmp: await decode(t.bytes), offsetX: t.offsetX, offsetY: t.offsetY });
    } catch (err) {
      if (i === 0) throw err;
    }
  }

  // Two passes: fractional tile offsets leave partially transparent pixels along tile seams (each side only
  // part-covers the seam pixel), which would show as a dark hairline. Pass 1 lays the tiles at whole-pixel offsets
  // (consistent across tiles, so no seam) as an opaque underlay; pass 2 draws the exact sub-pixel placement on top,
  // so the seam pixels are 79%+ exact and the rest differs from exact by < 0.5 px.
  for (const d of drawn) ctx.drawImage(d.bmp, Math.round(d.offsetX), Math.round(d.offsetY));
  for (const d of drawn) ctx.drawImage(d.bmp, d.offsetX, d.offsetY);
  for (const d of drawn) d.bmp.close();

  if (canvas instanceof OffscreenCanvas) {
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY });
    return blob.arrayBuffer();
  }
  const htmlCanvas = canvas as HTMLCanvasElement;
  const blob = await new Promise<Blob | null>((resolve) => htmlCanvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new Error("NAIP tile compose: canvas encode failed");
  return blob.arrayBuffer();
}

const defaultDeps: NaipLoaderDeps = {
  fetchBytes: defaultFetchBytes,
  compose: defaultCompose,
  loadShiftModule: () => import("./naipDatumShift"),
};

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException("NAIP tile request aborted", "AbortError");
}

/** Build the protocol handler over injectable deps (the real ones are the defaults). */
export function createNaipTileLoader(deps: NaipLoaderDeps = defaultDeps): NaipTileLoader {
  let loggedOutside = false;

  return async (params, abortController) => {
    const { z, x, y } = parseNaipProtocolUrl(params.url);
    const signal = abortController.signal;
    const plain = async (): Promise<NaipTileResponse> => ({ data: await deps.fetchBytes(pcTileUrl(z, x, y), signal) });

    if (z < NAIP_SHIFT_MINZOOM) return plain();

    const mod = await deps.loadShiftModule();
    const centre = mod.tileCenterLatLng(z, x, y);
    const shift = mod.naipDatumShift(centre.lat, centre.lng);
    if (!shift) {
      if (!loggedOutside) {
        loggedOutside = true;
        console.info("NAIP datum correction: tile outside CONUS shift table; serving uncorrected imagery");
      }
      return plain();
    }

    const parts: ShiftedTilePart[] = mod.planShiftedTile(z, x, y, shift);
    const [main, ...neighbours] = parts;
    if (neighbours.length === 0 && main.offsetX === 0 && main.offsetY === 0) return plain();

    // Neighbours are best-effort (a rejection becomes null); the main tile decides success.
    const neighbourFetches = neighbours.map((p) =>
      deps.fetchBytes(pcTileUrl(p.z, p.x, p.y), signal).catch(() => null),
    );
    const mainBytes = await deps.fetchBytes(pcTileUrl(main.z, main.x, main.y), signal);
    const neighbourBytes = await Promise.all(neighbourFetches);
    throwIfAborted(signal);

    const tiles: ComposeTile[] = [
      { bytes: mainBytes, offsetX: main.offsetX, offsetY: main.offsetY },
      ...neighbours.map((p, i) => ({ bytes: neighbourBytes[i], offsetX: p.offsetX, offsetY: p.offsetY })),
    ];
    return { data: await deps.compose(tiles) };
  };
}

interface ProtocolHost {
  addProtocol: (scheme: string, loader: NaipTileLoader) => void;
}

let registered = false;

/** Register `naip://` on the given maplibre-gl module, once per page. Call before constructing a Map. */
export function registerNaipProtocol(maplibre: ProtocolHost): void {
  if (registered) return;
  registered = true;
  maplibre.addProtocol(NAIP_PROTOCOL, createNaipTileLoader());
}

/** Test seam: forget that the protocol was registered. */
export function resetNaipProtocolForTests(): void {
  registered = false;
}
