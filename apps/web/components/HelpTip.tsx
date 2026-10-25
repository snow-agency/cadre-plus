"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  text: React.ReactNode;
  title?: string;
  align?: "left" | "right";
};

const LARGEUR = 272;
const MARGE = 8;

// Petit « ? » d'aide. La bulle est rendue dans <body>, en position fixe : elle n'est donc jamais
// coupée par un panneau qui défile, ne déclenche pas le libellé qui contient le « ? », et ne
// bloque pas la souris.
export default function HelpTip({ text, title, align = "left" }: Props) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const id = useId();
  const bouton = useRef<HTMLButtonElement>(null);
  const bulle = useRef<HTMLSpanElement>(null);
  const open = pinned || hovered;

  useLayoutEffect(() => {
    if (!open || !bouton.current) {
      setPos(null);
      return;
    }
    const r = bouton.current.getBoundingClientRect();
    const largeur = Math.min(LARGEUR, window.innerWidth - 2 * MARGE);
    const gauche = align === "right" ? r.right - largeur : r.left;
    setPos({ top: r.bottom + 8, left: Math.max(MARGE, Math.min(gauche, window.innerWidth - largeur - MARGE)) });
  }, [open, align]);

  // Si la bulle déborde en bas de l'écran, on la place au-dessus du « ? ».
  useLayoutEffect(() => {
    if (!pos || !bulle.current || !bouton.current) return;
    const hauteur = bulle.current.offsetHeight;
    if (pos.top + hauteur > window.innerHeight - MARGE) {
      const haut = Math.max(MARGE, bouton.current.getBoundingClientRect().top - hauteur - 8);
      if (haut !== pos.top) setPos({ ...pos, top: haut });
    }
  }, [pos]);

  useEffect(() => {
    if (!open) return;
    const fermer = () => {
      setPinned(false);
      setHovered(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!bouton.current?.contains(e.target as Node)) setPinned(false);
    };
    // Échap ferme la bulle même si la souris reste dessus (WCAG 1.4.13)
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fermer();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", fermer, true);
    window.addEventListener("resize", fermer);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", fermer, true);
      window.removeEventListener("resize", fermer);
    };
  }, [open]);

  return (
    <span
      className="relative ml-1 inline-block align-middle"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        ref={bouton}
        type="button"
        aria-label={title ? `Aide : ${title}` : "Aide"}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.preventDefault();
          setPinned((p) => !p);
        }}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-400 bg-white text-[10px] font-bold leading-none text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        ?
      </button>
      {open &&
        pos &&
        createPortal(
          <span
            ref={bulle}
            id={id}
            role="tooltip"
            style={{ top: pos.top, left: pos.left, width: Math.min(LARGEUR, window.innerWidth - 2 * MARGE) }}
            className="pointer-events-none fixed z-[1000] rounded-xl bg-ink p-3 text-left text-xs font-normal leading-snug text-white shadow-pop"
          >
            {title && <strong className="mb-1 block text-[13px]">{title}</strong>}
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
