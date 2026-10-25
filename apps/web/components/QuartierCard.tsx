"use client";

import { X } from "lucide-react";
import { couleurIcv, couleurIcvTexte, niveauIcv } from "../lib/couleurs";
import type { Quartier } from "../lib/types";
import HelpTip from "./HelpTip";

const CRITERES: Record<string, { label: string; poids: number }> = {
  ecole: { label: "Accès à l'école", poids: 15 },
  sante: { label: "Accès à la santé", poids: 15 },
  eau: { label: "Accès à l'eau potable", poids: 15 },
  electrification: { label: "Électrification", poids: 15 },
  drainage: { label: "Drainage", poids: 15 },
  dechets: { label: "Collecte des déchets", poids: 10 },
  espaces_verts: { label: "Espaces verts", poids: 10 },
  inondation: { label: "Protection inondation", poids: 5 },
};

export default function QuartierCard({ quartier, onClose }: { quartier: Quartier; onClose: () => void }) {
  const niveau = niveauIcv(quartier.icv);
  const criteres = Object.entries(quartier.sous_scores_normalises_0_100)
    .filter(([cle]) => cle in CRITERES)
    .sort((a, b) => a[1] - b[1]);
  const faibles = criteres.slice(0, 2).map(([cle]) => CRITERES[cle].label.toLowerCase());

  return (
    <section className="glass pointer-events-auto p-4" aria-label={`Détail du quartier ${quartier.nom_quartier}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="label-caps">Quartier</p>
          <h2 className="text-lg font-bold leading-tight text-ink">{quartier.nom_quartier}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer le détail du quartier"
          className="rounded-full p-1.5 text-muted hover:bg-brand-50 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-end gap-3">
        <p className="leading-none">
          <span className="text-5xl font-extrabold tracking-tight text-ink" style={{ color: couleurIcvTexte(quartier.icv) }}>
            {Math.round(quartier.icv)}
          </span>
          <span className="ml-1 text-sm font-medium text-muted">/ 100</span>
        </p>
        <span className={`chip ring-1 ${niveau.classes}`}>{niveau.label}</span>
      </div>
      <p className="mt-1 text-xs text-muted">{quartier.population.toLocaleString("fr-FR")} habitants (valeur synthétique)</p>

      <div className="mt-4 flex items-center justify-between">
        <p className="label-caps">Pourquoi cette note</p>
        <HelpTip
          align="right"
          title="Lecture des barres"
          text="Chaque barre est le sous-score (0 à 100) d'un critère de l'ICV, du plus faible au plus fort. Le poids indique son importance dans la note finale."
        />
      </div>
      <ul className="mt-2 space-y-2">
        {criteres.map(([cle, valeur]) => (
          <li key={cle}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-ink">{CRITERES[cle].label}</span>
              <span className="whitespace-nowrap font-mono text-muted">
                {Math.round(valeur)} <span className="opacity-60">· poids {CRITERES[cle].poids} %</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${valeur}%`, background: couleurIcv(valeur) }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs leading-relaxed text-ink">
        Points faibles : <strong>{faibles.join(" et ")}</strong>. C&apos;est là que les investissements pèsent le plus sur la note.
      </p>
    </section>
  );
}
