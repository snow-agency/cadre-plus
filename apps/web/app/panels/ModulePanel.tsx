"use client";

import * as maplibregl from "maplibre-gl";
import { Activity, Coins, DraftingCompass } from "lucide-react";
import DiagnosticPanel, { type Onglet } from "../../components/DiagnosticPanel";
import type { Quartier } from "../../lib/types";
import AmenagementPanel from "./AmenagementPanel";
import InvestissementsPanel from "./InvestissementsPanel";

const TABS: { id: Onglet; label: string; Icone: typeof Activity }[] = [
  { id: "diagnostic", label: "Diagnostic", Icone: Activity },
  { id: "amenagement", label: "Aménager", Icone: DraftingCompass },
  { id: "budget", label: "Budget", Icone: Coins },
];

export default function ModulePanel({
  map,
  onglet,
  onOnglet,
  quartiers,
  selection,
  onSelectQuartier,
  zoomParcelle,
  onParcelleVue,
  onBudgetUtilise,
}: {
  map: maplibregl.Map | null;
  onglet: Onglet;
  onOnglet: (o: Onglet) => void;
  quartiers: Quartier[];
  selection: string | null;
  onSelectQuartier: (id: string) => void;
  zoomParcelle: number;
  onParcelleVue: () => void;
  onBudgetUtilise: () => void;
}) {
  return (
    <div className="glass absolute right-3 top-3 z-10 flex max-h-[calc(100%-11rem)] w-[26rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden">
      <div role="tablist" aria-label="Étapes" className="m-3 mb-0 flex gap-1 rounded-full bg-slate-100 p-1">
        {TABS.map(({ id, label, Icone }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={onglet === id}
            aria-controls={`panel-${id}`}
            onClick={() => onOnglet(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
              onglet === id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            <Icone className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div className="no-scrollbar fade-bottom overflow-auto p-4 pb-8">
        <div role="tabpanel" id="panel-diagnostic" aria-labelledby="tab-diagnostic" hidden={onglet !== "diagnostic"}>
          <DiagnosticPanel quartiers={quartiers} selection={selection} onSelect={onSelectQuartier} onAller={onOnglet} />
        </div>
        <div role="tabpanel" id="panel-amenagement" aria-labelledby="tab-amenagement" hidden={onglet !== "amenagement"}>
          <AmenagementPanel map={map} zoomPremiere={zoomParcelle} onParcelleVue={onParcelleVue} />
        </div>
        <div role="tabpanel" id="panel-budget" aria-labelledby="tab-budget" hidden={onglet !== "budget"}>
          <InvestissementsPanel onUtilise={onBudgetUtilise} />
        </div>
      </div>
    </div>
  );
}
