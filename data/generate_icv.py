"""Génère un jeu de données synthétique (ICV + carte des inégalités) pour la
commune d'Abomey-Calavi, à des fins de démonstration uniquement.

Les quartiers, coordonnées et valeurs d'indicateurs sont inventés pour être
réalistes (gradient centre urbain -> périphérie rurale), pas officiels — voir
docs/adr/0002-donnees-synthetiques.md. Le fichier de sortie est déjà généré
dans data/output/icv_abomey_calavi.{geojson,csv} ; ce script documente et
reproduit le calcul.

Dépendances : aucune (stdlib uniquement), pour rester exécutable même sans
geopandas/shapely installés.
"""
import csv
import json

# Poids de l'Indice de Cadre de Vie (ICV). Somme = 1.0. À ajuster et
# justifier au fur et à mesure des retours terrain — ne jamais les présenter
# comme figés/officiels.
POIDS_ICV = {
    "ecole": 0.15,
    "sante": 0.15,
    "eau": 0.15,
    "electrification": 0.15,
    "drainage": 0.15,
    "dechets": 0.10,
    "espaces_verts": 0.10,
    "inondation": 0.05,
}

# Quartiers d'Abomey-Calavi utilisés comme ancrage géographique illustratif,
# avec un carré illustratif centré sur la position réelle (OSM) de l'arrondissement.
QUARTIERS = [
    {"id": "quartier-centre", "nom": "Abomey-Calavi Centre", "lon": 2.3542, "lat": 6.4539,
     "ecole_min": 8, "sante_min": 12, "eau_min": 6, "electrification_pct": 88,
     "drainage_0_10": 7, "dechets_pct": 75, "espaces_verts_pct": 8, "inondation_0_10": 3},
    {"id": "quartier-godomey", "nom": "Godomey", "lon": 2.3432, "lat": 6.3854,
     "ecole_min": 10, "sante_min": 15, "eau_min": 8, "electrification_pct": 80,
     "drainage_0_10": 5, "dechets_pct": 65, "espaces_verts_pct": 6, "inondation_0_10": 6},
    {"id": "quartier-togba", "nom": "Togba", "lon": 2.3049, "lat": 6.4651,
     "ecole_min": 15, "sante_min": 20, "eau_min": 12, "electrification_pct": 65,
     "drainage_0_10": 4, "dechets_pct": 50, "espaces_verts_pct": 10, "inondation_0_10": 5},
    {"id": "quartier-akassato", "nom": "Akassato", "lon": 2.3656, "lat": 6.5074,
     "ecole_min": 18, "sante_min": 25, "eau_min": 15, "electrification_pct": 60,
     "drainage_0_10": 5, "dechets_pct": 45, "espaces_verts_pct": 12, "inondation_0_10": 2},
    {"id": "quartier-zinvie", "nom": "Zinvié", "lon": 2.3568, "lat": 6.6134,
     "ecole_min": 25, "sante_min": 35, "eau_min": 20, "electrification_pct": 40,
     "drainage_0_10": 2, "dechets_pct": 25, "espaces_verts_pct": 15, "inondation_0_10": 8},
    {"id": "quartier-hevie", "nom": "Hêvié", "lon": 2.2571, "lat": 6.4139,
     "ecole_min": 30, "sante_min": 40, "eau_min": 22, "electrification_pct": 45,
     "drainage_0_10": 3, "dechets_pct": 30, "espaces_verts_pct": 18, "inondation_0_10": 4},
    {"id": "quartier-kpanroun", "nom": "Kpanroun", "lon": 2.3667, "lat": 6.6739,
     "ecole_min": 28, "sante_min": 38, "eau_min": 25, "electrification_pct": 38,
     "drainage_0_10": 2, "dechets_pct": 20, "espaces_verts_pct": 20, "inondation_0_10": 3},
    {"id": "quartier-ouedo", "nom": "Ouèdo", "lon": 2.2671, "lat": 6.4524,
     "ecole_min": 35, "sante_min": 45, "eau_min": 28, "electrification_pct": 32,
     "drainage_0_10": 2, "dechets_pct": 15, "espaces_verts_pct": 22, "inondation_0_10": 5},
]

DEMI_COTE_DEG = 0.010  # ~1,1 km de demi-côté : carré illustratif, pas une limite administrative

# Population illustrative par quartier (inventée), utilisée par les modules
# Arbitrage des investissements et Prospective 2050.
POPULATION = {
    "quartier-centre": 85000, "quartier-godomey": 120000, "quartier-togba": 64000,
    "quartier-akassato": 48000, "quartier-zinvie": 38000, "quartier-hevie": 30000,
    "quartier-kpanroun": 26000, "quartier-ouedo": 22000,
}


def score_temps(minutes: float, plafond: float) -> float:
    """Plus le trajet est court, meilleur le score. 0 au-delà du plafond."""
    return max(0.0, 100.0 * (1 - minutes / plafond))


def score_espaces_verts(pct_surface: float, plafond_pct: float = 25.0) -> float:
    return min(100.0, 100.0 * pct_surface / plafond_pct)


def score_inondation_inverse(risque_0_10: float) -> float:
    return max(0.0, 100.0 - risque_0_10 * 10)


def calculer_icv(q: dict) -> dict:
    sous_scores = {
        "ecole": score_temps(q["ecole_min"], plafond=45),
        "sante": score_temps(q["sante_min"], plafond=60),
        "eau": score_temps(q["eau_min"], plafond=45),
        "electrification": float(q["electrification_pct"]),
        "drainage": q["drainage_0_10"] * 10.0,
        "dechets": float(q["dechets_pct"]),
        "espaces_verts": score_espaces_verts(q["espaces_verts_pct"]),
        "inondation": score_inondation_inverse(q["inondation_0_10"]),
    }
    icv = sum(POIDS_ICV[k] * v for k, v in sous_scores.items())
    return sous_scores, round(icv, 1)


def carre(lon: float, lat: float, demi_cote: float = DEMI_COTE_DEG) -> list:
    return [[
        [lon - demi_cote, lat - demi_cote],
        [lon + demi_cote, lat - demi_cote],
        [lon + demi_cote, lat + demi_cote],
        [lon - demi_cote, lat + demi_cote],
        [lon - demi_cote, lat - demi_cote],
    ]]


def construire_geojson() -> dict:
    features = []
    for q in QUARTIERS:
        sous_scores, icv = calculer_icv(q)
        features.append({
            "type": "Feature",
            "properties": {
                "id": q["id"],
                "nom_quartier": q["nom"],
                "icv": icv,
                "population": POPULATION[q["id"]],
                "indicateurs_bruts": {
                    "temps_acces_ecole_min": q["ecole_min"],
                    "temps_acces_sante_min": q["sante_min"],
                    "temps_acces_eau_min": q["eau_min"],
                    "taux_electrification_pct": q["electrification_pct"],
                    "score_drainage_0_10": q["drainage_0_10"],
                    "couverture_collecte_dechets_pct": q["dechets_pct"],
                    "espaces_verts_pct_surface": q["espaces_verts_pct"],
                    "risque_inondation_0_10": q["inondation_0_10"],
                },
                "sous_scores_normalises_0_100": {k: round(v, 1) for k, v in sous_scores.items()},
            },
            "geometry": {"type": "Polygon", "coordinates": carre(q["lon"], q["lat"])},
        })
    return {
        "type": "FeatureCollection",
        "metadata": {
            "synthetic": True,
            "source": "Donnée synthétique générée pour démonstration — ne pas présenter comme donnée officielle",
            "zone": "Commune d'Abomey-Calavi (quartiers réels utilisés comme ancrage géographique illustratif)",
            "methodologie_icv": "ICV = " + " + ".join(f"{w}*{k}" for k, w in POIDS_ICV.items()),
            "poids_icv": POIDS_ICV,
        },
        "features": features,
    }


def ecrire_csv(geojson: dict, chemin: str) -> None:
    with open(chemin, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "id", "nom_quartier", "icv", "population", "temps_acces_ecole_min", "temps_acces_sante_min",
            "temps_acces_eau_min", "taux_electrification_pct", "score_drainage_0_10",
            "couverture_collecte_dechets_pct", "espaces_verts_pct_surface", "risque_inondation_0_10",
        ])
        for feat in geojson["features"]:
            p, b = feat["properties"], feat["properties"]["indicateurs_bruts"]
            writer.writerow([
                p["id"], p["nom_quartier"], p["icv"], p["population"], b["temps_acces_ecole_min"],
                b["temps_acces_sante_min"], b["temps_acces_eau_min"], b["taux_electrification_pct"],
                b["score_drainage_0_10"], b["couverture_collecte_dechets_pct"],
                b["espaces_verts_pct_surface"], b["risque_inondation_0_10"],
            ])


if __name__ == "__main__":
    geojson = construire_geojson()
    with open("output/icv_abomey_calavi.geojson", "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    ecrire_csv(geojson, "output/icv_abomey_calavi.csv")
    print(f"{len(geojson['features'])} quartiers générés dans output/")
