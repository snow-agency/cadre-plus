export type LonLat = [number, number];

export type BatimentParam = {
  centre: LonLat;
  dim_est_ouest_m: number;
  dim_nord_sud_m: number;
  angle_deg: number;
};

export type Resume = {
  parcelle_id: string;
  nom: string;
  surface_m2: number;
  indice_constructibilite: number;
  centre: LonLat;
  statut: "constructible" | "non_constructible" | "non_constructible_contraintes";
  justification: string;
  emprise_m2?: number;
  ces_pct?: number;
  dimensions_m?: string;
  fondation?: string;
  cout_total_estime_fcfa?: number;
  bassin_volume_m3?: number;
  batiment_param?: BatimentParam;
  point_collecte_param?: LonLat;
};

export type Violation = { code: string; severite: "erreur" | "avertissement"; message: string };

export type Evaluation = {
  parcelle_id: string;
  valide: boolean;
  violations: Violation[];
  metriques: {
    emprise_m2?: number;
    ces_pct?: number;
    distance_voie_m?: number;
    fondation?: string;
    cout_fondation_fcfa?: number;
    cout_drainage_fcfa?: number;
    cout_total_estime_fcfa?: number;
    drainage_peripherique?: boolean;
  };
  comparaison_optimum: {
    emprise_optimale_m2: number;
    cout_optimal_fcfa: number;
    distance_voie_optimale_m: number;
    ecart_cout_fcfa: number;
    ecart_distance_voie_m: number;
  } | null;
  features: GeoJSON.FeatureCollection;
};

export type Levier = { levier: string; label: string; reseau: boolean };

export type QuartierPlan = {
  id: string;
  nom: string;
  population: number;
  origine: "manuel" | "auto" | "aucun";
  icv_avant: number;
  icv_apres: number;
  cout_fcfa: number;
  economie_coordination_fcfa: number;
  leviers: { levier: string; label: string; gain_icv: number }[];
};

export type PlanResume = {
  cout_total_fcfa: number;
  benefice_personnes_x_points_icv: number;
  valeur_ponderee_equite: number;
  gain_icv_moyen_pondere: number;
  icv_moyen_apres: number;
};

export type PlanResponse = {
  metadata: { leviers: Levier[] };
  budget_fcfa: number;
  reste_budget_fcfa: number;
  depasse_budget: boolean;
  mode: "automatique" | "mixte" | "manuel";
  avertissements: string[];
  icv_moyen_avant: number;
  plan: PlanResume & { quartiers: QuartierPlan[] };
  reference_optimale: PlanResume | null;
  ecart_vs_optimum_pct: number | null;
  strategie_naive: PlanResume & { description: string };
  amelioration_vs_naive_pct: number | null;
};
