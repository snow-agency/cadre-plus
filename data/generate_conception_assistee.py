"""Génère un jeu de données synthétique (module « Conception assistée ») :
trois parcelles contrastées dans le quartier de Togba (Abomey-Calavi), avec
géométries à l'échelle réelle (dimensions en mètres), un indice de
constructibilité et les contraintes nécessaires au placement optimal
(côté de la voie d'accès, côté de la zone naturelle, bâti existant).

Données inventées pour démontrer la méthode, pas des données officielles —
voir docs/adr/0002-donnees-synthetiques.md.

Dépendances : aucune (stdlib uniquement). Lancer depuis data/ :
    python generate_conception_assistee.py
"""
import json
import math

M_PER_DEG_LAT = 110_574.0


def m_per_deg_lon(lat: float) -> float:
    return 111_320.0 * math.cos(math.radians(lat))


# Parcelles rectangulaires alignées nord/sud, définies par leur centre
# (lon, lat) et leurs dimensions en mètres (largeur est-ouest, hauteur
# nord-sud). `existant` : bâti déjà présent, en mètres relatifs au centre.
PARCELLES = [
    {"id": "parcelle-togba-01", "nom": "P1 — Plateau sableux",
     "lon": 2.3049, "lat": 6.4651, "largeur_m": 50, "hauteur_m": 64,
     "sol_type": "sable latéritique", "portance_kpa": 180, "risque_inondation": "faible",
     "altitude_m": 42, "pente_pct": 2, "voie_acces_cote": "nord",
     "zone_naturelle_cotes": [], "existant": None},
    {"id": "parcelle-togba-02", "nom": "P2 — Zone mixte",
     "lon": 2.3068, "lat": 6.46375, "largeur_m": 56, "hauteur_m": 50,
     "sol_type": "argilo-sableux", "portance_kpa": 110, "risque_inondation": "moyen",
     "altitude_m": 28, "pente_pct": 4, "voie_acces_cote": "est",
     "zone_naturelle_cotes": ["ouest"],
     "existant": {"dx_m": 14, "dy_m": -12, "largeur_m": 8, "hauteur_m": 10}},
    {"id": "parcelle-togba-03", "nom": "P3 — Bas-fond",
     "lon": 2.3026, "lat": 6.4627, "largeur_m": 64, "hauteur_m": 64,
     "sol_type": "argile limoneuse saturée", "portance_kpa": 60, "risque_inondation": "élevé",
     "altitude_m": 15, "pente_pct": 1, "voie_acces_cote": "nord",
     "zone_naturelle_cotes": ["nord", "sud", "est", "ouest"], "existant": None},
]

RISQUE_INONDATION_SCORE = {"faible": 100, "moyen": 50, "élevé": 10}
PORTANCE_PLAFOND_KPA = 200  # au-delà, le sol n'est plus le facteur limitant


def indice_constructibilite(p: dict) -> float:
    score_portance = min(100.0, 100.0 * p["portance_kpa"] / PORTANCE_PLAFOND_KPA)
    score_inondation = RISQUE_INONDATION_SCORE[p["risque_inondation"]]
    score_pente = max(0.0, 100.0 - p["pente_pct"] * 10)
    return round(0.5 * score_portance + 0.4 * score_inondation + 0.1 * score_pente, 1)


def recommandation(indice: float) -> str:
    if indice >= 75:
        return ("Constructible — zone prioritaire. Fondations standards (semelles isolées). "
                "Implantation du bâtiment principal à optimiser vis-à-vis de la voie d'accès. "
                "Point de collecte des déchets en bordure de voie d'accès.")
    if indice >= 40:
        return ("Constructible sous conditions — renforcer les fondations (semelles filantes "
                "profondes ou radier), prévoir un système de drainage périphérique, conserver "
                "une bande tampon de 10 m en bordure de toute zone naturelle voisine.")
    return ("Non recommandé à la construction — sol à faible portance et/ou risque d'inondation "
            "élevé. Proposition : conserver comme zone naturelle / tampon écologique ou bassin de "
            "rétention des eaux pluviales. Ne pas y implanter de point de collecte des déchets.")


def rectangle(lon: float, lat: float, largeur_m: float, hauteur_m: float,
              dx_m: float = 0.0, dy_m: float = 0.0) -> list:
    """Anneau GeoJSON d'un rectangle (mètres) centré à (dx, dy) du point (lon, lat)."""
    d_lon = 1 / m_per_deg_lon(lat)
    d_lat = 1 / M_PER_DEG_LAT
    cx, cy = lon + dx_m * d_lon, lat + dy_m * d_lat
    hw, hh = largeur_m / 2 * d_lon, hauteur_m / 2 * d_lat
    return [[
        [cx - hw, cy - hh], [cx + hw, cy - hh],
        [cx + hw, cy + hh], [cx - hw, cy + hh], [cx - hw, cy - hh],
    ]]


def construire_geojson() -> dict:
    features = []
    for p in PARCELLES:
        indice = indice_constructibilite(p)
        props = {
            "id": p["id"], "nom": p["nom"],
            "surface_m2": round(p["largeur_m"] * p["hauteur_m"]),
            "sol_type": p["sol_type"], "portance_kpa": p["portance_kpa"],
            "risque_inondation": p["risque_inondation"], "altitude_m": p["altitude_m"],
            "pente_pct": p["pente_pct"],
            "batiments_existants": 1 if p["existant"] else 0,
            "voie_acces_cote": p["voie_acces_cote"],
            "zone_naturelle_cotes": p["zone_naturelle_cotes"],
            "zone_naturelle_a_proximite": bool(p["zone_naturelle_cotes"]),
            "indice_constructibilite_0_100": indice,
            "recommandation": recommandation(indice),
        }
        if p["existant"]:
            e = p["existant"]
            props["emprise_existante"] = {
                "type": "Polygon",
                "coordinates": rectangle(p["lon"], p["lat"], e["largeur_m"], e["hauteur_m"],
                                         e["dx_m"], e["dy_m"]),
            }
        features.append({
            "type": "Feature", "properties": props,
            "geometry": {"type": "Polygon",
                         "coordinates": rectangle(p["lon"], p["lat"], p["largeur_m"], p["hauteur_m"])},
        })
    return {
        "type": "FeatureCollection",
        "metadata": {
            "synthetic": True,
            "source": "Donnée synthétique générée pour démonstration — ne pas présenter comme donnée officielle",
            "zone": "Trois parcelles illustratives, quartier de Togba, Abomey-Calavi",
            "methodologie_indice_constructibilite": "indice = 0.5*portance_normalisee + 0.4*score_risque_inondation_inverse + 0.1*score_pente",
        },
        "features": features,
    }


if __name__ == "__main__":
    geojson = construire_geojson()
    with open("output/conception_assistee_togba.geojson", "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    print(f"{len(geojson['features'])} parcelles générées dans output/")
