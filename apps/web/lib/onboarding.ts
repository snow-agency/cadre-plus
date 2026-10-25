"use client";

import { useCallback, useEffect, useState } from "react";

const CLE = "cadre-plus:onboarding:v1";

export type Etape = "quartier" | "parcelle" | "budget";

type Etat = { masque: boolean; fait: Record<Etape, boolean> };

const INITIAL: Etat = { masque: false, fait: { quartier: false, parcelle: false, budget: false } };

// Accueil guidé + liste « Premiers pas ». L'avancement est mémorisé dans le navigateur de l'utilisateur.
export function useOnboarding() {
  const [etat, setEtat] = useState<Etat>(INITIAL);
  const [accueilOuvert, setAccueilOuvert] = useState(false);

  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE);
      if (brut) setEtat({ ...INITIAL, ...JSON.parse(brut) });
      else setAccueilOuvert(true);
    } catch {
      setAccueilOuvert(true);
    }
  }, []);

  const enregistrer = useCallback((maj: (e: Etat) => Etat) => {
    setEtat((courant) => {
      const suivant = maj(courant);
      try {
        localStorage.setItem(CLE, JSON.stringify(suivant));
      } catch {
        /* navigation privée : on garde l'état en mémoire seulement */
      }
      return suivant;
    });
  }, []);

  const marquer = useCallback(
    (e: Etape) => enregistrer((c) => (c.fait[e] ? c : { ...c, fait: { ...c.fait, [e]: true } })),
    [enregistrer],
  );
  const masquer = useCallback((masque: boolean) => enregistrer((c) => ({ ...c, masque })), [enregistrer]);
  const fermerAccueil = useCallback(() => {
    setAccueilOuvert(false);
    enregistrer((c) => c);
  }, [enregistrer]);

  // Le bouton « Visite guidée » de l'en-tête rouvre l'accueil et réaffiche la liste.
  useEffect(() => {
    const rouvrir = () => {
      setAccueilOuvert(true);
      masquer(false);
    };
    window.addEventListener("cadre:visite", rouvrir);
    return () => window.removeEventListener("cadre:visite", rouvrir);
  }, [masquer]);

  return { etat, accueilOuvert, fermerAccueil, marquer, masquer };
}
