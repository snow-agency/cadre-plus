import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default function CtaFinal() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6" aria-labelledby="titre-cta">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-900 px-6 py-14 text-center text-white shadow-pop sm:px-12">
        <div aria-hidden="true" className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand-600/50 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-sky-400/30 blur-3xl" />
        <div className="relative">
          <h2 id="titre-cta" className="mx-auto max-w-2xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Essayez-le sur Abomey-Calavi, en deux minutes.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-brand-100">
            Cliquez sur un quartier, déplacez un bâtiment sur une parcelle, répartissez un budget. Tout est vérifié en direct, et l&apos;IA relit vos choix.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/app" className="btn h-12 bg-white px-6 text-base text-brand-900 hover:bg-brand-50">
              Ouvrir la démo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/guide" className="btn h-12 border border-white/30 px-6 text-base text-white hover:bg-white/10">
              <BookOpen className="h-4 w-4" aria-hidden="true" /> Mode d&apos;emploi
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
