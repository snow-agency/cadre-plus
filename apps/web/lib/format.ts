export const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

export const mfcfa = (n: number) =>
  `${Math.round(n / 1_000_000).toLocaleString("fr-FR")} M FCFA`;

export const signed = (n: number, suffix = "") => `${n > 0 ? "+" : ""}${n.toLocaleString("fr-FR")}${suffix}`;
