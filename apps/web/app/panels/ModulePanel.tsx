"use client";

import { useState } from "react";
import * as maplibregl from "maplibre-gl";
import AmenagementPanel from "./AmenagementPanel";
import InvestissementsPanel from "./InvestissementsPanel";

const TABS = [
  { id: "amenagement", label: "Conception assistée" },
  { id: "investissements", label: "Investissements" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ModulePanel({ map }: { map: maplibregl.Map | null }) {
  const [tab, setTab] = useState<TabId>("amenagement");

  return (
    <div className="absolute right-2.5 top-28 z-10 flex max-h-[calc(100vh-8rem)] w-[26rem] max-w-[calc(100vw-1.5rem)] flex-col rounded-lg bg-white shadow-lg">
      <div role="tablist" aria-label="Modules" className="flex border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium ${
              tab === t.id ? "border-b-2 border-slate-800 text-slate-900" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="overflow-auto p-3">
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
