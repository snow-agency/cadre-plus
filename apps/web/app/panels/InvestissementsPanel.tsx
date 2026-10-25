"use client";

import { useEffect, useId, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import HelpTip from "../../components/HelpTip";
import { isAbort, postJson } from "../../lib/api";
import { couleurIcvTexte } from "../../lib/couleurs";
import { fcfa, mfcfa } from "../../lib/format";
import type { PlanResponse, QuartierPlan } from "../../lib/types";

const ORIGINE_STYLE: Record<QuartierPlan["origine"], string> = {
  manuel: "bg-emerald-100 text-emerald-800",
  auto: "bg-brand-100 text-brand-700",
  aucun: "bg-slate-100 text-slate-600",
};
const ORIGINE_LABEL: Record<QuartierPlan["origine"], string> = {
  manuel: "Vous",
  auto: "Optimiseur",
  aucun: "Rien",
};

export default function InvestissementsPanel({ onUtilise }: { onUtilise: () => void }) {
  const idBudget = useId();
  const idEquite = useId();
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

  const basculer = (q: QuartierPlan) => {
    onUtilise();
    setImposes((cur) => {
      if (q.id in cur) {
        const { [q.id]: _retire, ...reste } = cur;
        return reste;
      }
      return { ...cur, [q.id]: q.leviers.map((l) => l.levier) };
    });
  };

  const cocher = (id: string, levier: string, actif: boolean) => {
    onUtilise();
    setImposes((cur) => ({
      ...cur,
      [id]: actif ? [...(cur[id] ?? []), levier] : (cur[id] ?? []).filter((l) => l !== levier),
    }));
  };

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
    <div>
      <h2 className="text-base font-bold text-ink">
        Où investir un budget ?
        <HelpTip
          align="right"
          title="Arbitrage des investissements"
          text="Répartit un budget entre les quartiers pour améliorer au maximum leur Indice de Cadre de Vie (ICV). L'optimiseur propose un plan ; vous pouvez imposer vos propres choix quartier par quartier."
        />
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Choisissez une enveloppe : l&apos;outil répartit l&apos;argent entre les quartiers pour <strong className="text-ink">gagner le plus de points de note</strong>.
        Vous pouvez aussi décider vous-même pour un quartier, l&apos;outil complète le reste.
      </p>

      <div className="mt-3 space-y-3 rounded-2xl bg-slate-50 p-3">
        <div className="text-xs font-medium text-ink">
          <div className="flex items-center justify-between">
            <span>
              <label htmlFor={idBudget}>Budget</label>
              <HelpTip title="Budget" text="Enveloppe totale en millions de FCFA que le plan ne peut pas dépasser." />
            </span>
            <strong className="text-sm">{budget.toLocaleString("fr-FR")} M FCFA</strong>
          </div>
          <input id={idBudget} type="range" min={0} max={30000} step={250} value={budget}
            onChange={(e) => { setBudget(Number(e.target.value)); onUtilise(); }} className="mt-1 w-full accent-brand-600" />
        </div>

        <div className="text-xs font-medium text-ink">
          <div className="flex items-center justify-between">
            <span>
              <label htmlFor={idEquite}>Équité</label>
              <HelpTip
                title="Équité"
                text="0 = on cherche le plus grand gain total pour la population (efficacité pure, favorise les quartiers très peuplés). 1 = les quartiers au plus faible ICV comptent jusqu'à 2,3 fois plus. C'est le curseur politique entre efficacité et équité."
              />
            </span>
            <strong className="text-sm">{equite.toFixed(1)}</strong>
          </div>
          <input id={idEquite} type="range" min={0} max={1} step={0.1} value={equite}
            onChange={(e) => { setEquite(Number(e.target.value)); onUtilise(); }} className="mt-1 w-full accent-brand-600" />
          <span className="flex justify-between text-[11px] font-normal text-muted"><span>Plus de gain total</span><span>Plus d&apos;aide aux quartiers en difficulté</span></span>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-ink">
          <input type="checkbox" checked={completerAuto} onChange={(e) => { const v = e.target.checked; setCompleterAuto(v); onUtilise(); }}
            className="h-4 w-4 accent-brand-600" />
          <span>Compléter automatiquement les quartiers que je n&apos;ai pas décidés</span>
          <HelpTip
            align="right"
            title="Compléter automatiquement"
            text="Coché : l'optimiseur répartit le budget restant sur les quartiers dont vous n'avez pas fixé les leviers. Décoché : seul ce que vous imposez est financé (mode 100 % manuel)."
          />
        </label>
      </div>

      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}

      {data && (
        <>
          <div className="mt-3 rounded-2xl border border-line p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span>
                Mode : <strong className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700">{data.mode}</strong>
                <HelpTip title="Mode" text="Automatique : tout est décidé par l'optimiseur. Mixte : vous avez imposé certains quartiers et l'optimiseur complète. Manuel : seul votre choix est financé." />
              </span>
              <button onClick={() => { setImposes({}); setCompleterAuto(true); setAvis(null); onUtilise(); }} className="btn btn-ghost btn-sm">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Tout remettre en automatique
              </button>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <div className={`h-full rounded-full transition-all ${data.depasse_budget ? "bg-red-600" : "bg-brand-600"}`} style={{ width: `${taux}%` }} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              Avec <strong>{budget.toLocaleString("fr-FR")} M FCFA</strong>, la note moyenne des quartiers passe de{" "}
              <strong>{data.icv_moyen_avant}</strong> à{" "}
              <strong style={{ color: couleurIcvTexte(data.plan.icv_moyen_apres) }}>{data.plan.icv_moyen_apres}</strong>.
            </p>
            <p className="mt-2">
              Coût : <strong className="text-sm text-ink">{mfcfa(data.plan.cout_total_fcfa)}</strong> sur {mfcfa(data.budget_fcfa)} — reste{" "}
              <strong className={data.reste_budget_fcfa < 0 ? "text-red-700" : "text-ink"}>{mfcfa(data.reste_budget_fcfa)}</strong>
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="label-caps flex items-center">ICV moyen
                  <HelpTip align="right" title="ICV moyen" text="Moyenne de l'ICV des quartiers pondérée par leur population. Mesure l'amélioration globale du cadre de vie." />
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {data.icv_moyen_avant} → <span style={{ color: couleurIcvTexte(data.plan.icv_moyen_apres) }}>{data.plan.icv_moyen_apres}</span>
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="label-caps flex items-center">Coordination
                  <HelpTip align="right" title="Coordination des chantiers" text="Quand drainage, électricité et eau sont réalisés ensemble dans un même quartier, on n'ouvre la voirie qu'une fois : 12 % d'économie sur ces trois postes." />
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  <span className="sr-only">Économies de coordination des chantiers : </span>{mfcfa(economie)}
                </p>
              </div>
              {data.ecart_vs_optimum_pct !== null && data.reference_optimale && (
                <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2">
                  <p>
                    Écart avec l&apos;optimum automatique : <strong className="text-ink">{data.ecart_vs_optimum_pct}%</strong>
                    <HelpTip align="right" title="Écart avec l'optimum" text="Compare la valeur de votre plan à celle du meilleur plan possible pour le même budget et la même équité. 0 % = vous avez fait aussi bien que l'optimiseur ; négatif = vous perdez de la valeur (mais vous avez peut-être de bonnes raisons politiques)." />
                  </p>
                </div>
              )}
              <details className="col-span-2 rounded-xl bg-slate-50 px-3 py-2">
                <summary className="cursor-pointer font-medium text-muted hover:text-ink">Comparer à une méthode simple</summary>
                <p className="mt-1.5">
                  Face à une stratégie naïve : <strong className="text-ink">{data.amelioration_vs_naive_pct !== null ? `${data.amelioration_vs_naive_pct > 0 ? "+" : ""}${data.amelioration_vs_naive_pct}%` : "—"}</strong>
                  <HelpTip align="right" title="Stratégie naïve" text="Référence simple : financer les quartiers les plus défavorisés d'abord, levier par levier, jusqu'à épuisement du budget. Montre ce que l'optimisation apporte en plus du bon sens." />
                </p>
              </details>
            </div>

            {data.avertissements.map((a) => (
              <p key={a} className="mt-2 text-amber-700">⚠ {a}</p>
            ))}
          </div>

          <ul className="mt-3 space-y-2">
            {data.plan.quartiers.map((q) => {
              const manuel = q.id in imposes;
              return (
                <li key={q.id} className="rounded-2xl border border-line bg-white p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-ink">{q.nom}</strong>
                    <span className="flex items-center gap-1.5">
                      <span className={`chip ${ORIGINE_STYLE[q.origine]}`}>{ORIGINE_LABEL[q.origine]}</span>
                      <button onClick={() => basculer(q)} className={`btn btn-sm ${manuel ? "btn-dark" : "btn-good"}`}>
                        {manuel ? "Laisser l'optimiseur" : "Décider moi-même"}
                      </button>
                    </span>
                  </div>
                  <p className="mt-1 text-muted">
                    {q.population.toLocaleString("fr-FR")} hab. — ICV {q.icv_avant} →{" "}
                    <strong style={{ color: couleurIcvTexte(q.icv_apres) }}>{q.icv_apres}</strong> — {fcfa(q.cout_fcfa)}
                  </p>
                  {manuel ? (
                    <div className="mt-2 grid grid-cols-1 gap-1 rounded-xl bg-slate-50 p-2">
                      {leviers.map((l) => (
                        <label key={l.levier} className="flex items-center gap-2 text-ink">
                          <input type="checkbox" checked={imposes[q.id]?.includes(l.levier) ?? false}
                            onChange={(e) => cocher(q.id, l.levier, e.target.checked)} className="h-3.5 w-3.5 accent-brand-600" />
                          <span>{l.label}{l.reseau ? " (réseau)" : ""}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    q.leviers.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-1">
                        {q.leviers.map((l) => (
                          <span key={l.levier} className="chip !font-medium">{l.label}</span>
                        ))}
                      </p>
                    )
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-3">
            <button onClick={demanderAvis} disabled={avisLoading} className="btn btn-ai btn-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {avisLoading ? "Analyse en cours…" : "Demander l'avis de l'IA sur ce plan"}
            </button>
            <HelpTip align="right" title="Avis de l'IA" text="Un assistant IA relit ce plan (équité entre quartiers, risques, ajustements possibles). Il conseille, la décision reste la vôtre. Données synthétiques : démonstration uniquement." />
            {avis && <p className="mt-2 whitespace-pre-wrap rounded-xl bg-ai-50 px-3 py-2.5 text-xs text-ink">{avis}</p>}
          </div>
        </>
      )}
      <p className="mt-3 text-xs italic text-muted">Coûts et gains sur hypothèses inventées (données synthétiques).</p>
    </div>
  );
}
