import Link from "next/link";
import Logo from "./Logo";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="text-base font-bold text-ink">Cadre+</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Le jumeau numérique du cadre de vie : diagnostiquer, aménager, arbitrer — et décider en connaissance de cause.
          </p>
        </div>
        <nav aria-label="Pied de page" className="flex gap-10 text-sm">
          <div className="flex flex-col gap-2">
            <span className="label-caps">Produit</span>
            <Link href="/app" className="text-body hover:text-brand-700">Application</Link>
            <Link href="/guide" className="text-body hover:text-brand-700">Mode d&apos;emploi</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="label-caps">Transparence</span>
            <span className="max-w-[16rem] text-muted">
              Données synthétiques de démonstration. Fond de carte © contributeurs OpenStreetMap, © CARTO.
            </span>
          </div>
        </nav>
      </div>
    </footer>
  );
}
