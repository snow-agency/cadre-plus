"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Compass, FlaskConical } from "lucide-react";
import Logo from "./Logo";

const LIENS = [
  { href: "/", label: "Accueil" },
  { href: "/app", label: "Application" },
  { href: "/guide", label: "Mode d'emploi" },
];

export default function SiteHeader({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  return (
    <header
      className={`z-30 flex items-center justify-between gap-4 px-4 sm:px-6 ${
        compact ? "h-14 border-b border-line bg-white/90 backdrop-blur" : "h-[72px]"
      }`}
    >
      <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Cadre+ — accueil">
        <Logo />
        <span className="text-lg font-bold tracking-tight text-ink">Cadre+</span>
      </Link>

      <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
        {LIENS.map((l) => {
          const actif = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={actif ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                actif ? "bg-brand-50 text-brand-700" : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <span
          className="chip hidden bg-amber-50 text-amber-800 ring-1 ring-amber-200 sm:inline-flex"
          title="Toutes les données affichées sont inventées pour la démonstration"
        >
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          Données synthétiques
        </span>
        {pathname === "/app" && (
          <button
            onClick={() => window.dispatchEvent(new Event("cadre:visite"))}
            className="btn btn-ghost btn-sm sm:px-4 sm:py-2 sm:text-sm"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            Visite guidée
          </button>
        )}
        {pathname !== "/app" && (
          <Link href="/app" className="btn btn-primary btn-sm sm:px-4 sm:py-2 sm:text-sm">
            Ouvrir la démo <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </header>
  );
}
