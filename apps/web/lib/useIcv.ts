"use client";

import { useEffect, useState } from "react";
import { getJson } from "./api";
import type { Quartier } from "./types";

let promesse: Promise<Quartier[]> | null = null;

function charger(): Promise<Quartier[]> {
  promesse ??= getJson<{ features: { properties: Quartier }[] }>("/api/icv")
    .then((d) => d.features.map((f) => f.properties))
    .catch((e) => {
      promesse = null;
      throw e;
    });
  return promesse;
}

// Charge les quartiers une seule fois pour toute la page (plusieurs composants peuvent l'utiliser).
export function useIcv() {
  const [quartiers, setQuartiers] = useState<Quartier[] | null>(null);
  const [erreur, setErreur] = useState(false);
  useEffect(() => {
    let actif = true;
    charger().then((q) => actif && setQuartiers(q)).catch(() => actif && setErreur(true));
    return () => {
      actif = false;
    };
  }, []);
  return { quartiers, erreur };
}
