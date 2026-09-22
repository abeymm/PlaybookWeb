"use client";

// CourseMap — MapLibre viewer + terra-draw editor for one hole.
//
// Basemap: USGS NAIP exportImage (the ImageServer's /tile endpoint has no CONUS-wide tile cache
// and 404s at every zoom — exportImage is what the ML pipeline fetches, so we use maplibre's
// {bbox-epsg-3857} raster-source template against it) with an Esri World Imagery raster fallback
// (Addendum item 9). Repeated NAIP tile errors at zoom >= minzoom auto-switch to Esri + a banner.
// OSM is reachable only through the manual basemap toggle. Per-class fill/line styling from
// colors.ts (dimmed over aerial basemaps so fills stay readable over imagery); primary + per-tee
// centerlines distinguishable; view-only boundary outline.
// Rendition/diff: legacy = dashed outline, mlgen = filled (viewer.html convention).
//
// EDITING (terra-draw, mlgen only): select a feature (click) then "Edit geometry" loads just that
// polygon into terra-draw select mode for vertex move/add/delete + drag; "Draw" adds a new polygon.
// Boundary is never editable (E11).
//
// NOTE: terra-draw vertex interactions are pointer-driven and need live-browser verification; the
// wiring here is defensive (try/catch, graceful fallback to view-only) so a terra-draw failure
// never crashes the page. Map-DOM behavior is deferred from unit tests per the test plan.

import { useEffect, useRef } from "react";
import type { Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CLASS_STYLES, CENTERLINE_PRIMARY, CENTERLINE_PER_TEE } from "@/lib/coursedata/colors";
import { ringToCoords, type Bbox, type LngLat } from "@/lib/coursedata/geo";
import type { Coordinate, FeatureClass } from "@/lib/coursedata/types";
import { ALL_CLASSES } from "@/lib/coursedata/featureTags";

// exportImage (not /tile — see file-header NOTE) with maplibre's {bbox-epsg-3857} raster-source
// template, mirroring what the ML pipeline fetches from the same ImageServer.
const NAIP_TILES =
  "https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer/exportImage" +
  "?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=jpg&f=image";
const NAIP_MINZOOM = 8;
const NAIP_MAXZOOM = 19;
// Consecutive NAIP failures (at usable zoom) before auto-falling back to Esri — avoids flapping on
// a single missing tile (e.g. no NAIP coverage at that spot).
const NAIP_FAIL_THRESHOLD = 2;
const ESRI_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

// Aerial basemaps are visually busier than OSM's flat cartography — dim the class fills so
// imagery stays legible underneath. Shared palette (colors.ts) is unchanged; this scales it.
const AERIAL_FILL_OPACITY = 0.35;
function fillOpacityFor(basemap: CourseMapProps["basemap"]): unknown {
  return basemap === "osm" ? classOpacityExpr() : AERIAL_FILL_OPACITY;
}

// Data-driven fill/line color: match on `cls`.
function classColorExpr(prop: "fill" | "stroke"): unknown {
  const stops: unknown[] = ["match", ["get", "cls"]];
  for (const c of ALL_CLASSES) stops.push(c, CLASS_STYLES[c][prop]);
  stops.push("#888888");
  return stops;
}
function classOpacityExpr(): unknown {
  const stops: unknown[] = ["match", ["get", "cls"]];
  for (const c of ALL_CLASSES) stops.push(c, CLASS_STYLES[c].fillOpacity);
  stops.push(0.4);
  return stops;
}

export interface CourseMapProps {
  mlgenFC: GeoJSON.FeatureCollection;
  legacyFC: GeoJSON.FeatureCollection;
  centerlineFC: GeoJSON.FeatureCollection;
  boundaryFC: GeoJSON.FeatureCollection;
  bbox: Bbox | null;
  visibleClasses: Set<FeatureClass>;
  rendition: "mlgen" | "legacy";
  diff: boolean;
  basemap: "naip" | "esri" | "osm";
  selectedFid: string | null;
  editMode: "view" | "edit" | "draw";
  drawClass: FeatureClass;
  onSelectFeature: (fid: string | null) => void;
  onGeometryChange: (fid: string, coords: Coordinate[]) => void;
  onDrawComplete: (coords: Coordinate[]) => void;
  onNaipError: () => void;
}

export default function CourseMap(props: CourseMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const readyRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawRef = useRef<any>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const naipFailRef = useRef(0);
  const prevBasemapRef = useRef(props.basemap);

  // -- init map once --
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            naip: {
              type: "raster",
              tiles: [NAIP_TILES],
              tileSize: 256,
              // exportImage has no low-zoom cache either — without this, the default
              // center/zoom=3 view before fitBounds fires a burst of guaranteed-error requests
              // that stalls maplibre's "load" event (and therefore fitBounds, gated on it) for
              // tens of seconds. minzoom stops those requests outright.
              minzoom: NAIP_MINZOOM,
              maxzoom: NAIP_MAXZOOM,
              attribution: "USGS NAIP",
            },
            esri: {
              type: "raster",
              tiles: [ESRI_TILES],
              tileSize: 256,
              attribution: "Esri World Imagery",
            },
            osm: {
              type: "raster",
              tiles: [OSM_TILES],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            { id: "naip", type: "raster", source: "naip", layout: { visibility: "visible" } },
            { id: "esri", type: "raster", source: "esri", layout: { visibility: "none" } },
            { id: "osm", type: "raster", source: "osm", layout: { visibility: "none" } },
          ],
        },
        center: [-98, 39],
        zoom: 3,
      });
      mapRef.current = map;

      map.on("error", (e: unknown) => {
        const err = e as { sourceId?: string };
        if (err?.sourceId !== "naip" || propsRef.current.basemap !== "naip") return;
        if (map.getZoom() < NAIP_MINZOOM) return;
        naipFailRef.current += 1;
        if (naipFailRef.current >= NAIP_FAIL_THRESHOLD) {
          propsRef.current.onNaipError();
        }
      });

      map.on("load", () => {
        if (cancelled) return;
        addDataLayers(map, propsRef.current.basemap);
        readyRef.current = true;
        syncAll(map, propsRef.current);

        map.on("click", "mlgen-fill", (e) => {
          const f = e.features?.[0];
          const fid = f?.properties?.fid as string | undefined;
          if (fid && propsRef.current.editMode === "view") propsRef.current.onSelectFeature(fid);
        });
        map.on("mouseenter", "mlgen-fill", () => {
          if (propsRef.current.editMode === "view") map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "mlgen-fill", () => {
          map.getCanvas().style.cursor = "";
        });
      });
    })();
    return () => {
      cancelled = true;
      try {
        drawRef.current?.stop?.();
      } catch {
        /* ignore */
      }
      mapRef.current?.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // -- react to prop changes --
  useEffect(() => {
    const map = mapRef.current;
    if (map && readyRef.current) syncAll(map, props);
    // A fresh switch back to NAIP (manual toggle) gets its own couple of tries before we
    // auto-fall-back to Esri again.
    if (props.basemap === "naip" && prevBasemapRef.current !== "naip") {
      naipFailRef.current = 0;
    }
    prevBasemapRef.current = props.basemap;
  }, [props]);

  // -- terra-draw edit/draw lifecycle --
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    let disposed = false;

    (async () => {
      // Tear down any prior draw session first.
      try {
        drawRef.current?.stop?.();
      } catch {
        /* ignore */
      }
      drawRef.current = null;

      if (props.editMode === "view") {
        setFillOpacityHidden(map, null, props.basemap);
        return;
      }

      try {
        const { TerraDraw, TerraDrawSelectMode, TerraDrawPolygonMode } = await import("terra-draw");
        const { TerraDrawMapLibreGLAdapter } = await import("terra-draw-maplibre-gl-adapter");
        if (disposed) return;

        const select = new TerraDrawSelectMode({
          flags: {
            polygon: {
              feature: {
                draggable: true,
                coordinates: { midpoints: true, draggable: true, deletable: true },
              },
            },
          },
        });
        const draw = new TerraDraw({
          adapter: new TerraDrawMapLibreGLAdapter({ map, coordinatePrecision: 9 }),
          modes: [select, new TerraDrawPolygonMode()],
        });
        draw.start();
        drawRef.current = draw;

        if (props.editMode === "edit" && props.selectedFid) {
          // Load just the selected feature's polygon for vertex editing; hide its maplibre fill.
          const feat = props.mlgenFC.features.find((f) => f.properties?.fid === props.selectedFid);
          if (feat && feat.geometry.type === "Polygon") {
            const added = draw.addFeatures([
              {
                type: "Feature",
                geometry: feat.geometry,
                properties: { mode: "polygon", fid: props.selectedFid },
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ] as any);
            const tdId = added?.[0]?.id;
            setFillOpacityHidden(map, props.selectedFid, props.basemap);
            draw.setMode("select");
            if (tdId != null) {
              try {
                draw.selectFeature(tdId);
              } catch {
                /* ignore */
              }
            }
            draw.on("finish", () => {
              const snap = draw.getSnapshot();
              const edited = snap.find((s) => s.properties?.fid === props.selectedFid);
              if (edited && edited.geometry.type === "Polygon") {
                const ring = edited.geometry.coordinates[0] as LngLat[];
                propsRef.current.onGeometryChange(props.selectedFid!, ringToCoords(ring));
              }
            });
          }
        } else if (props.editMode === "draw") {
          draw.setMode("polygon");
          draw.on("finish", (id: string | number) => {
            const snap = draw.getSnapshot();
            const drawn = snap.find((s) => s.id === id);
            if (drawn && drawn.geometry.type === "Polygon") {
              const ring = drawn.geometry.coordinates[0] as LngLat[];
              propsRef.current.onDrawComplete(ringToCoords(ring));
              try {
                draw.clear();
              } catch {
                /* ignore */
              }
            }
          });
        }
      } catch (err) {
        // terra-draw failed to load/init — stay in view mode rather than crash.
        console.warn("terra-draw unavailable; editing disabled", err);
      }
    })();

    return () => {
      disposed = true;
      try {
        drawRef.current?.stop?.();
      } catch {
        /* ignore */
      }
      drawRef.current = null;
      const m = mapRef.current;
      if (m && readyRef.current) setFillOpacityHidden(m, null, props.basemap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.editMode, props.selectedFid, props.drawClass]);

  return <div ref={containerRef} className="h-full w-full bg-black" />;
}

// --- imperative map helpers ---

function addDataLayers(map: MLMap, basemap: CourseMapProps["basemap"]) {
  const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
  map.addSource("mlgen", { type: "geojson", data: empty });
  map.addSource("legacy", { type: "geojson", data: empty });
  map.addSource("centerline", { type: "geojson", data: empty });
  map.addSource("boundary", { type: "geojson", data: empty });

  map.addLayer({
    id: "mlgen-fill",
    type: "fill",
    source: "mlgen",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paint: { "fill-color": classColorExpr("fill") as any, "fill-opacity": fillOpacityFor(basemap) as any },
  });
  map.addLayer({
    id: "mlgen-line",
    type: "line",
    source: "mlgen",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paint: { "line-color": classColorExpr("stroke") as any, "line-width": 1.5 },
  });
  map.addLayer({
    id: "mlgen-selected",
    type: "line",
    source: "mlgen",
    paint: { "line-color": "#ffffff", "line-width": 3 },
    filter: ["==", ["get", "fid"], "___none___"],
  });
  // Legacy rendition: dashed outline, no fill (diff convention).
  map.addLayer({
    id: "legacy-line",
    type: "line",
    source: "legacy",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paint: { "line-color": classColorExpr("stroke") as any, "line-width": 1.5, "line-dasharray": [3, 2] },
    layout: { visibility: "none" },
  });
  map.addLayer({
    id: "centerline-primary",
    type: "line",
    source: "centerline",
    paint: { "line-color": CENTERLINE_PRIMARY, "line-width": 3 },
    filter: ["==", ["get", "kind"], "primary"],
  });
  map.addLayer({
    id: "centerline-tee",
    type: "line",
    source: "centerline",
    paint: { "line-color": CENTERLINE_PER_TEE, "line-width": 1.5, "line-dasharray": [2, 2] },
    filter: ["==", ["get", "kind"], "tee"],
  });
  map.addLayer({
    id: "boundary-line",
    type: "line",
    source: "boundary",
    paint: { "line-color": "#ff2d78", "line-width": 1, "line-dasharray": [1, 1], "line-opacity": 0.6 },
  });
}

function classFilter(visible: Set<FeatureClass>): unknown {
  return ["in", ["get", "cls"], ["literal", [...visible]]];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeSetData(map: MLMap, id: string, data: any) {
  const src = map.getSource(id) as { setData?: (d: unknown) => void } | undefined;
  src?.setData?.(data);
}

function setFillOpacityHidden(map: MLMap, hiddenFid: string | null, basemap: CourseMapProps["basemap"]) {
  if (!map.getLayer("mlgen-fill")) return;
  const base = fillOpacityFor(basemap);
  const expr = hiddenFid ? ["case", ["==", ["get", "fid"], hiddenFid], 0, base] : base;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map.setPaintProperty("mlgen-fill", "fill-opacity", expr as any);
}

function syncAll(map: MLMap, p: CourseMapProps) {
  safeSetData(map, "mlgen", p.mlgenFC);
  safeSetData(map, "legacy", p.legacyFC);
  safeSetData(map, "centerline", p.centerlineFC);
  safeSetData(map, "boundary", p.boundaryFC);

  // Basemap toggle.
  map.setLayoutProperty("naip", "visibility", p.basemap === "naip" ? "visible" : "none");
  map.setLayoutProperty("esri", "visibility", p.basemap === "esri" ? "visible" : "none");
  map.setLayoutProperty("osm", "visibility", p.basemap === "osm" ? "visible" : "none");

  // Keep the fill dimmed/undimmed for the current basemap outside of edit mode (edit mode's
  // hide-one-feature opacity is owned by the terra-draw lifecycle effect above).
  if (p.editMode !== "edit") {
    setFillOpacityHidden(map, null, p.basemap);
  }

  // Class visibility.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cf = classFilter(p.visibleClasses) as any;
  map.setFilter("mlgen-fill", cf);
  map.setFilter("mlgen-line", cf);
  map.setFilter("legacy-line", cf);

  // Rendition + diff visibility.
  const showMlgen = p.rendition === "mlgen" || p.diff;
  const showLegacy = p.rendition === "legacy" || p.diff;
  map.setLayoutProperty("mlgen-fill", "visibility", showMlgen ? "visible" : "none");
  map.setLayoutProperty("mlgen-line", "visibility", showMlgen ? "visible" : "none");
  map.setLayoutProperty("legacy-line", "visibility", showLegacy ? "visible" : "none");

  // Selection highlight.
  map.setFilter("mlgen-selected", ["==", ["get", "fid"], p.selectedFid ?? "___none___"]);

  // Fit-to-hole when the bbox changes (key stored per-map).
  if (p.bbox) {
    const key = JSON.stringify(p.bbox);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = map as any;
    if (key !== m.__bboxKey) {
      m.__bboxKey = key;
      map.fitBounds(p.bbox, { padding: 40, duration: 400, maxZoom: 19 });
    }
  }
}
