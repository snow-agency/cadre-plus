"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  text: React.ReactNode;
  title?: string;
  align?: "left" | "right";
};

export default function HelpTip({ text, title, align = "left" }: Props) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const open = pinned || hovered;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPinned(false);
    };
    // Échap ferme l'infobulle même si la souris reste dessus (WCAG 1.4.13)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinned(false);
        setHovered(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative ml-1 inline-block align-middle"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label={title ? `Aide : ${title}` : "Aide"}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setPinned((p) => !p)}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-400 bg-white text-[10px] font-bold leading-none text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute top-5 z-50 w-64 rounded-md bg-slate-900 p-2 text-left text-xs font-normal leading-snug text-white shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {title && <strong className="mb-0.5 block">{title}</strong>}
          {text}
        </span>
      )}
    </span>
  );
}
