"use client";

import { useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import HelpTip from "../../components/HelpTip";
import { getJson } from "../../lib/api";
import { fcfa } from "../../lib/format";
import type { Resume } from "../../lib/types";
import ManualEditor from "./ManualEditor";

export default function AmenagementPanel({ map }: { map: maplibregl.Map | null }) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [manuelId, setManuelId] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ summaries: Resume[] }>("/api/conception-assistee/amenagement")
      .then((d) => setResumes(d.summaries))
      .catch((e) => setError(e.message));
  }, []);

  const zoom = (r: Resume) => map?.flyTo({ center: r.centre, zoom: 18, duration: 1200 });

  return (
    <div className="text-sm">
      <div className="mb-1.5 font-semibold">
        Conception assistée
        <HelpTip
          align="right"
          title="Conception assistée"
          text="Pour chaque parcelle, l'outil propose automatiquement où placer le bâtiment et le point de collecte des déchets, en respectant les retraits, les zones naturelles et le bâti existant. Vous pouvez accepter la proposition ou la modifier à la main."
        />
      </div>
      {error && <p className="text-red-700">{error}</p>}
      {resumes.map((r) => (
        <div key={r.parcelle_id} className="mb-2 rounded border border-gray-200 p-2">
          <div className="flex items-center justify-between">
            <strong>{r.nom}</strong>
            <span className="space-x-1">
              <button onClick={() => zoom(r)} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-white">
                Zoom
              </button>
              {manuelId !== r.parcelle_id && (
                <button
                  onClick={() => setManuelId(r.parcelle_id)}
                  className="rounded bg-emerald-700 px-2 py-0.5 text-xs text-white"
                >
                  Modifier à la main
                </button>
              )}
            </span>
          </div>

          {r.statut === "constructible" ? (
            <ul className="mt-1 text-xs leading-relaxed">
              <li>
                Proposition auto — emprise : {r.emprise_m2} m² ({r.ces_pct}% de {r.surface_m2} m²)
                <HelpTip align="right" title="Emprise" text="Surface au sol du bâtiment. Le plafond (40 % de la parcelle si l'indice ≥ 75, sinon 25 %) évite de trop imperméabiliser le terrain." />
              </li>
              <li>Dimensions : {r.dimensions_m} m</li>
              <li>Fondations : {r.fondation}</li>
              <li>
                Coût estimé : <strong>{fcfa(r.cout_total_estime_fcfa ?? 0)}</strong>
                <HelpTip align="right" title="Coût estimé" text="Fondations (selon la portance du sol) + drainage périphérique si le risque d'inondation n'est pas faible. Barèmes inventés pour la démonstration, à remplacer par des prix réels." />
              </li>
            </ul>
          ) : (
            <p className="mt-1 text-xs">
              Non constructible — la proposition auto est un bassin de rétention de {r.bassin_volume_m3} m³
              <HelpTip align="right" title="Bassin de rétention" text="Quand le sol est trop faible ou trop inondable (indice < 40), l'outil propose de garder la parcelle comme réservoir d'eau de pluie plutôt que d'y construire." />
            </p>
          )}
          <p className="mt-1 text-xs text-gray-600">{r.justification}</p>

          {manuelId === r.parcelle_id && (
            <ManualEditor resume={r} map={map} onExit={() => setManuelId(null)} />
          )}
        </div>
      ))}
      <p className="text-xs italic text-gray-500">
        Coûts indicatifs sur hypothèses inventées (données synthétiques).
      </p>
    </div>
  );
}
