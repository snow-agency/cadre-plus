// Échelle de couleurs de l'ICV (rouge → jaune → vert, palette de cartographie type ColorBrewer RdYlGn).
// Source unique : carte, légende, pastilles, fiches et graphiques l'utilisent toutes.
export const ICV_STOPS: [number, string][] = [
  [0, "#d73027"],
  [20, "#f46d43"],
  [45, "#fdc94f"],
  [60, "#cde85a"],
  [80, "#7cc65e"],
  [100, "#1a9850"],
];

const INK: [number, number, number] = [11, 37, 69];

const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

function interpoler(valeur: number): [number, number, number] {
  const v = Math.max(0, Math.min(100, valeur));
  for (let i = 1; i < ICV_STOPS.length; i++) {
    const [v1, c1] = ICV_STOPS[i - 1];
    const [v2, c2] = ICV_STOPS[i];
    if (v <= v2) {
      const t = (v - v1) / (v2 - v1);
      const a = rgb(c1);
      const b = rgb(c2);
      return a.map((x, k) => Math.round(x + (b[k] - x) * t)) as [number, number, number];
    }
  }
  return rgb(ICV_STOPS[ICV_STOPS.length - 1][1]);
}

const css = ([r, g, b]: [number, number, number]) => `rgb(${r}, ${g}, ${b})`;

export const couleurIcv = (valeur: number) => css(interpoler(valeur));

// Version assombrie, pour du texte sur fond clair (le jaune pur serait illisible).
export const couleurIcvTexte = (valeur: number) =>
  css(interpoler(valeur).map((x, k) => Math.round(x * 0.55 + INK[k] * 0.45)) as [number, number, number]);

export const DEGRADE_ICV_CSS = `linear-gradient(to right, ${ICV_STOPS.map(([v, c]) => `${c} ${v}%`).join(", ")})`;

export const expressionIcv = (propriete: string) =>
  ["interpolate", ["linear"], ["get", propriete], ...ICV_STOPS.flat()] as const;

export function niveauIcv(valeur: number): { label: string; classes: string } {
  if (valeur >= 66) return { label: "Cadre de vie bon", classes: "bg-emerald-50 text-emerald-800 ring-emerald-200" };
  if (valeur >= 45) return { label: "Cadre de vie moyen", classes: "bg-amber-50 text-amber-800 ring-amber-200" };
  return { label: "Cadre de vie dégradé", classes: "bg-red-50 text-red-800 ring-red-200" };
}
