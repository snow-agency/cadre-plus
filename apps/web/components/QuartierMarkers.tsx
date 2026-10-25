"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { couleurIcv } from "../lib/couleurs";
import type { Quartier } from "../lib/types";

// Au-delà de ce zoom, on est « dans » un quartier : les pastilles gêneraient le travail sur parcelle.
const ZOOM_MAX_PASTILLES = 13.3;

const CLASSES_BASE =
  "flex cursor-pointer items-center gap-1.5 rounded-full border border-white bg-white/95 py-1 pl-2 pr-2.5 text-xs font-semibold text-ink shadow-card ring-1 ring-black/5 transition hover:scale-105";

// Pastilles « Quartier · note » posées sur la carte, comme des étiquettes interactives.
export default function QuartierMarkers({
  map,
  quartiers,
  visible,
  selection,
  onSelect,
}: {
  map: maplibregl.Map | null;
  quartiers: Quartier[];
  visible: boolean;
  selection: string | null;
  onSelect: (id: string) => void;
}) {
  const elements = useRef(new Map<string, HTMLButtonElement>());
  const surSelection = useRef(onSelect);
  surSelection.current = onSelect;

  useEffect(() => {
    if (!map) return;
    const crees: maplibregl.Marker[] = [];
    for (const q of quartiers) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = CLASSES_BASE;
      el.setAttribute("aria-label", `Quartier ${q.nom_quartier}, ICV ${q.icv} sur 100`);
      el.dataset.quartier = q.id;

      const point = document.createElement("span");
      point.className = "h-2.5 w-2.5 rounded-full";
      point.style.background = couleurIcv(q.icv);
      const nom = document.createElement("span");
      nom.textContent = q.nom_quartier;
      const note = document.createElement("span");
      note.className = "font-mono text-[11px] text-muted";
      note.textContent = String(Math.round(q.icv));
      el.append(point, nom, note);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        surSelection.current(q.id);
      });
      elements.current.set(q.id, el);
      crees.push(new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(q.centre).addTo(map));
    }
    const refs = elements.current;
    return () => {
      crees.forEach((m) => m.remove());
      refs.clear();
    };
  }, [map, quartiers]);

  const [zoomLoin, setZoomLoin] = useState(true);
  useEffect(() => {
    if (!map) return;
    const maj = () => setZoomLoin(map.getZoom() < ZOOM_MAX_PASTILLES);
    maj();
    map.on("zoom", maj);
    return () => {
      map.off("zoom", maj);
    };
  }, [map]);

  useEffect(() => {
    for (const [id, el] of elements.current) {
      el.style.display = visible && zoomLoin ? "" : "none";
      // classList (et non className) : MapLibre pose sur l'élément sa propre classe de positionnement
      el.classList.toggle("ring-2", id === selection);
      el.classList.toggle("!ring-brand-600", id === selection);
      el.style.zIndex = id === selection ? "10" : "";
    }
  }, [visible, zoomLoin, selection, quartiers, map]);

  return null;
}
