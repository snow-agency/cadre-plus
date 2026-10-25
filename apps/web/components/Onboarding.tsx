"use client";

import { useEffect, useRef } from "react";
import { Check, Coins, DraftingCompass, MapPinned, X } from "lucide-react";
import type { Etape } from "../lib/onboarding";
import Logo from "./Logo";

const ETAPES: { id: Etape; Icone: typeof MapPinned; titre: string; texte: string; action: string }[] = [
  {
    id: "quartier",
    Icone: MapPinned,
    titre: "Repérer les quartiers en difficulté",
    texte: "Chaque quartier a une note de 0 à 100. Cliquez sur l'un d'eux pour comprendre pourquoi.",
    action: "Voir un quartier",
  },
  {
    id: "parcelle",
    Icone: DraftingCompass,
    titre: "Aménager une parcelle",
    texte: "Testez où placer un bâtiment. L'outil propose, vous corrigez, il vérifie les règles.",
    action: "Voir une parcelle",
  },
  {
    id: "budget",
    Icone: Coins,
    titre: "Répartir un budget",
    texte: "Choisissez une enveloppe, voyez où l'investir et ce que cela change.",
    action: "Ouvrir le budget",
  },
];

export function AccueilModal({ ouvert, onClose }: { ouvert: boolean; onClose: (commencer: boolean) => void }) {
  const bouton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    bouton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ouvert, onClose]);

  if (!ouvert) return null;
  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-accueil"
        className="card max-h-full w-full max-w-xl overflow-y-auto p-6 no-scrollbar sm:p-8"
      >
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div>
            <p className="label-caps">Démonstration</p>
            <h2 id="titre-accueil" className="text-2xl font-extrabold tracking-tight text-ink">
              Bienvenue sur Cadre+
            </h2>
          </div>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-body">
          Cadre+ montre <strong>où le cadre de vie va le moins bien</strong> à Abomey-Calavi, vous aide à{" "}
          <strong>aménager une parcelle</strong> et à <strong>répartir un budget</strong>. Les chiffres sont inventés : c&apos;est une
          démonstration.
        </p>
        <ol className="mt-5 space-y-3">
          {ETAPES.map(({ id, Icone, titre, texte }, n) => (
            <li key={id} className="flex gap-3 rounded-2xl bg-slate-50 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <Icone className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-ink">
                  <span className="mr-1.5 font-mono text-xs text-muted">{n + 1}.</span>
                  {titre}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{texte}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button ref={bouton} onClick={() => onClose(true)} className="btn btn-primary h-11 px-6 text-base">
            Commencer (2 minutes)
          </button>
          <button onClick={() => onClose(false)} className="btn btn-ghost h-11 px-5 text-base">
            Explorer librement
          </button>
        </div>
        <p className="mt-4 text-xs text-muted">
          Vous pouvez relancer cette visite à tout moment avec le bouton « Visite guidée » en haut de l&apos;écran.
        </p>
      </section>
    </div>
  );
}

export function PremiersPas({
  fait,
  masque,
  onMasquer,
  onAction,
}: {
  fait: Record<Etape, boolean>;
  masque: boolean;
  onMasquer: () => void;
  onAction: (e: Etape) => void;
}) {
  if (masque) return null;
  const nombre = ETAPES.filter((e) => fait[e.id]).length;
  const termine = nombre === ETAPES.length;

  return (
    <section
      aria-label="Premiers pas"
      className="glass absolute bottom-3 left-[19.5rem] right-[27.5rem] z-10 max-w-[44rem] min-w-[20rem] p-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink">
          {termine ? "Bravo, vous avez fait le tour !" : "Premiers pas"}{" "}
          <span className="ml-1 font-mono text-xs font-medium text-muted">{nombre}/3</span>
        </p>
        <button onClick={onMasquer} aria-label="Masquer les premiers pas" className="rounded-full p-1 text-muted hover:bg-brand-50 hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ol className="mt-2.5 grid gap-2 sm:grid-cols-3">
        {ETAPES.map(({ id, titre, action }) => (
          <li key={id}>
            <button
              onClick={() => onAction(id)}
              className={`flex h-full w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-xs transition ${
                fait[id] ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-line bg-white hover:border-brand-200 hover:bg-brand-50"
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  fait[id] ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                }`}
                aria-hidden="true"
              >
                {fait[id] && <Check className="h-3 w-3" />}
              </span>
              <span>
                <span className="block font-semibold text-ink">{titre}</span>
                <span className="mt-0.5 block text-brand-700">{fait[id] ? "Fait · revoir" : `${action} →`}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
