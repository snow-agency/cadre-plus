"use client";

import { useEffect, useState } from "react";
import HelpTip from "../../components/HelpTip";
import { isAbort, postJson } from "../../lib/api";
import { fcfa, mfcfa } from "../../lib/format";
import type { PlanResponse, QuartierPlan } from "../../lib/types";

const ORIGINE_STYLE: Record<QuartierPlan["origine"], string> = {
  manuel: "bg-emerald-100 text-emerald-800",
  auto: "bg-sky-100 text-sky-800",
  aucun: "bg-gray-100 text-gray-600",
};
const ORIGINE_LABEL: Record<QuartierPlan["origine"], string> = {
  manuel: "Vous",
  auto: "Optimiseur",
  aucun: "Rien",
};

export default function InvestissementsPanel() {
  const [budget, setBudget] = useState(5000);
  const [equite, setEquite] = useState(0.5);
  const [completerAuto, setCompleterAuto] = useState(true);
  const [imposes, setImposes] = useState<Record<string, string[]>>({});
  const [data, setData] = useState<PlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avis, setAvis] = useState<string | null>(null);
  const [avisLoading, setAvisLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      postJson<PlanResponse>(
        "/api/investissements/plan",
        { budget_mfcfa: budget, equite, imposes, completer_auto: completerAuto },
        ctrl.signal,
      )
        .then((d) => {
          setData(d);
          setError(null);
        })
        .catch((e) => !isAbort(e) && setError(e.message));
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [budget, equite, completerAuto, imposes]);

  const basculer = (q: QuartierPlan) =>
    setImposes((cur) => {
      if (q.id in cur) {
        const { [q.id]: _retire, ...reste } = cur;
        return reste;
      }
      return { ...cur, [q.id]: q.leviers.map((l) => l.levier) };
    });

  const cocher = (id: string, levier: string, actif: boolean) =>
    setImposes((cur) => ({
      ...cur,
      [id]: actif ? [...(cur[id] ?? []), levier] : (cur[id] ?? []).filter((l) => l !== levier),
    }));

  const demanderAvis = async () => {
    if (!data) return;
    setAvisLoading(true);
    setAvis(null);
    try {
      const { answer } = await postJson<{ answer: string }>("/api/assistant/avis", {
        type: "investissements",
        payload: {
          mode: data.mode,
          budget_mfcfa: budget,
          equite,
          depasse_budget: data.depasse_budget,
          avertissements: data.avertissements,
          icv_moyen_avant: data.icv_moyen_avant,
          icv_moyen_apres: data.plan.icv_moyen_apres,
          ecart_vs_optimum_pct: data.ecart_vs_optimum_pct,
          amelioration_vs_strategie_naive_pct: data.amelioration_vs_naive_pct,
          quartiers: data.plan.quartiers.map((q) => ({
            nom: q.nom,
            population: q.population,
            decide_par: ORIGINE_LABEL[q.origine],
            leviers: q.leviers.map((l) => l.label),
            cout_mfcfa: Math.round(q.cout_fcfa / 1e6),
            economie_coordination_mfcfa: Math.round(q.economie_coordination_fcfa / 1e6),
            icv_avant: q.icv_avant,
            icv_apres: q.icv_apres,
          })),
        },
      });
      setAvis(answer);
    } catch (e) {
      setAvis(`Avis indisponible : ${e instanceof Error ? e.message : "erreur inconnue"}`);
    } finally {
      setAvisLoading(false);
    }
  };

  const leviers = data?.metadata.leviers ?? [];
  const economie = data?.plan.quartiers.reduce((s, q) => s + q.economie_coordination_fcfa, 0) ?? 0;
  const taux = data ? Math.min(100, (data.plan.cout_total_fcfa / data.budget_fcfa) * 100 || 0) : 0;

  return (
    <div className="text-sm">
      <div className="mb-1.5 font-semibold">
        Arbitrage des investissements
        <HelpTip
          align="right"
          title="Arbitrage des investissements"
          text="Répartit un budget entre les quartiers pour améliorer au maximum leur Indice de Cadre de Vie (ICV). L'optimiseur propose un plan ; vous pouvez imposer vos propres choix quartier par quartier."
        />
      </div>

      <label className="block text-xs">
        Budget : <strong>{budget.toLocaleString("fr-FR")} M FCFA</strong>
        <HelpTip title="Budget" text="Enveloppe totale en millions de FCFA que le plan ne peut pas dépasser." />
        <input type="range" min={0} max={30000} step={250} value={budget}
          onChange={(e) => setBudget(Number(e.target.value))} className="w-full" />
      </label>

      <label className="block text-xs">
        Équité : <strong>{equite.toFixed(1)}</strong>
        <HelpTip
          title="Équité"
          text="0 = on cherche le plus grand gain total pour la population (efficacité pure, favorise les quartiers très peuplés). 1 = les quartiers au plus faible ICV comptent jusqu'à 2,3 fois plus. C'est le curseur politique entre efficacité et équité."
        />
        <input type="range" min={0} max={1} step={0.1} value={equite}
          onChange={(e) => setEquite(Number(e.target.value))} className="w-full" />
      </label>

      <label className="mt-1 flex items-center text-xs">
        <input type="checkbox" checked={completerAuto} onChange={(e) => setCompleterAuto(e.target.checked)} />
        <span className="ml-1">Compléter automatiquement les quartiers que je n&apos;ai pas décidés</span>
        <HelpTip
          align="right"
          title="Compléter automatiquement"
          text="Coché : l'optimiseur répartit le budget restant sur les quartiers dont vous n'avez pas fixé les leviers. Décoché : seul ce que vous imposez est financé (mode 100 % manuel)."
        />
      </label>

      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}

      {data && (
        <>
          <div className="mt-2 rounded border border-gray-200 p-2 text-xs">
            <div className="flex items-center justify-between">
              <span>
                Mode : <strong>{data.mode}</strong>
                <HelpTip title="Mode" text="Automatique : tout est décidé par l'optimiseur. Mixte : vous avez imposé certains quartiers et l'optimiseur complète. Manuel : seul votre choix est financé." />
              </span>
              <button onClick={() => { setImposes({}); setCompleterAuto(true); setAvis(null); }}
                className="rounded border border-gray-400 px-2 py-0.5">Tout remettre en automatique</button>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded bg-gray-200">
              <div className={`h-2 ${data.depasse_budget ? "bg-red-600" : "bg-emerald-600"}`} style={{ width: `${taux}%` }} />
            </div>
            <p className="mt-1">
              Coût : <strong>{mfcfa(data.plan.cout_total_fcfa)}</strong> sur {mfcfa(data.budget_fcfa)} — reste{" "}
              <strong className={data.reste_budget_fcfa < 0 ? "text-red-700" : ""}>{mfcfa(data.reste_budget_fcfa)}</strong>
            </p>
            <p>
              ICV moyen (pondéré par la population) : {data.icv_moyen_avant} → <strong>{data.plan.icv_moyen_apres}</strong>
              <HelpTip align="right" title="ICV moyen" text="Moyenne de l'ICV des quartiers pondérée par leur population. Mesure l'amélioration globale du cadre de vie." />
            </p>
            {data.ecart_vs_optimum_pct !== null && data.reference_optimale && (
              <p>
                Écart avec l&apos;optimum automatique : <strong>{data.ecart_vs_optimum_pct}%</strong>
                <HelpTip align="right" title="Écart avec l'optimum" text="Compare la valeur de votre plan à celle du meilleur plan possible pour le même budget et la même équité. 0 % = vous avez fait aussi bien que l'optimiseur ; négatif = vous perdez de la valeur (mais vous avez peut-être de bonnes raisons politiques)." />
              </p>
            )}
            <p>
              Face à une stratégie naïve : {data.amelioration_vs_naive_pct !== null ? `${data.amelioration_vs_naive_pct > 0 ? "+" : ""}${data.amelioration_vs_naive_pct}%` : "—"}
              <HelpTip align="right" title="Stratégie naïve" text="Référence simple : financer les quartiers les plus défavorisés d'abord, levier par levier, jusqu'à épuisement du budget. Montre ce que l'optimisation apporte en plus du bon sens." />
            </p>
            <p>
              Économies de coordination des chantiers : <strong>{mfcfa(economie)}</strong>
              <HelpTip align="right" title="Coordination des chantiers" text="Quand drainage, électricité et eau sont réalisés ensemble dans un même quartier, on n'ouvre la voirie qu'une fois : 12 % d'économie sur ces trois postes." />
            </p>
            {data.avertissements.map((a) => (
              <p key={a} className="mt-1 text-amber-700">⚠ {a}</p>
            ))}
          </div>

          <ul className="mt-2 space-y-1.5">
            {data.plan.quartiers.map((q) => {
              const manuel = q.id in imposes;
              return (
                <li key={q.id} className="rounded border border-gray-200 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <strong>{q.nom}</strong>
                    <span className="flex items-center gap-1">
                      <span className={`rounded px-1.5 py-0.5 ${ORIGINE_STYLE[q.origine]}`}>{ORIGINE_LABEL[q.origine]}</span>
                      <button onClick={() => basculer(q)}
                        className={`rounded px-2 py-0.5 text-white ${manuel ? "bg-slate-700" : "bg-emerald-700"}`}>
                        {manuel ? "Laisser l'optimiseur" : "Décider moi-même"}
                      </button>
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {q.population.toLocaleString("fr-FR")} hab. — ICV {q.icv_avant} → <strong>{q.icv_apres}</strong> — {fcfa(q.cout_fcfa)}
                  </p>
                  {manuel ? (
                    <div className="mt-1 grid grid-cols-1 gap-0.5">
                      {leviers.map((l) => (
                        <label key={l.levier} className="flex items-center">
                          <input type="checkbox" checked={imposes[q.id]?.includes(l.levier) ?? false}
                            onChange={(e) => cocher(q.id, l.levier, e.target.checked)} />
                          <span className="ml-1">{l.label}{l.reseau ? " (réseau)" : ""}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    q.leviers.length > 0 && <p className="mt-0.5">{q.leviers.map((l) => l.label).join(" · ")}</p>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-2">
            <button onClick={demanderAvis} disabled={avisLoading}
              className="rounded bg-indigo-700 px-2 py-1 text-xs text-white disabled:opacity-50">
              {avisLoading ? "Analyse en cours…" : "Demander l'avis de l'IA sur ce plan"}
            </button>
            <HelpTip align="right" title="Avis de l'IA" text="Un assistant IA relit ce plan (équité entre quartiers, risques, ajustements possibles). Il conseille, la décision reste la vôtre. Données synthétiques : démonstration uniquement." />
            {avis && <p className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs">{avis}</p>}
          </div>
        </>
      )}
      <p className="mt-2 text-xs italic text-gray-500">Coûts et gains sur hypothèses inventées (données synthétiques).</p>
    </div>
  );
}
