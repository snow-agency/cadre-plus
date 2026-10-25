import Link from "next/link";
import { ArrowRight, BookOpen, Check, Sparkles } from "lucide-react";

const POINTS = [
  "7 défis du ministère couverts",
  "Automatique, mixte ou manuel",
  "Chaque chiffre synthétique est étiqueté",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 [background-image:radial-gradient(rgb(11_37_69/0.13)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_72%)]"
      />
      <div className="mx-auto max-w-5xl px-6 pb-14 pt-12 text-center sm:pt-20">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/85 px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Démonstration sur données synthétiques · Abomey-Calavi
        </p>
        <h1 className="mt-6 text-balance text-5xl font-extrabold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-7xl">
          Décidez du cadre de vie
          <br className="hidden sm:block" />{" "}
          <span className="bg-gradient-to-r from-brand-600 to-sky-400 bg-clip-text text-transparent">avant de construire.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted">
          Cadre+ est le jumeau numérique qui aide l&apos;État à diagnostiquer les inégalités, aménager une parcelle et arbitrer un
          budget. Un optimiseur et une IA proposent ; vous décidez.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/app" className="btn btn-primary h-12 px-6 text-base">
            Ouvrir la démo <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/guide" className="btn btn-ghost h-12 px-6 text-base">
            <BookOpen className="h-4 w-4" aria-hidden="true" /> Lire le mode d&apos;emploi
          </Link>
        </div>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-body">
          {POINTS.map((p) => (
            <li key={p} className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
