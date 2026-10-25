"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import HelpTip from "../components/HelpTip";
import QuartierCard from "../components/QuartierCard";
import QuartierMarkers from "../components/QuartierMarkers";
import { getJson } from "../lib/api";
import { API_URL } from "../lib/config";
import { DEGRADE_ICV_CSS, expressionIcv } from "../lib/couleurs";
import { MAP_STYLE, STYLE_REPLI } from "../lib/mapStyle";
import type { Quartier } from "../lib/types";
import Assistant from "./Assistant";
import ModulePanel from "./panels/ModulePanel";

const colorScale = (property: string) => expressionIcv(property) as unknown as maplibregl.ExpressionSpecification;

const GROUPS = {
  icv: ["icv-fill", "icv-outline", "icv-selection"],
  parcelles: ["parcelles-fill", "parcelles-outline"],
  amenagement: [
    "amenagement-constructible", "amenagement-tampon", "amenagement-bassin",
    "amenagement-existant", "amenagement-batiment", "amenagement-collecte",
  ],
} as const;

type GroupName = keyof typeof GROUPS;

const CALQUES: { id: GroupName; label: string; aide: { titre: string; texte: string } }[] = [
  {
    id: "icv", label: "Indice de Cadre de Vie",
    aide: {
      titre: "Indice de Cadre de Vie (ICV)",
      texte: "Note de 0 à 100 par quartier, calculée à partir de 8 critères : accès à l'école, à la santé, à l'eau, électrification, drainage, collecte des déchets, espaces verts, risque d'inondation. Rouge = cadre de vie dégradé, vert = bon. Cliquez sur un quartier pour comprendre sa note.",
    },
  },
  {
    id: "parcelles", label: "Parcelles",
    aide: {
      titre: "Constructibilité des parcelles",
      texte: "Note de 0 à 100 selon la portance du sol, le risque d'inondation et la pente. Au-dessus de 75 : zone prioritaire ; entre 40 et 75 : constructible sous conditions ; en dessous de 40 : déconseillé. Zoomez (≥ 15) pour voir l'aménagement.",
    },
  },
  {
    id: "amenagement", label: "Aménagement optimal",
    aide: {
      titre: "Aménagement optimal",
      texte: "Proposition automatique pour chaque parcelle : bâtiment, point de collecte des déchets, zones tampons naturelles, bassin de rétention, bâti existant. Visible à partir du zoom 15.",
    },
  },
];

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function popup(map: maplibregl.Map, lngLat: maplibregl.LngLatLike, html: string) {
  new maplibregl.Popup({ maxWidth: "300px" }).setLngLat(lngLat).setHTML(html).addTo(map);
}

function addLayers(map: maplibregl.Map) {
  // Opaque à l'échelle de la commune, estompée en zoomant pour laisser voir le fond (travail sur parcelle)
  const survol = ["interpolate", ["linear"], ["zoom"],
    12, ["case", ["boolean", ["feature-state", "hover"], false], 0.98, 0.92],
    15, ["case", ["boolean", ["feature-state", "hover"], false], 0.28, 0.16]] as unknown as maplibregl.ExpressionSpecification;

  map.addSource("icv", { type: "geojson", data: `${API_URL}/api/icv`, promoteId: "id" });
  map.addLayer({ id: "icv-fill", type: "fill", source: "icv",
    paint: { "fill-color": colorScale("icv"), "fill-opacity": survol } });
  map.addLayer({ id: "icv-outline", type: "line", source: "icv",
    paint: { "line-color": "#ffffff", "line-width": 2.5 } });
  map.addLayer({ id: "icv-selection", type: "line", source: "icv",
    paint: { "line-color": "#0b2545",
             "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 4, 0] } });

  map.addSource("parcelles", { type: "geojson", data: `${API_URL}/api/conception-assistee` });
  map.addLayer({ id: "parcelles-fill", type: "fill", source: "parcelles",
    paint: { "fill-color": colorScale("indice_constructibilite_0_100"), "fill-opacity": 0.6 } });
  map.addLayer({ id: "parcelles-outline", type: "line", source: "parcelles",
    paint: { "line-color": "#0b2545", "line-width": 2 } });

  map.addSource("amenagement", { type: "geojson", data: `${API_URL}/api/conception-assistee/amenagement` });
  const type = (t: string): maplibregl.ExpressionSpecification => ["==", ["get", "type"], t];
  const zoomMin = 15;
  map.addLayer({ id: "amenagement-constructible", type: "fill", source: "amenagement",
    filter: type("zone_constructible"), minzoom: zoomMin, paint: { "fill-color": "#22c55e", "fill-opacity": 0.14 } });
  map.addLayer({ id: "amenagement-tampon", type: "fill", source: "amenagement",
    filter: type("zone_tampon"), minzoom: zoomMin, paint: { "fill-color": "#15803d", "fill-opacity": 0.32 } });
  map.addLayer({ id: "amenagement-bassin", type: "fill", source: "amenagement",
    filter: type("bassin_retention"), minzoom: zoomMin, paint: { "fill-color": "#38bdf8", "fill-opacity": 0.6 } });
  map.addLayer({ id: "amenagement-existant", type: "fill", source: "amenagement",
    filter: type("emprise_existante"), minzoom: zoomMin, paint: { "fill-color": "#94a3b8", "fill-opacity": 0.9 } });
  map.addLayer({ id: "amenagement-batiment", type: "fill", source: "amenagement",
    filter: type("batiment"), minzoom: zoomMin, paint: { "fill-color": "#2563eb", "fill-opacity": 0.88 } });
  map.addLayer({ id: "amenagement-collecte", type: "circle", source: "amenagement",
    filter: type("point_collecte"), minzoom: zoomMin,
    paint: { "circle-radius": 8, "circle-color": "#f59e0b", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2.5 } });

  // Aménagement dessiné à la main (alimenté par l'éditeur manuel) : vert = conforme, rouge = non conforme
  map.addSource("manuel", { type: "geojson", data: EMPTY });
  const couleur: maplibregl.ExpressionSpecification = ["case", ["get", "valide"], "#16a34a", "#dc2626"];
  map.addLayer({ id: "manuel-batiment", type: "fill", source: "manuel",
    filter: type("batiment_manuel"), paint: { "fill-color": couleur, "fill-opacity": 0.4 } });
  map.addLayer({ id: "manuel-batiment-contour", type: "line", source: "manuel",
    filter: type("batiment_manuel"), paint: { "line-color": couleur, "line-width": 3 } });
}

export default function CadreMap() {
  const conteneur = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [visible, setVisible] = useState<Record<GroupName, boolean>>({ icv: true, parcelles: true, amenagement: true });
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [selection, setSelection] = useState<string | null>(null);
  const survolRef = useRef<string | null>(null);
  const quartiersRef = useRef<Quartier[]>([]);
  quartiersRef.current = quartiers;

  useEffect(() => {
    getJson<{ features: { properties: Quartier }[] }>("/api/icv")
      .then((d) => setQuartiers(d.features.map((f) => f.properties)))
      .catch(() => setQuartiers([]));
  }, []);

  const choisir = useCallback((id: string | null, carte: maplibregl.Map | null) => {
    setSelection(id);
    if (!id || !carte) return;
    const q = quartiersRef.current.find((x) => x.id === id);
    if (q) carte.flyTo({ center: q.centre, zoom: Math.max(carte.getZoom(), 11.6), duration: 900 });
  }, []);

  useEffect(() => {
    if (!conteneur.current) return;
    // Le worker de MapLibre est hébergé dans public/maplibre/ (voir scripts/copy-maplibre-assets.mjs)
    maplibregl.setWorkerUrl(`${window.location.origin}/maplibre/maplibre-gl-worker.mjs`);
    const instance = new maplibregl.Map({
      container: conteneur.current,
      style: MAP_STYLE,
      // cadrage sur l'ensemble des quartiers, en laissant la place aux panneaux latéraux
      bounds: [[2.2, 6.34], [2.42, 6.72]],
      fitBoundsOptions: { padding: { top: 40, bottom: 40, left: 330, right: 460 } },
      attributionControl: { compact: true },
    });
    instance.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "bottom-right");

    // Si le fond principal ne répond pas, on bascule sur le fond de repli intégré.
    const minuterie = setTimeout(() => {
      if (!instance.isStyleLoaded()) instance.setStyle(STYLE_REPLI);
    }, 8000);

    // « style.load » plutôt que « load » : les données s'affichent sans attendre les tuiles du fond de carte (connexion lente)
    instance.once("style.load", () => {
      clearTimeout(minuterie);
      addLayers(instance);

      instance.on("click", "icv-fill", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) choisir(id, instance);
      });
      instance.on("mousemove", "icv-fill", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id || id === survolRef.current) return;
        if (survolRef.current) instance.setFeatureState({ source: "icv", id: survolRef.current }, { hover: false });
        survolRef.current = id;
        instance.setFeatureState({ source: "icv", id }, { hover: true });
      });
      instance.on("mouseleave", "icv-fill", () => {
        if (survolRef.current) instance.setFeatureState({ source: "icv", id: survolRef.current }, { hover: false });
        survolRef.current = null;
      });
      instance.on("click", "parcelles-fill", (e) => {
        const p = e.features?.[0]?.properties;
        if (p) popup(instance, e.lngLat,
          `<strong>${p.nom}</strong><br/>Indice de constructibilité : <strong>${p.indice_constructibilite_0_100}</strong> / 100<br/>` +
          `<span style="display:block;margin-top:6px">${p.recommandation}</span>`);
      });
      instance.on("click", "amenagement-batiment", (e) => {
        const p = e.features?.[0]?.properties;
        if (p) popup(instance, e.lngLat,
          `<strong>Bâtiment proposé (auto)</strong><br/>${p.longueur_m} × ${p.largeur_m} m (${p.emprise_m2} m²)<br/>Orientation ${p.orientation}`);
      });
      instance.on("click", "amenagement-collecte", (e) => {
        const p = e.features?.[0]?.properties;
        if (p) popup(instance, e.lngLat,
          `<strong>Point de collecte des déchets</strong><br/>À ${p.distance_batiment_m} m du bâtiment, côté voie d'accès`);
      });
      instance.on("click", "amenagement-bassin", (e) => {
        const p = e.features?.[0]?.properties;
        if (p) popup(instance, e.lngLat, `<strong>Bassin de rétention</strong><br/>Volume ≈ ${p.volume_m3} m³`);
      });
      for (const layer of ["icv-fill", "parcelles-fill", "amenagement-batiment", "amenagement-collecte", "amenagement-bassin"]) {
        instance.on("mouseenter", layer, () => (instance.getCanvas().style.cursor = "pointer"));
        instance.on("mouseleave", layer, () => (instance.getCanvas().style.cursor = ""));
      }

      if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_E2E === "1") {
        (window as unknown as { __cadreMap?: maplibregl.Map }).__cadreMap = instance; // prise pour les tests e2e
      }
      setMap(instance);
    });
    return () => {
      clearTimeout(minuterie);
      instance.remove();
      setMap(null);
    };
  }, [choisir]);

  useEffect(() => {
    if (!map) return;
    for (const group of Object.keys(GROUPS) as GroupName[]) {
      for (const id of GROUPS[group]) {
        map.setLayoutProperty(id, "visibility", visible[group] ? "visible" : "none");
      }
    }
  }, [map, visible]);

  const selectionPrecedente = useRef<string | null>(null);
  useEffect(() => {
    if (!map) return;
    if (selectionPrecedente.current) map.setFeatureState({ source: "icv", id: selectionPrecedente.current }, { selected: false });
    if (selection) map.setFeatureState({ source: "icv", id: selection }, { selected: true });
    selectionPrecedente.current = selection;
  }, [map, selection]);

  const quartierChoisi = quartiers.find((q) => q.id === selection) ?? null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0">
        <div ref={conteneur} className="h-full w-full" />
      </div>

      <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-h-[calc(100%-5.5rem)] w-72 flex-col gap-3 overflow-y-auto pb-1">
        <section className="glass pointer-events-auto p-4" aria-label="Couches de la carte">
          <p className="label-caps">Couches</p>
          <ul className="mt-2 space-y-0.5">
            {CALQUES.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5">
                  <span className="text-sm font-medium text-ink">
                    {c.label}
                    <HelpTip title={c.aide.titre} text={c.aide.texte} />
                  </span>
                  <span className="relative inline-flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={visible[c.id]}
                      onChange={(e) => setVisible((v) => ({ ...v, [c.id]: e.target.checked }))}
                      aria-label={`Afficher : ${c.label}`}
                      className="peer sr-only"
                    />
                    <span className="h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2" />
                    <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <div className="h-2 rounded-full" style={{ background: DEGRADE_ICV_CSS }} />
            <div className="mt-1 flex justify-between text-[11px] font-medium text-muted">
              <span>Dégradé (0)</span>
              <span>Bon (100)</span>
            </div>
          </div>

          <details className="mt-3 text-xs text-body">
            <summary className="cursor-pointer font-medium text-muted hover:text-ink">Légende de l&apos;aménagement</summary>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
              <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#2563eb]" /> Bâtiment</li>
              <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Collecte déchets</li>
              <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#15803d]" /> Zone tampon</li>
              <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#38bdf8]" /> Bassin rétention</li>
              <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#94a3b8]" /> Bâti existant</li>
              <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm border-2 border-[#16a34a]" /> Votre tracé</li>
            </ul>
          </details>
        </section>

        {quartierChoisi && <QuartierCard quartier={quartierChoisi} onClose={() => setSelection(null)} />}
      </div>

      <QuartierMarkers
        map={map}
        quartiers={quartiers}
        visible={visible.icv}
        selection={selection}
        onSelect={(id) => choisir(id, map)}
      />
      <ModulePanel map={map} />
      <Assistant />
    </div>
  );
}
