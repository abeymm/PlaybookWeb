"use client";

// SeedMap — MapLibre NAIP canvas for hand-clicking a course seed.
//
// Basemap: same USGS NAIP ImageServer tiles as the course editor (polygons are NAIP-true) with an
// OSM raster fallback that auto-engages on a NAIP tile error (+ a banner).
//
// CAPTURE: a single map click places the next point of the ACTIVE hole (first click = tee). A fast
// second click at the same spot finishes the hole (last click = green) WITHOUT adding a duplicate
// point — this is detected manually (maplibre's native dblclick is disabled) so every ordinary
// click places its point immediately, with no debounce latency across a 36+ click flow.
//
// Points render as draggable DOM markers (tee=blue, waypoint=orange, green=green) connected by a
// per-hole centerline; inactive holes are dimmed. Clicking a marker opens a small delete popover.
//
// NOTE: pointer/drag behaviour is browser-only and deferred from unit tests (per the test plan);
// the wiring is defensive so a maplibre hiccup degrades rather than crashes.

import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CLASS_STYLES, CENTERLINE_PRIMARY } from "@/lib/coursedata/colors";
import { coordsToRing, bboxOfLngLats, type Bbox, type LngLat } from "@/lib/coursedata/geo";
import type { Coordinate } from "@/lib/coursedata/types";
import type { SeedHole } from "@/lib/coursedata/seed";

const NAIP_TILES =
  "https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer/tile/{z}/{y}/{x}";
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** The maplibre-gl module namespace (constructors live here — .Map/.Marker/.Popup). */
type MapLibreGL = typeof import("maplibre-gl");

/** An imperative map command (fly to a point, or fit a bbox); nonce forces re-application. */
export interface MapFocus {
  nonce: number;
  fly?: Coordinate;
  bbox?: Bbox;
}

export interface SeedMapProps {
  holes: SeedHole[];
  activeIdx: number;
  focus: MapFocus | null;
  onMapClick: (coord: Coordinate) => void;
  onFinishHole: () => void;
  onPointDrag: (holeIndex: number, pointIndex: number, coord: Coordinate) => void;
  onPointDelete: (holeIndex: number, pointIndex: number) => void;
}

function roleOf(hole: SeedHole, i: number): "tee" | "green" | "waypoint" {
  if (i === 0) return "tee";
  if (i === hole.points.length - 1 && hole.points.length >= 2) return "green";
  return "waypoint";
}

const ROLE_COLOR: Record<"tee" | "green" | "waypoint", string> = {
  tee: CLASS_STYLES.tee.fill,
  green: CLASS_STYLES.green.fill,
  waypoint: CENTERLINE_PRIMARY,
};

export default function SeedMap(props: SeedMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const readyRef = useRef(false);
  const markersRef = useRef<Marker[]>([]);
  const popupRef = useRef<Popup | null>(null);
  const lastClickRef = useRef<{ t: number; x: number; y: number }>({ t: 0, x: 0, y: 0 });
  const [naipFailed, setNaipFailed] = useState(false);
  const propsRef = useRef(props);
  propsRef.current = props;

  // -- init map once --
  useEffect(() => {
    let cancelled = false;
    let mod: MapLibreGL;
    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      mod = maplibregl;
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            naip: { type: "raster", tiles: [NAIP_TILES], tileSize: 256, attribution: "USGS NAIP" },
            osm: {
              type: "raster",
              tiles: [OSM_TILES],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            { id: "naip", type: "raster", source: "naip", layout: { visibility: "visible" } },
            { id: "osm", type: "raster", source: "osm", layout: { visibility: "none" } },
          ],
        },
        center: [-98, 39],
        zoom: 3,
      });
      mapRef.current = map;
      map.doubleClickZoom.disable(); // we own double-click (= finish hole)

      map.on("error", (e: unknown) => {
        const err = e as { sourceId?: string };
        if (err?.sourceId === "naip") {
          map.setLayoutProperty("naip", "visibility", "none");
          map.setLayoutProperty("osm", "visibility", "visible");
          setNaipFailed(true);
        }
      });

      map.on("load", () => {
        if (cancelled) return;
        const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
        map.addSource("centerlines", { type: "geojson", data: empty });
        map.addLayer({
          id: "centerlines",
          type: "line",
          source: "centerlines",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": CENTERLINE_PRIMARY,
            "line-width": ["case", ["get", "active"], 3, 1.5],
            "line-opacity": ["case", ["get", "active"], 0.95, 0.4],
          },
        });
        readyRef.current = true;

        map.on("click", (e) => {
          const now = Date.now();
          const prev = lastClickRef.current;
          const near = Math.abs(e.point.x - prev.x) < 8 && Math.abs(e.point.y - prev.y) < 8;
          if (now - prev.t < 300 && near) {
            // Second click of a double at the same spot → finish (green already placed by click #1).
            lastClickRef.current = { t: 0, x: 0, y: 0 };
            propsRef.current.onFinishHole();
            return;
          }
          lastClickRef.current = { t: now, x: e.point.x, y: e.point.y };
          propsRef.current.onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        });

        syncMarkers(map, mod, propsRef.current, markersRef, popupRef);
        syncLines(map, propsRef.current);
        fitInitial(map, propsRef.current.holes);
      });
    })();
    return () => {
      cancelled = true;
      // map.remove() tears down the map container; its marker/popup DOM children go with it.
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
      popupRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // -- markers + lines follow holes/active --
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    (async () => {
      const mod = (await import("maplibre-gl")).default;
      syncMarkers(map, mod, props, markersRef, popupRef);
      syncLines(map, props);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.holes, props.activeIdx]);

  // -- imperative focus (go-to / rail selection) --
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !props.focus) return;
    if (props.focus.fly) {
      map.flyTo({ center: [props.focus.fly.lng, props.focus.fly.lat], zoom: 16, duration: 800 });
    } else if (props.focus.bbox) {
      map.fitBounds(props.focus.bbox, { padding: 80, maxZoom: 18, duration: 600 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.focus?.nonce]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full bg-black" />
      {naipFailed && (
        <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-amber-950/80 px-2 py-1 text-xs text-amber-200">
          NAIP imagery unavailable — showing OpenStreetMap.
        </div>
      )}
    </div>
  );
}

// --- imperative helpers ---

function syncLines(map: MLMap, p: SeedMapProps) {
  const features: GeoJSON.Feature[] = p.holes
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => h.points.length >= 2)
    .map(({ h, i }) => ({
      type: "Feature" as const,
      properties: { active: i === p.activeIdx },
      geometry: { type: "LineString" as const, coordinates: coordsToRing(h.points) },
    }));
  const src = map.getSource("centerlines") as { setData?: (d: unknown) => void } | undefined;
  src?.setData?.({ type: "FeatureCollection", features });
}

function syncMarkers(
  map: MLMap,
  maplibregl: MapLibreGL,
  p: SeedMapProps,
  markersRef: React.MutableRefObject<Marker[]>,
  popupRef: React.MutableRefObject<Popup | null>
) {
  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];
  popupRef.current?.remove();

  p.holes.forEach((hole, hi) => {
    const active = hi === p.activeIdx;
    hole.points.forEach((pt, pi) => {
      const role = roleOf(hole, pi);
      const el = document.createElement("div");
      el.style.cssText = [
        "width:16px",
        "height:16px",
        "border-radius:50%",
        "border:2px solid #ffffff",
        "box-shadow:0 0 0 1px rgba(0,0,0,0.5)",
        `background:${ROLE_COLOR[role]}`,
        `opacity:${active ? "1" : "0.45"}`,
        "cursor:grab",
      ].join(";");
      el.title = `Hole ${hole.holeNumber} · ${role}`;

      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([pt.lng, pt.lat])
        .addTo(map);

      marker.on("dragend", () => {
        const ll = marker.getLngLat();
        propsDrag(p, hi, pi, { lat: ll.lat, lng: ll.lng });
      });

      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        popupRef.current?.remove();
        const btn = document.createElement("button");
        btn.textContent = `Delete ${role}`;
        btn.style.cssText =
          "font-size:12px;color:#dc2626;text-decoration:underline;cursor:pointer;background:none;border:none;padding:2px 4px";
        btn.addEventListener("click", () => {
          popupRef.current?.remove();
          p.onPointDelete(hi, pi);
        });
        const popup = new maplibregl.Popup({ closeButton: false, offset: 14 })
          .setLngLat([pt.lng, pt.lat])
          .setDOMContent(btn)
          .addTo(map);
        popupRef.current = popup;
      });

      markersRef.current.push(marker);
    });
  });
}

// Small indirection so the drag closure reads the current callback.
function propsDrag(p: SeedMapProps, hi: number, pi: number, coord: Coordinate) {
  p.onPointDrag(hi, pi, coord);
}

function fitInitial(map: MLMap, holes: SeedHole[]) {
  const all: LngLat[] = holes.flatMap((h) => coordsToRing(h.points));
  const bbox = bboxOfLngLats(all);
  if (bbox) map.fitBounds(bbox, { padding: 80, maxZoom: 18, duration: 0 });
}
