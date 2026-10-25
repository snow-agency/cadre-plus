"use client";

import { useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Coins, DraftingCompass } from "lucide-react";
import AmenagementPanel from "./AmenagementPanel";
import InvestissementsPanel from "./InvestissementsPanel";

const TABS = [
  { id: "amenagement", label: "Conception assistée", Icone: DraftingCompass },
  { id: "investissements", label: "Investissements", Icone: Coins },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ModulePanel({ map }: { map: maplibregl.Map | null }) {
  const [tab, setTab] = useState<TabId>("amenagement");

  return (
    <div className="glass absolute right-3 top-3 z-10 flex max-h-[calc(100%-9.5rem)] w-[26rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden">
      <div role="tablist" aria-label="Modules" className="m-3 mb-0 flex gap-1 rounded-full bg-slate-100 p-1">
        {TABS.map(({ id, label, Icone }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
              tab === id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            <Icone className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-auto p-4">
        <div role="tabpanel" id="panel-amenagement" aria-labelledby="tab-amenagement" hidden={tab !== "amenagement"}>
          <AmenagementPanel map={map} />
        </div>
        <div role="tabpanel" id="panel-investissements" aria-labelledby="tab-investissements" hidden={tab !== "investissements"}>
          <InvestissementsPanel />
        </div>
      </div>
    </div>
  );
}
