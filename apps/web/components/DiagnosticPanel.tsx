"use client";

import { ArrowRight, Coins, DraftingCompass } from "lucide-react";
import { couleurIcv, couleurIcvTexte } from "../lib/couleurs";
import type { Quartier } from "../lib/types";
import HelpTip from "./HelpTip";

export type Onglet = "diagnostic" | "amenagement" | "budget";

export default function DiagnosticPanel({
  quartiers,
  selection,
  onSelect,
  onAller,
}: {
  quartiers: Quartier[];
  selection: string | null;
  onSelect: (id: string) => void;
  onAller: (o: Onglet) => void;
}) {
  const tries = [...quartiers].sort((a, b) => a.icv - b.icv);
  const population = quartiers.reduce((s, q) => s + q.population, 0);
  const moyenne = population ? quartiers.reduce((s, q) => s + q.icv * q.population, 0) / population : 0;
  const aAmeliorer = quartiers.filter((q) => q.icv < 45).length;

  return (
    <div>
      <h2 className="text-base font-bold text-ink">
        Où le cadre de vie va-t-il le moins bien ?
        <HelpTip
          align="right"
          title="L'ICV, c'est quoi ?"
          text="L'Indice de Cadre de Vie est une note de 0 à 100 par quartier. Elle combine huit critères : accès à l'école, à la santé et à l'eau, électricité, drainage, déchets, espaces verts, risque d'inondation. Plus c'est haut, mieux c'est."
        />
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Chaque quartier a une note de 0 à 100. <strong className="text-ink">Cliquez sur un quartier</strong>, ici ou sur la carte, pour comprendre
        pourquoi sa note est basse ou haute.
      </p>

      {quartiers.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="label-caps">Note moyenne</p>
            <p className="mt-0.5 text-lg font-extrabold text-ink">
              {moyenne.toFixed(1)} <span className="text-xs font-medium text-muted">/ 100</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="label-caps">À améliorer</p>
            <p className="mt-0.5 text-lg font-extrabold text-ink">
              {aAmeliorer} <span className="text-xs font-medium text-muted">quartiers sur {quartiers.length}</span>
            </p>
          </div>
        </div>
      )}

      <p className="label-caps mt-4">Du plus en difficulté au mieux doté</p>
      <ul className="mt-2 space-y-1.5" aria-label="Quartiers classés par note">
        {tries.map((q) => (
          <li key={q.id}>
            <button
              onClick={() => onSelect(q.id)}
              aria-pressed={selection === q.id}
              className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2 text-left transition ${
                selection === q.id ? "border-brand-600 bg-brand-50" : "border-line bg-white hover:border-brand-200 hover:bg-brand-50/60"
              }`}
            >
              <span className="text-sm font-semibold text-ink">{q.nom_quartier}</span>
              <span className="font-mono text-sm font-semibold" style={{ color: couleurIcvTexte(q.icv) }}>
                {Math.round(q.icv)}
              </span>
              <span className="col-span-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full" style={{ width: `${q.icv}%`, background: couleurIcv(q.icv) }} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl bg-brand-900 p-4 text-white">
        <p className="text-sm font-bold">Et ensuite ?</p>
        <p className="mt-1 text-xs leading-relaxed text-brand-100">Une fois les quartiers repérés, deux questions se posent.</p>
        <div className="mt-3 grid gap-2">
          <button onClick={() => onAller("amenagement")} className="btn bg-white text-brand-900 hover:bg-brand-50 !justify-between">
            <span className="flex items-center gap-2"><DraftingCompass className="h-4 w-4" aria-hidden="true" />Où construire sur une parcelle ?</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button onClick={() => onAller("budget")} className="btn bg-white text-brand-900 hover:bg-brand-50 !justify-between">
            <span className="flex items-center gap-2"><Coins className="h-4 w-4" aria-hidden="true" />Où investir un budget ?</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
