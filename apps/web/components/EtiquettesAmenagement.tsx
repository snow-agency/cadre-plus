"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { getJson } from "../lib/api";
import type { LonLat } from "../lib/types";

// En dessous de ce zoom, les étiquettes se chevaucheraient : on les masque.
const ZOOM_MIN = 17.2;

const COULEURS: Record<string, string> = {
  batiment: "#2563eb",
  point_collecte: "#f59e0b",
  voie_acces: "#475569",
  zone_tampon: "#15803d",
  bassin_retention: "#38bdf8",
  emprise_existante: "#94a3b8",
};

// Décalage (px) pour que « Voie d'accès » et « Collecte des déchets », très proches, ne se recouvrent pas
const DECALAGES: Record<string, [number, number]> = { voie_acces: [0, -16], point_collecte: [0, 20] };

type Feature = { properties: { parcelle_id: string; type: string; etiquette?: string; etiquette_lonlat?: LonLat } };
type Etiquette = { parcelleId: string; type: string; el: HTMLElement };

// Étiquettes posées sur la carte à côté de chaque élément de l'aménagement proposé (bâtiment, voie, collecte…).
export default function EtiquettesAmenagement({
  map,
  actif,
  masquerParcelle,
}: {
  map: maplibregl.Map | null;
  actif: boolean;
  masquerParcelle: string | null;
}) {
  const etiquettes = useRef<Etiquette[]>([]);
  const maj = useRef<() => void>(() => {});

  useEffect(() => {
    if (!map) return;
    let annule = false;
    const marqueurs: maplibregl.Marker[] = [];
    getJson<{ features: Feature[] }>("/api/conception-assistee/amenagement")
      .then((d) => {
        if (annule) return;
        for (const f of d.features) {
          const { etiquette, etiquette_lonlat: position, type, parcelle_id: parcelleId } = f.properties;
          if (!etiquette || !position) continue;
          const el = document.createElement("div");
          el.className =
            "pointer-events-none flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-card ring-1 ring-black/10";
          el.dataset.etiquette = type;
          const point = document.createElement("span");
          point.className = "h-2.5 w-2.5 rounded-full";
          point.style.background = COULEURS[type] ?? "#64748b";
          const texte = document.createElement("span");
          texte.textContent = etiquette;
          el.append(point, texte);
          marqueurs.push(new maplibregl.Marker({ element: el, anchor: "center", offset: DECALAGES[type] ?? [0, 0] }).setLngLat(position).addTo(map));
          etiquettes.current.push({ parcelleId, type, el });
        }
        maj.current();
      })
      .catch(() => {});
    return () => {
      annule = true;
      marqueurs.forEach((m) => m.remove());
      etiquettes.current = [];
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const rafraichir = () => {
      const proche = map.getZoom() >= ZOOM_MIN;
      const couche = !!map.getLayer("amenagement-batiment") && map.getLayoutProperty("amenagement-batiment", "visibility") !== "none";
      for (const e of etiquettes.current) {
        const remplace = e.parcelleId === masquerParcelle && (e.type === "batiment" || e.type === "point_collecte");
        e.el.style.display = actif && proche && couche && !remplace ? "" : "none";
      }
    };
    maj.current = rafraichir;
    rafraichir();
    map.on("zoom", rafraichir);
    map.on("styledata", rafraichir);
    return () => {
      map.off("zoom", rafraichir);
      map.off("styledata", rafraichir);
    };
  }, [map, actif, masquerParcelle]);

  return null;
}
