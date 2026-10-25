"use client";

import { Calculator, CheckCircle2, Clock, Coins, DraftingCompass, Hand, Map, ShieldCheck, Sparkles } from "lucide-react";
import { couleurIcv } from "../../lib/couleurs";
import { useIcv } from "../../lib/useIcv";

function Icone({ Composant, classes }: { Composant: typeof Map; classes: string }) {
  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${classes}`}>
      <Composant className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

function BarresIcv() {
  const { quartiers, erreur } = useIcv();
  if (erreur) return <p className="mt-5 text-sm text-muted">Chiffres indisponibles pour l&apos;instant.</p>;
  if (!quartiers) {
    return (
      <div className="mt-5 space-y-2.5" aria-busy="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-4 animate-pulse rounded-full bg-slate-100" />
        ))}
      </div>
    );
  }
  const tries = [...quartiers].sort((a, b) => b.icv - a.icv);
  return (
    <ul className="mt-6 flex flex-1 flex-col justify-between gap-2.5" aria-label="Indice de cadre de vie par quartier">
      {tries.map((q) => (
        <li key={q.id} className="grid grid-cols-[10rem_1fr_2rem] items-center gap-3 text-sm">
          <span className="truncate font-medium text-ink">{q.nom_quartier}</span>
          <span className="h-3 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full" style={{ width: `${q.icv}%`, background: couleurIcv(q.icv) }} />
          </span>
          <span className="text-right font-mono text-xs text-muted">{Math.round(q.icv)}</span>
        </li>
      ))}
    </ul>
  );
}

function IllustrationParcelle() {
  return (
    <svg viewBox="0 0 320 170" className="mt-5 w-full" role="img" aria-label="Schéma d'une parcelle avec bâtiment, retraits et point de collecte des déchets">
      <rect x="40" y="14" width="240" height="142" rx="10" fill="#f8fafc" stroke="#0b2545" strokeWidth="2" />
      <rect x="52" y="52" width="216" height="92" rx="6" fill="#22c55e" fillOpacity="0.14" stroke="#16a34a" strokeDasharray="5 4" />
      <rect x="86" y="62" width="120" height="64" rx="5" fill="#2563eb" />
      <circle cx="240" cy="40" r="8" fill="#f59e0b" stroke="#fff" strokeWidth="2.5" />
      <path d="M164 14v38" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#fl)" markerStart="url(#fl)" />
      <text x="172" y="38" fontSize="11" fill="#475569" fontFamily="Inter, sans-serif">retrait 5 m</text>
      <text x="146" y="99" fontSize="12" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Inter, sans-serif">Bâtiment</text>
      <text x="252" y="26" fontSize="10" fill="#92400e" textAnchor="middle" fontFamily="Inter, sans-serif">déchets</text>
      <text x="160" y="166" fontSize="10" fill="#64748b" textAnchor="middle" fontFamily="Inter, sans-serif">voie d&apos;accès au nord</text>
      <defs>
        <marker id="fl" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 6 3 0 6z" fill="#64748b" />
        </marker>
      </defs>
    </svg>
  );
}

function IllustrationArbitrage() {
  return (
    <div className="mt-5 space-y-4" aria-hidden="true">
      {[
        { label: "Budget", valeur: "5 000 M FCFA", pct: 17 },
        { label: "Équité", valeur: "0,5", pct: 50 },
      ].map((s) => (
        <div key={s.label}>
          <div className="flex justify-between text-xs font-medium text-ink">
            <span>{s.label}</span>
            <span className="font-mono text-muted">{s.valeur}</span>
          </div>
          <div className="relative mt-2 h-1.5 rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${s.pct}%` }} />
            <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-600 bg-white shadow" style={{ left: `${s.pct}%` }} />
          </div>
        </div>
      ))}
      <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-xs font-semibold">
        {["Automatique", "Mixte", "Manuel"].map((m, i) => (
          <span key={m} className={`flex-1 rounded-full py-1.5 text-center ${i === 1 ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

const MODULES: { nom: string; etat: "demo" | "bientot" }[] = [
  { nom: "Indice de Cadre de Vie et inégalités", etat: "demo" },
  { nom: "Conception assistée", etat: "demo" },
  { nom: "Arbitrage des investissements", etat: "demo" },
  { nom: "Assistant IA", etat: "demo" },
  { nom: "Prospective 2050", etat: "bientot" },
  { nom: "Résilience et climat", etat: "bientot" },
  { nom: "Mobilité multimodale", etat: "bientot" },
  { nom: "Transition des quartiers", etat: "bientot" },
];

export default function Bento() {
  return (
    <section aria-labelledby="titre-bento" className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
      <div className="max-w-2xl">
        <p className="label-caps">Ce que fait Cadre+</p>
        <h2 id="titre-bento" className="mt-2 text-balance text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Trois questions, un seul outil, des décisions que l&apos;on peut justifier.
        </h2>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-6">
        <article className="card flex flex-col p-6 md:col-span-3 md:row-span-2">
          <Icone Composant={Map} classes="bg-emerald-50 text-emerald-700" />
          <h3 className="mt-4 text-xl font-bold text-ink">Diagnostiquer</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Une note de 0 à 100 par quartier, calculée à partir de huit critères visibles : accès à l&apos;école, à la santé, à l&apos;eau, électricité,
            drainage, déchets, espaces verts, inondation. Cliquez sur un quartier pour comprendre sa note.
          </p>
          <BarresIcv />
        </article>

        <article className="card p-6 md:col-span-3">
          <Icone Composant={DraftingCompass} classes="bg-brand-50 text-brand-700" />
          <h3 className="mt-4 text-xl font-bold text-ink">Aménager</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Où placer le bâtiment et le point de collecte des déchets sur une parcelle, en respectant retraits, zones naturelles et bâti existant. Le coût est estimé.
          </p>
          <IllustrationParcelle />
        </article>

        <article className="card p-6 md:col-span-3">
          <Icone Composant={Coins} classes="bg-amber-50 text-amber-700" />
          <h3 className="mt-4 text-xl font-bold text-ink">Arbitrer</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Répartir un budget entre quartiers pour gagner le plus de points d&apos;ICV, avec un curseur explicite entre efficacité et équité.
          </p>
          <IllustrationArbitrage />
        </article>

        <article className="relative overflow-hidden rounded-[var(--radius-card)] bg-brand-900 p-7 text-white shadow-card md:col-span-4">
          <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-600/40 blur-3xl" />
          <p className="label-caps !text-brand-200">Vous décidez, l&apos;IA conseille</p>
          <h3 className="relative mt-2 text-balance text-2xl font-bold">Chaque module propose, vous gardez la main.</h3>
          <ol className="relative mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { Icone: Calculator, titre: "L'optimiseur propose", texte: "Un plan ou un aménagement, calculé avec des règles vérifiables." },
              { Icone: Hand, titre: "Vous ajustez", texte: "Déplacez, imposez, refusez. Les contraintes sont revérifiées en direct." },
              { Icone: Sparkles, titre: "L'IA relit", texte: "Un avis d'ingénieur-conseil sur votre choix. Elle ne décide jamais." },
            ].map(({ Icone: I, titre, texte }, n) => (
              <li key={titre} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 font-mono text-xs">{n + 1}</span>
                  <I className="h-4 w-4 text-brand-200" aria-hidden="true" />
                </div>
                <p className="mt-2 font-semibold">{titre}</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-100">{texte}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="card p-6 md:col-span-2">
          <Icone Composant={ShieldCheck} classes="bg-violet-50 text-violet-700" />
          <h3 className="mt-4 text-lg font-bold text-ink">Transparent par construction</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Formules visibles, hypothèses de coût affichées, et un bandeau rappelle partout que les données sont synthétiques.
          </p>
        </article>

        <article className="card p-6 md:col-span-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-ink">Sept défis du ministère, sept modules</h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
                La démonstration couvre déjà le diagnostic, l&apos;aménagement, l&apos;arbitrage et l&apos;assistant. Les autres modules suivent le plan de phases du cahier des charges.
              </p>
            </div>
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m) => (
              <li key={m.nom} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-ink">
                {m.etat === "demo" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Disponible dans la démo" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-label="À venir" />
                )}
                <span className={m.etat === "demo" ? "" : "text-muted"}>{m.nom}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
