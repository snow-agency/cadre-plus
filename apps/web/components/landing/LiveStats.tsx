"use client";

import { useIcv } from "../../lib/useIcv";

function Tuile({ valeur, unite, legende }: { valeur: string; unite?: string; legende: string }) {
  return (
    <div className="card p-5">
      <p className="text-4xl font-extrabold tracking-tight text-ink">
        {valeur}
        {unite && <span className="ml-1 text-base font-medium text-muted">{unite}</span>}
      </p>
      <p className="mt-1.5 text-sm text-muted">{legende}</p>
    </div>
  );
}

export default function LiveStats() {
  const { quartiers, erreur } = useIcv();

  if (erreur) {
    return (
      <p role="status" className="card mx-auto max-w-2xl p-5 text-center text-sm text-muted">
        La démonstration en ligne est en train de se réveiller. Ouvrez l&apos;application dans un instant : les chiffres s&apos;afficheront.
      </p>
    );
  }
  if (!quartiers) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Chargement des chiffres">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-[108px] animate-pulse bg-slate-100/70" />
        ))}
      </div>
    );
  }

  const population = quartiers.reduce((s, q) => s + q.population, 0);
  const moyenne = quartiers.reduce((s, q) => s + q.icv * q.population, 0) / population;
  const sous50 = quartiers.filter((q) => q.icv < 50).length;
  const icvs = quartiers.map((q) => q.icv);
  const ecart = Math.max(...icvs) - Math.min(...icvs);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tuile valeur={moyenne.toFixed(1)} unite="/ 100" legende="ICV moyen, pondéré par la population" />
      <Tuile valeur={`${sous50} / ${quartiers.length}`} legende="quartiers au cadre de vie dégradé (ICV sous 50)" />
      <Tuile valeur={ecart.toFixed(0)} unite="points" legende="d'écart entre le meilleur et le moins bien doté" />
      <Tuile valeur={population.toLocaleString("fr-FR")} legende="habitants couverts (données synthétiques)" />
    </div>
  );
}
