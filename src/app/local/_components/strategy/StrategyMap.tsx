"use client";

// StrategyMap — NAIP map for one hole's plan: course polygons + centerline (same class paint as the
// course editor's CourseMap), the shot chain as a line, and DOM-element markers: tee origin and green
// (locked) plus a draggable marker per tee/layup/approach target (SeedMap's marker pattern). Dragging
// reports on dragend only; the parent rechains and the markers are rebuilt from props.
// Map-DOM behaviour is browser-only and not unit tested.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MLMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CLASS_STYLES, CENTERLINE_PRIMARY } from "@/lib/coursedata/colors";
import { ACTIVE_CLASSES } from "@/lib/coursedata/featureTags";
import { bboxOfLngLats, type Bbox } from "@/lib/coursedata/geo";
import { NAIP_ATTRIBUTION, NAIP_MAXZOOM, NAIP_MINZOOM, NAIP_TILES } from "@/lib/imagery/naipTiles";
import { chainLine, greenPoint, hasTarget, isMovable, mapFitKey, needsFit, type ArchiveNote, type LatLng } from "@/lib/localflow/strategy";

const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const VISIBLE = ACTIVE_CLASSES.filter((c) => c !== "rough");
const TYPE_COLOR: Record<string, string> = { tee: "#38bdf8", layup: "#fbbf24", approach: "#fb7185", green: "#22c55e" };
const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

export interface StrategyMapProps {
  hole: number;
  polygonFC: GeoJSON.FeatureCollection;
  centerlineFC: GeoJSON.FeatureCollection;
  bbox: Bbox | null;
  /** The hole's notes in chain order, already rechained. */
  chain: ArchiveNote[];
  onTargetDrag: (noteId: string, to: LatLng) => void;
}

function classExpr(prop: "fill" | "stroke"): unknown {
  const stops: unknown[] = ["match", ["get", "cls"]];
  for (const c of ACTIVE_CLASSES) stops.push(c, CLASS_STYLES[c][prop]);
  stops.push("#888888");
  return stops;
}

function glyph(label: string, color: string, shape: "circle" | "square" | "flag", locked: boolean): HTMLElement {
  const el = document.createElement("div");
  el.textContent = label;
  el.title = locked ? "locked" : "drag to move";
  el.style.cssText = [
    "width:22px;height:22px;display:flex;align-items:center;justify-content:center;font:600 11px sans-serif",
    `background:${color};color:#0b0b0b;border:2px solid #fff;box-shadow:0 0 3px #000`,
    `border-radius:${shape === "circle" ? "50%" : shape === "flag" ? "3px 11px 11px 3px" : "3px"}`,
    `cursor:${locked ? "default" : "grab"};opacity:${locked ? 0.85 : 1}`,
  ].join(";");
  return el;
}

interface SyncRefs {
  props: { current: StrategyMapProps };
  mod: { current: typeof import("maplibre-gl") | null };
  markers: { current: Marker[] };
  fitKey: { current: string };
}

function sync(map: MLMap, r: SyncRefs) {
const p = r.props.current;
  const setData = (id: string, data: GeoJSON.FeatureCollection) => (map.getSource(id) as { setData?: (d: unknown) => void } | undefined)?.setData?.(data);
  setData("course", p.polygonFC);
  setData("centerline", p.centerlineFC);
  const line = chainLine(p.chain).map((q) => [q.lng, q.lat]);
  setData("shots", { type: "FeatureCollection", features: line.length > 1 ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: line } }] : [] });

  r.markers.current.forEach((m) => m.remove());
  r.markers.current = [];
  const mod = r.mod.current;
  if (!mod) return;
  const add = (el: HTMLElement, at: LatLng, draggable: boolean, onEnd?: (to: LatLng) => void) => {
    const m = new mod.Marker({ element: el, draggable }).setLngLat([at.lng, at.lat]).addTo(map);
    if (onEnd) m.on("dragend", () => { const ll = m.getLngLat(); onEnd({ lat: ll.lat, lng: ll.lng }); });
    r.markers.current.push(m);
  };
  const tee = p.chain.find((n) => n.shotType === "tee");
  if (tee) add(glyph("T", TYPE_COLOR.tee, "square", true), { lat: tee.shotLat, lng: tee.shotLng }, false);
  p.chain.filter((n) => isMovable(n) && hasTarget(n)).forEach((n, i) => {
    add(glyph(String(i + 1), TYPE_COLOR[n.shotType], "circle", false), { lat: n.targetLat, lng: n.targetLng }, true, (to) => r.props.current.onTargetDrag(n.id, to));
  });
  const g = greenPoint(p.chain);
  if (g) add(glyph("G", TYPE_COLOR.green, "flag", true), g, false);

  // Fit when the hole (or its bbox) changes, never on a drag.
  const fit: Bbox | null = p.bbox ?? (line.length ? bboxOfLngLats(line) : null);
  const key = mapFitKey(p.hole, p.bbox, line.length > 0);
  if (fit && needsFit(r.fitKey.current, key)) {
    const jump = r.fitKey.current.split(":")[0] === key.split(":")[0] || r.fitKey.current === "";   // first fit, or the same hole's bbox arriving
    r.fitKey.current = key;
    map.resize();   // the grid column may have been 0-sized at init
    // Jump fits (first / same hole) (no animation): an eased camera never finishes while the page is throttled/backgrounded.
    map.fitBounds(fit, { padding: 60, duration: jump ? 0 : 400, maxZoom: 19 });
  }
}

export default function StrategyMap(props: StrategyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const modRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const readyRef = useRef(false);
  const fitKeyRef = useRef("");
  const propsRef = useRef(props);
  propsRef.current = props;
  const geomKey = props.chain.map((n) => `${n.id}:${n.shotType}:${n.shotLat},${n.shotLng},${n.targetLat},${n.targetLng}`).join("|");
  const refs = useMemo<SyncRefs>(() => ({ props: propsRef, mod: modRef, markers: markersRef, fitKey: fitKeyRef }), []);
  const [naipFailed, setNaipFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      modRef.current = maplibregl;
      if (cancelled || !containerRef.current) return;
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            naip: { type: "raster", tiles: [NAIP_TILES], tileSize: 256, minzoom: NAIP_MINZOOM, maxzoom: NAIP_MAXZOOM, attribution: NAIP_ATTRIBUTION },
            osm: { type: "raster", tiles: [OSM_TILES], tileSize: 256, attribution: "© OpenStreetMap contributors" },
          },
          layers: [
            { id: "osm", type: "raster", source: "osm", maxzoom: NAIP_MINZOOM },
            { id: "naip", type: "raster", source: "naip" },
          ],
        },
        center: [-98, 39],
        zoom: 3,
      });
      mapRef.current = map;
      map.on("error", (e: unknown) => {
        if ((e as { sourceId?: string })?.sourceId !== "naip") return;
        map.setLayoutProperty("naip", "visibility", "none");
        map.setLayerZoomRange("osm", 0, 24);
        setNaipFailed(true);
      });
      // Init on style.load, not "load": "load" waits for the first tiles and can stall, which left the first
      // paint unfitted and empty. Whichever fires first runs it once; sync then fits hole 1 and draws its layers.
      const init = () => {
        if (cancelled || readyRef.current) return;
        for (const id of ["course", "centerline", "shots"]) map.addSource(id, { type: "geojson", data: EMPTY });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.addLayer({ id: "course-fill", type: "fill", source: "course", filter: ["in", ["get", "cls"], ["literal", VISIBLE]] as any, paint: { "fill-color": classExpr("fill") as any, "fill-opacity": 0.35 } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.addLayer({ id: "course-line", type: "line", source: "course", filter: ["in", ["get", "cls"], ["literal", VISIBLE]] as any, paint: { "line-color": classExpr("stroke") as any, "line-width": 1.2 } });
        map.addLayer({ id: "centerline", type: "line", source: "centerline", paint: { "line-color": CENTERLINE_PRIMARY, "line-width": 2, "line-dasharray": [2, 2], "line-opacity": 0.7 }, filter: ["==", ["get", "kind"], "primary"] });
        map.addLayer({ id: "shots", type: "line", source: "shots", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffffff", "line-width": 3 } });
        readyRef.current = true;
        sync(map, refs);
      };
      map.on("style.load", init);
      map.on("load", init);
      if (map.isStyleLoaded()) init();
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
      readyRef.current = false;
    };
  }, [refs]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && readyRef.current) sync(map, refs);
    // geomKey, not chain: a text edit makes a new chain array but must not rebuild the markers.
  }, [refs, geomKey, props.polygonFC, props.centerlineFC, props.bbox, props.hole]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full bg-black" />
      {naipFailed && <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-amber-950/80 px-2 py-1 text-xs text-amber-200">NAIP unavailable — showing OSM streets</div>}
    </div>
  );
}
