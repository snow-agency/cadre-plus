"use client";

import { useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Crosshair, Hand } from "lucide-react";
import EtiquettesAmenagement from "../../components/EtiquettesAmenagement";
import HelpTip from "../../components/HelpTip";
import { getJson } from "../../lib/api";
import { fcfa } from "../../lib/format";
import { couleurIcv } from "../../lib/couleurs";
import type { Resume } from "../../lib/types";
import ManualEditor from "./ManualEditor";

function Tuile({ label, valeur, aide }: { label: string; valeur: React.ReactNode; aide?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="label-caps flex items-center">{label}{aide}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{valeur}</p>
    </div>
  );
}

function verdict(indice: number): { label: string; classes: string } {
  if (indice >= 75) return { label: "Zone prioritaire", classes: "bg-emerald-50 text-emerald-800 ring-emerald-200" };
  if (indice >= 40) return { label: "Constructible sous conditions", classes: "bg-amber-50 text-amber-800 ring-amber-200" };
  return { label: "Construction déconseillée", classes: "bg-red-50 text-red-800 ring-red-200" };
}

const LEGENDE: { couleur: string; forme: string; label: string }[] = [
  { couleur: "bg-[#2563eb]", forme: "rounded-sm", label: "Bâtiment proposé" },
  { couleur: "bg-[#f59e0b]", forme: "rounded-full", label: "Collecte des déchets" },
  { couleur: "bg-[#475569]", forme: "rounded-sm", label: "Voie d'accès (la route)" },
  { couleur: "bg-[#15803d]", forme: "rounded-sm", label: "Zone naturelle protégée" },
  { couleur: "bg-[#38bdf8]", forme: "rounded-sm", label: "Bassin de rétention" },
  { couleur: "bg-[#94a3b8]", forme: "rounded-sm", label: "Bâti existant" },
];

const ETAPES = [
  ["Choisissez une parcelle", "puis cliquez sur « Voir sur la carte » : la carte s'approche en vue satellite."],
  ["Lisez la proposition", "l'outil a posé le bâtiment et le point de collecte des déchets en respectant les distances de sécurité."],
  ["Corrigez si besoin", "« Modifier à la main » : glissez les pastilles B et D, changez la taille. Chaque règle est revérifiée en direct."],
];

function phraseProposition(r: Resume): string {
  const voie = r.voie_cote ? `côté ${r.voie_cote}, ` : "";
  const collecte = r.point_collecte ? ", avec un point de collecte des déchets le long de la route" : "";
  return `Un bâtiment de ${r.dimensions_m} m, ${voie}à ${r.distance_voie_m} m de la limite sur la route${collecte}.`;
}

export default function AmenagementPanel({
  map,
  actif,
  zoomPremiere,
  onParcelleVue,
  onVueReelle,
}: {
  map: maplibregl.Map | null;
  actif: boolean;
  zoomPremiere: number;
  onParcelleVue: () => void;
  onVueReelle: () => void;
}) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [manuelId, setManuelId] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ summaries: Resume[] }>("/api/conception-assistee/amenagement")
      .then((d) => setResumes(d.summaries))
      .catch((e) => setError(e.message));
  }, []);

  const zoom = (r: Resume) => {
    onVueReelle();
    map?.flyTo({ center: r.centre, zoom: 18, pitch: 40, bearing: 0, duration: 1200 });
  };

  // « Premiers pas » : demande de zoom sur la première parcelle
  useEffect(() => {
    if (zoomPremiere > 0 && resumes[0]) {
      zoom(resumes[0]);
      onParcelleVue();
    }
    // uniquement quand la demande change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomPremiere, resumes.length]);

  return (
    <div>
      <h2 className="text-base font-bold text-ink">
        Où construire sur une parcelle ?
        <HelpTip
          align="right"
          title="Conception assistée"
          text="Pour chaque parcelle, l'outil propose automatiquement où placer le bâtiment et le point de collecte des déchets, en respectant les retraits, les zones naturelles et le bâti existant. Vous pouvez accepter la proposition ou la modifier à la main."
        />
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Où placer un bâtiment et ses déchets sans enfreindre les règles ? L&apos;outil propose, <strong className="text-ink">vous décidez</strong>.
      </p>

      <ol className="mt-3 space-y-2" aria-label="Comment ça marche">
        {ETAPES.map(([titre, texte], n) => (
          <li key={titre} className="flex gap-2.5 text-sm leading-snug">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{n + 1}</span>
            <span className="text-muted"><strong className="text-ink">{titre}</strong> : {texte}</span>
          </li>
        ))}
      </ol>

      <details className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
        <summary className="label-caps cursor-pointer">Lire la carte (légende)</summary>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-body">
          {LEGENDE.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <i className={`h-2.5 w-2.5 shrink-0 ${l.couleur} ${l.forme}`} /> {l.label}
            </li>
          ))}
        </ul>
      </details>

      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}

      <div className="mt-3 space-y-3">
        {resumes.map((r) => (
          <article key={r.parcelle_id} data-testid={`parcelle-${r.parcelle_id}`} className="rounded-2xl border border-line bg-white p-3.5">
            <div className="flex flex-col gap-2.5">
              <div>
                <h3 className="font-semibold leading-tight text-ink">{r.nom}</h3>
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  <span className={`chip ring-1 ${verdict(r.indice_constructibilite).classes}`}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: couleurIcv(r.indice_constructibilite) }} />
                    {verdict(r.indice_constructibilite).label}
                  </span>
                  <span>aptitude {r.indice_constructibilite} / 100</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => { zoom(r); onParcelleVue(); }} className="btn btn-ghost btn-sm">
                  <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                  Voir sur la carte
                </button>
                {manuelId !== r.parcelle_id && (
                  <button onClick={() => { setManuelId(r.parcelle_id); onParcelleVue(); }} className="btn btn-good btn-sm">
                    <Hand className="h-3.5 w-3.5" aria-hidden="true" />
                    Modifier à la main
                  </button>
                )}
              </div>
            </div>

            {r.statut === "constructible" ? (
              <>
              <p className="mt-3 text-sm leading-relaxed text-body">
                <strong className="text-ink">Proposition :</strong> {phraseProposition(r)}
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <Tuile
                  label="Surface bâtie"
                  valeur={<>{r.emprise_m2} m² <span className="font-normal text-muted">({r.ces_pct} %)</span></>}
                  aide={<HelpTip align="right" title="Emprise" text="Surface au sol du bâtiment. Le plafond (40 % de la parcelle si l'indice ≥ 75, sinon 25 %) évite de trop imperméabiliser le terrain." />}
                />
                <Tuile label="Dimensions" valeur={<>{r.dimensions_m} m</>} />
                <Tuile label="Fondations" valeur={<span className="text-xs">{r.fondation}</span>} />
                <Tuile
                  label="Coût estimé"
                  valeur={fcfa(r.cout_total_estime_fcfa ?? 0)}
                  aide={<HelpTip align="right" title="Coût estimé" text="Fondations (selon la portance du sol) + drainage périphérique si le risque d'inondation n'est pas faible. Barèmes inventés pour la démonstration, à remplacer par des prix réels." />}
                />
              </div>
              </>
            ) : (
              <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900">
                Non constructible — la proposition automatique est un bassin de rétention de <strong>{r.bassin_volume_m3} m³</strong>
                <HelpTip align="right" title="Bassin de rétention" text="Quand le sol est trop faible ou trop inondable (indice < 40), l'outil propose de garder la parcelle comme réservoir d'eau de pluie plutôt que d'y construire." />
              </p>
            )}
            <details className="mt-2.5 text-xs text-muted">
              <summary className="cursor-pointer font-medium hover:text-ink">Pourquoi cette proposition ?</summary>
              <p className="mt-1.5 leading-relaxed">{r.justification}</p>
            </details>

            {manuelId === r.parcelle_id && <ManualEditor resume={r} map={map} onExit={() => setManuelId(null)} />}
          </article>
        ))}
      </div>
      <EtiquettesAmenagement map={map} actif={actif} masquerParcelle={manuelId} />
      <p className="mt-3 text-xs italic text-muted">Coûts indicatifs sur hypothèses inventées (données synthétiques).</p>
    </div>
  );
}
