"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import HelpTip from "../components/HelpTip";
import { API_URL } from "../lib/config";
import { MAP_STYLE } from "../lib/mapStyle";
import Assistant from "./Assistant";
import ModulePanel from "./panels/ModulePanel";

const colorScale = (property: string): maplibregl.ExpressionSpecification => [
  "interpolate",
  ["linear"],
  ["get", property],
  0,
  "#d73027",
  50,
  "#fee08b",
  100,
  "#1a9850",
];

const SYNTHETIC_NOTE = `<em style="color:#777">Donnée synthétique — démonstration</em>`;

const GROUPS = {
  icv: ["icv-fill", "icv-outline"],
  parcelles: ["parcelles-fill", "parcelles-outline"],
  amenagement: [
    "amenagement-constructible",
    "amenagement-tampon",
    "amenagement-bassin",
    "amenagement-existant",
    "amenagement-batiment",
    "amenagement-collecte",
  ],
} as const;

type GroupName = keyof typeof GROUPS;

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function popup(map: maplibregl.Map, lngLat: maplibregl.LngLatLike, html: string) {
  new maplibregl.Popup().setLngLat(lngLat).setHTML(html).addTo(map);
}

function addLayers(map: maplibregl.Map) {
  map.addSource("icv", { type: "geojson", data: `${API_URL}/api/icv` });
  map.addLayer({ id: "icv-fill", type: "fill", source: "icv",
    paint: { "fill-color": colorScale("icv"), "fill-opacity": 0.6 } });
  map.addLayer({ id: "icv-outline", type: "line", source: "icv",
    paint: { "line-color": "#333", "line-width": 1 } });

  map.addSource("parcelles", { type: "geojson", data: `${API_URL}/api/conception-assistee` });
  map.addLayer({ id: "parcelles-fill", type: "fill", source: "parcelles",
    paint: { "fill-color": colorScale("indice_constructibilite_0_100"), "fill-opacity": 0.55 } });
  map.addLayer({ id: "parcelles-outline", type: "line", source: "parcelles",
    paint: { "line-color": "#111", "line-width": 2 } });

  map.addSource("amenagement", { type: "geojson", data: `${API_URL}/api/conception-assistee/amenagement` });
  const type = (t: string): maplibregl.ExpressionSpecification => ["==", ["get", "type"], t];
  const zoomMin = 15;
  map.addLayer({ id: "amenagement-constructible", type: "fill", source: "amenagement",
    filter: type("zone_constructible"), minzoom: zoomMin,
    paint: { "fill-color": "#22c55e", "fill-opacity": 0.12 } });
  map.addLayer({ id: "amenagement-tampon", type: "fill", source: "amenagement",
    filter: type("zone_tampon"), minzoom: zoomMin,
    paint: { "fill-color": "#15803d", "fill-opacity": 0.35 } });
  map.addLayer({ id: "amenagement-bassin", type: "fill", source: "amenagement",
    filter: type("bassin_retention"), minzoom: zoomMin,
    paint: { "fill-color": "#0ea5e9", "fill-opacity": 0.55 } });
  map.addLayer({ id: "amenagement-existant", type: "fill", source: "amenagement",
    filter: type("emprise_existante"), minzoom: zoomMin,
    paint: { "fill-color": "#6b7280", "fill-opacity": 0.85 } });
  map.addLayer({ id: "amenagement-batiment", type: "fill", source: "amenagement",
    filter: type("batiment"), minzoom: zoomMin,
    paint: { "fill-color": "#1d4ed8", "fill-opacity": 0.85 } });
  map.addLayer({ id: "amenagement-collecte", type: "circle", source: "amenagement",
    filter: type("point_collecte"), minzoom: zoomMin,
    paint: { "circle-radius": 7, "circle-color": "#f59e0b",
             "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });

  // Aménagement dessiné à la main (alimenté par l'éditeur manuel) : vert = conforme, rouge = non conforme
  map.addSource("manuel", { type: "geojson", data: EMPTY });
  const couleur: maplibregl.ExpressionSpecification = ["case", ["get", "valide"], "#16a34a", "#dc2626"];
  map.addLayer({ id: "manuel-batiment", type: "fill", source: "manuel",
    filter: type("batiment_manuel"), paint: { "fill-color": couleur, "fill-opacity": 0.4 } });
  map.addLayer({ id: "manuel-batiment-contour", type: "line", source: "manuel",
    filter: type("batiment_manuel"), paint: { "line-color": couleur, "line-width": 3 } });
}

function addInteractions(map: maplibregl.Map) {
  map.on("click", "icv-fill", (e) => {
    const p = e.features?.[0]?.properties;
    if (p) popup(map, e.lngLat, `<strong>${p.nom_quartier}</strong><br/>ICV : ${p.icv} / 100<br/>${p.population.toLocaleString("fr-FR")} habitants<br/>${SYNTHETIC_NOTE}`);
  });
  map.on("click", "parcelles-fill", (e) => {
    const p = e.features?.[0]?.properties;
    if (p) popup(map, e.lngLat,
      `<strong>${p.nom}</strong><br/>Indice de constructibilité : ${p.indice_constructibilite_0_100} / 100<br/>` +
      `<p style="max-width:260px">${p.recommandation}</p>${SYNTHETIC_NOTE}`);
  });
  map.on("click", "amenagement-batiment", (e) => {
    const p = e.features?.[0]?.properties;
    if (p) popup(map, e.lngLat,
      `<strong>Bâtiment proposé (auto)</strong><br/>${p.longueur_m} × ${p.largeur_m} m (${p.emprise_m2} m²)<br/>Orientation ${p.orientation}`);
  });
  map.on("click", "amenagement-collecte", (e) => {
    const p = e.features?.[0]?.properties;
    if (p) popup(map, e.lngLat,
      `<strong>Point de collecte des déchets</strong><br/>À ${p.distance_batiment_m} m du bâtiment, côté voie d'accès`);
  });
  map.on("click", "amenagement-bassin", (e) => {
    const p = e.features?.[0]?.properties;
    if (p) popup(map, e.lngLat, `<strong>Bassin de rétention</strong><br/>Volume ≈ ${p.volume_m3} m³`);
  });

  for (const layer of ["icv-fill", "parcelles-fill", "amenagement-batiment", "amenagement-collecte", "amenagement-bassin"]) {
    map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
  }
}

export default function CadreMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [visible, setVisible] = useState<Record<GroupName, boolean>>({
    icv: true,
    parcelles: true,
    amenagement: true,
  });

  useEffect(() => {
    if (!mapContainer.current) return;
    // Le worker de MapLibre est hébergé dans public/maplibre/ (voir scripts/copy-maplibre-assets.mjs)
    maplibregl.setWorkerUrl(`${window.location.origin}/maplibre/maplibre-gl-worker.mjs`);
    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      // cadrage sur l'ensemble des quartiers, en laissant la place aux panneaux latéraux
      bounds: [[2.22, 6.36], [2.40, 6.70]],
      fitBoundsOptions: { padding: { top: 60, bottom: 60, left: 320, right: 440 } },
    });
    instance.addControl(new maplibregl.NavigationControl(), "top-right");
    instance.on("load", () => {
      addLayers(instance);
      addInteractions(instance);
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __cadreMap?: maplibregl.Map }).__cadreMap = instance; // prise pour les tests e2e
      }
      setMap(instance);
    });
    return () => {
      instance.remove();
      setMap(null);
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    for (const group of Object.keys(GROUPS) as GroupName[]) {
      for (const id of GROUPS[group]) {
        map.setLayoutProperty(id, "visibility", visible[group] ? "visible" : "none");
      }
    }
  }, [map, visible]);

  const toggle = (group: GroupName) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setVisible((v) => ({ ...v, [group]: e.target.checked }));

  return (
    <div className="relative h-screen w-full">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-4 bg-red-700 py-1.5 text-center text-sm text-white">
        <span>Données synthétiques à des fins de démonstration — ne pas présenter comme données officielles</span>
        <Link href="/guide" className="rounded bg-white px-2 py-0.5 font-medium text-red-800 hover:bg-red-50">
          Mode d&apos;emploi
        </Link>
      </div>

      <div className="absolute left-2.5 top-11 z-10 rounded-lg bg-white px-3.5 py-2.5 text-sm leading-relaxed shadow-lg">
        <div className="mb-1.5 font-semibold">Cadre+ — démo Abomey-Calavi</div>
        <label className="block">
          <input type="checkbox" checked={visible.icv} onChange={toggle("icv")} /> Indice de Cadre de Vie (quartiers)
          <HelpTip
            title="Indice de Cadre de Vie (ICV)"
            text="Note de 0 à 100 par quartier, calculée à partir de 8 critères : accès à l'école, à la santé, à l'eau, électrification, drainage, collecte des déchets, espaces verts, risque d'inondation. Rouge = cadre de vie dégradé, vert = bon. Cliquez sur un quartier pour le détail."
          />
        </label>
        <label className="block">
          <input type="checkbox" checked={visible.parcelles} onChange={toggle("parcelles")} /> Parcelles (constructibilité)
          <HelpTip
            title="Constructibilité des parcelles"
            text="Note de 0 à 100 selon la portance du sol, le risque d'inondation et la pente. Au-dessus de 75 : zone prioritaire ; entre 40 et 75 : constructible sous conditions ; en dessous de 40 : déconseillé. Zoomez (≥ 15) pour voir l'aménagement."
          />
        </label>
        <label className="block">
          <input type="checkbox" checked={visible.amenagement} onChange={toggle("amenagement")} /> Aménagement optimal (zoom ≥ 15)
          <HelpTip
            title="Aménagement optimal"
            text="Proposition automatique pour chaque parcelle : bâtiment (bleu), point de collecte des déchets (orange), zones tampons naturelles (vert foncé), bassin de rétention (bleu clair), bâti existant (gris). Visible à partir du zoom 15."
          />
        </label>
        <div className="mt-2 flex items-center gap-1">
          <span>0</span>
          <div className="h-2.5 w-20 bg-gradient-to-r from-[#d73027] via-[#fee08b] to-[#1a9850]" />
          <span>100</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 text-xs">
          <span><i className="inline-block h-2.5 w-2.5 bg-[#1d4ed8]" /> Bâtiment</span>
          <span><i className="inline-block h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Collecte déchets</span>
          <span><i className="inline-block h-2.5 w-2.5 bg-[#15803d]" /> Zone tampon</span>
          <span><i className="inline-block h-2.5 w-2.5 bg-[#0ea5e9]" /> Bassin rétention</span>
          <span><i className="inline-block h-2.5 w-2.5 bg-[#6b7280]" /> Bâti existant</span>
          <span><i className="inline-block h-2.5 w-2.5 border-2 border-[#16a34a]" /> Votre tracé</span>
        </div>
      </div>

      <ModulePanel map={map} />
      <Assistant />

      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
