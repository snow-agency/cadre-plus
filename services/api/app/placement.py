"""Optimiseur de placement — module « Conception assistée ».

Pour chaque parcelle, calcule un aménagement concret :
- zone constructible (parcelle moins retraits, voie, zones naturelles, bâti existant) ;
- emprise et position optimales du bâtiment (grille de candidats, on garde
  celle qui minimise la distance à la voie d'accès) ;
- point de collecte des déchets accessible depuis la voie, hors zone tampon ;
- pour une parcelle non constructible : bassin de rétention + tampon écologique ;
- estimation indicative des coûts (hypothèses synthétiques, cf. COUTS_*).

Hypothèses : parcelles rectangulaires alignées nord/sud (cohérent avec le jeu
de données synthétique). Calcul en mètres dans un repère local, puis retour
en lon/lat.
"""
import math

import numpy as np
import shapely

from shapely import affinity
from shapely.geometry import LineString, Point, box, mapping, shape
from shapely.prepared import prep

from . import data_access

M_PER_DEG_LAT = 110_574.0

RETRAIT_LATERAL_M = 3.0
RETRAIT_VOIE_M = 5.0
TAMPON_ZONE_NATURELLE_M = 10.0
DECALAGE_POINT_COLLECTE_M = 1.5
PROFONDEUR_BASSIN_M = 0.5
RATIO_FORME = 1.5
PAS_GRILLE_M = 1.0
ECHELLES_EMPRISE = (1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4)

SEUIL_CONSTRUCTIBLE = 40.0
SEUIL_PRIORITAIRE = 75.0
CES_PRIORITAIRE = 0.40
CES_SOUS_CONDITIONS = 0.25

# Hypothèses de coût indicatives (FCFA), inventées pour la démonstration.
COUT_DRAINAGE_FCFA_ML = 25_000


def _fondation(portance_kpa: float) -> tuple[str, int]:
    if portance_kpa >= 150:
        return "semelles isolées", 35_000
    if portance_kpa >= 90:
        return "semelles filantes profondes ou radier partiel", 60_000
    return "radier général sur sol amélioré", 95_000


def _projecteurs(lon0: float, lat0: float):
    """Renvoie deux fonctions géométrie -> géométrie (lon/lat <-> mètres locaux)."""
    kx = 111_320.0 * math.cos(math.radians(lat0))
    origine = np.array([lon0, lat0])
    echelle = np.array([kx, M_PER_DEG_LAT])

    def vers_metres(geom):
        return shapely.transform(geom, lambda c: (c - origine) * echelle)

    def vers_lonlat(geom):
        return shapely.transform(geom, lambda c: origine + c / echelle)

    return vers_metres, vers_lonlat


def _arete(bounds: tuple, cote: str) -> LineString:
    minx, miny, maxx, maxy = bounds
    return {
        "nord": LineString([(minx, maxy), (maxx, maxy)]),
        "sud": LineString([(minx, miny), (maxx, miny)]),
        "est": LineString([(maxx, miny), (maxx, maxy)]),
        "ouest": LineString([(minx, miny), (minx, maxy)]),
    }[cote]


def _vers_interieur(point: Point, cote_voie: str, distance: float) -> Point:
    dx, dy = {"nord": (0, -1), "sud": (0, 1), "est": (-1, 0), "ouest": (1, 0)}[cote_voie]
    return Point(point.x + dx * distance, point.y + dy * distance)


def _meilleur_emplacement(zone, voie: LineString, aire_cible: float):
    zone_prep = prep(zone)
    minx, miny, maxx, maxy = zone.bounds
    for echelle in ECHELLES_EMPRISE:
        aire = aire_cible * echelle
        grand = math.sqrt(aire * RATIO_FORME)
        petit = aire / grand
        meilleur = None
        for largeur, hauteur, orientation in ((grand, petit, "est-ouest"), (petit, grand, "nord-sud")):
            x = minx + largeur / 2
            while x <= maxx - largeur / 2 + 1e-9:
                y = miny + hauteur / 2
                while y <= maxy - hauteur / 2 + 1e-9:
                    rect = box(x - largeur / 2, y - hauteur / 2, x + largeur / 2, y + hauteur / 2)
                    if zone_prep.contains(rect):
                        score = (round(rect.distance(voie), 2),
                                 round(rect.centroid.distance(zone.centroid), 2))
                        if meilleur is None or score < meilleur[0]:
                            meilleur = (score, rect, largeur, hauteur, orientation, echelle)
                    y += PAS_GRILLE_M
                x += PAS_GRILLE_M
        if meilleur:
            return meilleur
    return None


def _zone_constructible(parcelle, voie: LineString, tampons: list, existant):
    zone = parcelle.buffer(-RETRAIT_LATERAL_M, join_style=2).difference(voie.buffer(RETRAIT_VOIE_M))
    for t in tampons:
        zone = zone.difference(t)
    if existant is not None:
        zone = zone.difference(existant.buffer(RETRAIT_LATERAL_M))
    return zone


def _couts(props: dict, emprise: float, largeur: float, hauteur: float) -> dict:
    fondation, cout_m2 = _fondation(props["portance_kpa"])
    drainage = props["risque_inondation"] != "faible"
    cout_fondation = round(emprise * cout_m2)
    cout_drainage = round(2 * (largeur + hauteur) * COUT_DRAINAGE_FCFA_ML) if drainage else 0
    return {
        "fondation": fondation, "cout_fondation_fcfa": cout_fondation,
        "drainage_peripherique": drainage, "cout_drainage_fcfa": cout_drainage,
        "cout_total_estime_fcfa": cout_fondation + cout_drainage,
    }


def _plafond_ces(indice: float) -> float:
    return CES_PRIORITAIRE if indice >= SEUIL_PRIORITAIRE else CES_SOUS_CONDITIONS


def _point_collecte(parcelle, voie: LineString, cote_voie: str, batiment, tampons):
    longueur = int(voie.length)
    candidats = sorted(range(longueur + 1), key=lambda d: voie.interpolate(d).distance(batiment.centroid))
    for d in candidats:
        point = _vers_interieur(voie.interpolate(d), cote_voie, DECALAGE_POINT_COLLECTE_M)
        if parcelle.contains(point) and not any(t.contains(point) for t in tampons):
            return point
    return None


def _amenager_parcelle(feature: dict, vers_metres, vers_lonlat) -> tuple[list, dict]:
    props = feature["properties"]
    parcelle = vers_metres(shape(feature["geometry"]))
    bounds = parcelle.bounds
    indice = props["indice_constructibilite_0_100"]
    voie = _arete(bounds, props["voie_acces_cote"])
    tampons = [_arete(bounds, c).buffer(TAMPON_ZONE_NATURELLE_M) for c in props["zone_naturelle_cotes"]]
    existant = (vers_metres(shape(props["emprise_existante"]))
                if props.get("emprise_existante") else None)

    pid = props["id"]
    elements: list[tuple[str, object, dict]] = []
    centre = shape(feature["geometry"]).centroid
    resume = {
        "parcelle_id": pid, "nom": props["nom"], "surface_m2": props["surface_m2"],
        "indice_constructibilite": indice, "contraintes_appliquees": [],
        "centre": [round(centre.x, 6), round(centre.y, 6)],
    }

    if indice < SEUIL_CONSTRUCTIBLE:
        bassin = parcelle.buffer(-6, join_style=2)
        tampon_eco = parcelle.difference(bassin)
        elements += [
            ("bassin_retention", bassin, {"volume_m3": round(bassin.area * PROFONDEUR_BASSIN_M)}),
            ("zone_tampon", tampon_eco, {"role": "tampon écologique"}),
        ]
        resume.update({
            "statut": "non_constructible",
            "amenagement": "bassin de rétention + tampon écologique",
            "bassin_surface_m2": round(bassin.area),
            "bassin_volume_m3": round(bassin.area * PROFONDEUR_BASSIN_M),
            "justification": (
                f"Indice de constructibilité {indice} < {SEUIL_CONSTRUCTIBLE:.0f} : portance "
                f"{props['portance_kpa']} kPa et risque d'inondation {props['risque_inondation']}. "
                "Aucune construction ni point de collecte ; la parcelle est valorisée comme "
                "zone de rétention des eaux pluviales."
            ),
        })
    else:
        zone = _zone_constructible(parcelle, voie, tampons, existant)
        resume["contraintes_appliquees"] += [
            f"retrait latéral {RETRAIT_LATERAL_M:g} m", f"retrait voie {RETRAIT_VOIE_M:g} m"]
        if tampons:
            resume["contraintes_appliquees"].append(f"tampon zone naturelle {TAMPON_ZONE_NATURELLE_M:g} m")
        if existant is not None:
            resume["contraintes_appliquees"].append("évitement du bâti existant (+3 m)")
            elements.append(("emprise_existante", existant, {"role": "bâti existant conservé"}))
        elements.append(("zone_constructible", zone, {}))
        for t in tampons:
            elements.append(("zone_tampon", t.intersection(parcelle), {"role": "tampon zone naturelle"}))

        ces = _plafond_ces(indice)
        aire_cible = ces * parcelle.area
        place = _meilleur_emplacement(zone, voie, aire_cible)
        if place is None:
            resume.update({"statut": "non_constructible_contraintes",
                           "justification": "Aucun emplacement ne respecte l'ensemble des contraintes."})
        else:
            _, bat, largeur, hauteur, orientation, echelle = place
            emprise = bat.area
            couts = _couts(props, emprise, largeur, hauteur)
            point = _point_collecte(parcelle, voie, props["voie_acces_cote"], bat, tampons)

            centre_bat = vers_lonlat(bat.centroid)
            resume["batiment_param"] = {
                "centre": [round(centre_bat.x, 7), round(centre_bat.y, 7)],
                "dim_est_ouest_m": round(largeur, 2), "dim_nord_sud_m": round(hauteur, 2), "angle_deg": 0,
            }
            if point is not None:
                pt_ll = vers_lonlat(point)
                resume["point_collecte_param"] = [round(pt_ll.x, 7), round(pt_ll.y, 7)]
            elements.append(("batiment", bat, {
                "longueur_m": round(max(largeur, hauteur), 1), "largeur_m": round(min(largeur, hauteur), 1),
                "emprise_m2": round(emprise), "orientation": orientation}))
            if point is not None:
                elements.append(("point_collecte", point, {"distance_batiment_m": round(point.distance(bat), 1)}))
            resume.update({
                "statut": "constructible",
                "emprise_m2": round(emprise),
                "ces_pct": round(100 * emprise / parcelle.area, 1),
                "dimensions_m": f"{max(largeur, hauteur):.1f} x {min(largeur, hauteur):.1f}",
                "orientation": orientation,
                "distance_voie_m": round(bat.distance(voie), 1),
                **couts,
                "point_collecte": point is not None,
                "emprise_reduite_pct": round(100 * (1 - echelle)) if echelle < 1 else 0,
                "justification": (
                    f"Emprise {round(emprise)} m² ({100 * emprise / parcelle.area:.0f}% de la parcelle, "
                    f"plafond {100 * ces:.0f}% selon l'indice {indice}), placée au plus près de la voie "
                    f"({props['voie_acces_cote']}) pour limiter la desserte, en respectant "
                    f"{', '.join(resume['contraintes_appliquees'])}. Fondations : {couts['fondation']}"
                    f"{' + drainage périphérique' if couts['drainage_peripherique'] else ''}."
                ),
            })

    features = []
    for type_, geom, extra in elements:
        features.append({
            "type": "Feature",
            "properties": {"parcelle_id": pid, "type": type_, **extra},
            "geometry": mapping(vers_lonlat(geom)),
        })
    return features, resume


def calculer_amenagements() -> dict:
    parcelles = data_access.get_conception_assistee()
    features, resumes = [], []
    for feat in parcelles["features"]:
        c = shape(feat["geometry"]).centroid
        vers_metres, vers_lonlat = _projecteurs(c.x, c.y)
        f, r = _amenager_parcelle(feat, vers_metres, vers_lonlat)
        features += f
        resumes.append(r)
    return {
        "type": "FeatureCollection",
        "metadata": {
            "synthetic": True,
            "source": "Aménagement calculé sur données synthétiques — démonstration, non officiel",
            "hypotheses_cout": "Coûts en FCFA indicatifs inventés (fondations 35 000 à 95 000 FCFA/m² "
                               "selon portance ; drainage 25 000 FCFA/ml) — à remplacer par des "
                               "barèmes réels avant tout usage décisionnel.",
        },
        "features": features,
        "summaries": resumes,
    }


class ParcelleIntrouvable(KeyError):
    pass


def _trouver_parcelle(parcelle_id: str) -> dict:
    for f in data_access.get_conception_assistee()["features"]:
        if f["properties"]["id"] == parcelle_id:
            return f
    raise ParcelleIntrouvable(parcelle_id)


def _violation(code: str, severite: str, message: str) -> dict:
    return {"code": code, "severite": severite, "message": message}


def _verifier_batiment(bat, ctx: dict) -> list[dict]:
    """Contraintes physiques/réglementaires sur le bâtiment (mêmes règles que l'optimiseur)."""
    props, parcelle, voie = ctx["props"], ctx["parcelle"], ctx["voie"]
    violations = []
    if not parcelle.contains(bat):
        return [_violation("hors_parcelle", "erreur", "Le bâtiment dépasse les limites de la parcelle.")]
    if bat.distance(parcelle.exterior) < RETRAIT_LATERAL_M - 1e-6:
        violations.append(_violation("retrait_lateral", "erreur",
            f"Retrait inférieur à {RETRAIT_LATERAL_M:g} m par rapport aux limites de la parcelle."))
    if bat.distance(voie) < RETRAIT_VOIE_M - 1e-6:
        violations.append(_violation("retrait_voie", "erreur",
            f"Retrait inférieur à {RETRAIT_VOIE_M:g} m par rapport à la voie d'accès ({props['voie_acces_cote']})."))
    if any(bat.distance(a) < TAMPON_ZONE_NATURELLE_M - 1e-6 for a in ctx["aretes_naturelles"]):
        violations.append(_violation("tampon_zone_naturelle", "erreur",
            f"Le bâtiment empiète sur la bande tampon de {TAMPON_ZONE_NATURELLE_M:g} m de la zone naturelle."))
    existant = ctx["existant"]
    if existant is not None and bat.intersects(existant):
        violations.append(_violation("chevauche_existant", "erreur", "Le bâtiment chevauche le bâti existant."))
    elif existant is not None and bat.distance(existant) < RETRAIT_LATERAL_M - 1e-6:
        violations.append(_violation("proche_existant", "erreur",
            f"Moins de {RETRAIT_LATERAL_M:g} m jusqu'au bâti existant."))
    return violations


def _verifier_ces_et_indice(bat, ctx: dict) -> list[dict]:
    indice, parcelle = ctx["indice"], ctx["parcelle"]
    violations = []
    plafond = _plafond_ces(indice)
    if bat.area > plafond * parcelle.area + 1e-6:
        violations.append(_violation("ces_depasse", "erreur",
            f"Emprise {bat.area:.0f} m² > plafond de {100 * plafond:.0f}% ({plafond * parcelle.area:.0f} m²) "
            f"pour un indice de constructibilité de {indice}."))
    if indice < SEUIL_CONSTRUCTIBLE:
        violations.append(_violation("parcelle_non_recommandee", "avertissement",
            f"Indice de constructibilité {indice} < {SEUIL_CONSTRUCTIBLE:.0f} : construire ici est déconseillé "
            "(sol saturé / risque d'inondation élevé)."))
    return violations


def _verifier_point_collecte(pp, bat, ctx: dict) -> list[dict]:
    if not ctx["parcelle"].contains(pp):
        return [_violation("point_hors_parcelle", "erreur", "Le point de collecte est hors de la parcelle.")]
    violations = []
    if bat is not None and pp.distance(bat) < 3.0:
        violations.append(_violation("point_trop_pres_batiment", "erreur",
            "Le point de collecte est à moins de 3 m du bâtiment."))
    if any(t.contains(pp) for t in ctx["tampons"]):
        violations.append(_violation("point_en_tampon", "erreur",
            "Le point de collecte est dans la bande tampon de la zone naturelle (risque de pollution)."))
    if pp.distance(ctx["voie"]) > 10.0:
        violations.append(_violation("point_eloigne_voie", "avertissement",
            "Le point de collecte est à plus de 10 m de la voie : accès difficile pour les camions."))
    return violations


def evaluer_amenagement_manuel(parcelle_id: str, batiment: dict | None, point_collecte: list | None) -> dict:
    """Vérifie un aménagement dessiné à la main avec les mêmes contraintes que l'optimiseur.

    batiment : {"centre": [lon, lat], "dim_est_ouest_m", "dim_nord_sud_m", "angle_deg"}
    point_collecte : [lon, lat]
    """
    feat = _trouver_parcelle(parcelle_id)
    props = feat["properties"]
    c = shape(feat["geometry"]).centroid
    vers_metres, vers_lonlat = _projecteurs(c.x, c.y)
    parcelle = vers_metres(shape(feat["geometry"]))
    aretes_naturelles = [_arete(parcelle.bounds, cote) for cote in props["zone_naturelle_cotes"]]
    ctx = {
        "props": props, "parcelle": parcelle, "indice": props["indice_constructibilite_0_100"],
        "voie": _arete(parcelle.bounds, props["voie_acces_cote"]),
        "aretes_naturelles": aretes_naturelles,
        "tampons": [a.buffer(TAMPON_ZONE_NATURELLE_M) for a in aretes_naturelles],
        "existant": vers_metres(shape(props["emprise_existante"])) if props.get("emprise_existante") else None,
    }

    violations: list[dict] = []
    metriques: dict = {}
    features: list[dict] = []
    bat = None

    if batiment:
        ctr = vers_metres(Point(batiment["centre"]))
        w, h = batiment["dim_est_ouest_m"], batiment["dim_nord_sud_m"]
        bat = affinity.rotate(box(ctr.x - w / 2, ctr.y - h / 2, ctr.x + w / 2, ctr.y + h / 2),
                              batiment.get("angle_deg", 0), origin=(ctr.x, ctr.y))
        violations += _verifier_batiment(bat, ctx) + _verifier_ces_et_indice(bat, ctx)
        metriques = {
            "emprise_m2": round(bat.area), "ces_pct": round(100 * bat.area / parcelle.area, 1),
            "distance_voie_m": round(bat.distance(ctx["voie"]), 1), **_couts(props, bat.area, w, h),
        }
        features.append({"type": "Feature", "geometry": mapping(vers_lonlat(bat)),
                         "properties": {"parcelle_id": parcelle_id, "type": "batiment_manuel"}})

    if point_collecte:
        pp = vers_metres(Point(point_collecte))
        violations += _verifier_point_collecte(pp, bat, ctx)
        features.append({"type": "Feature", "geometry": mapping(vers_lonlat(pp)),
                         "properties": {"parcelle_id": parcelle_id, "type": "point_collecte_manuel"}})
    elif bat is not None:
        violations.append(_violation("point_collecte_absent", "avertissement",
                                     "Aucun point de collecte des déchets défini."))

    valide = not any(v["severite"] == "erreur" for v in violations)
    for f in features:
        f["properties"]["valide"] = valide

    _, resume_auto = _amenager_parcelle(feat, vers_metres, vers_lonlat)
    comparaison = None
    if resume_auto.get("statut") == "constructible" and metriques:
        comparaison = {
            "emprise_optimale_m2": resume_auto["emprise_m2"],
            "cout_optimal_fcfa": resume_auto["cout_total_estime_fcfa"],
            "distance_voie_optimale_m": resume_auto["distance_voie_m"],
            "ecart_cout_fcfa": metriques["cout_total_estime_fcfa"] - resume_auto["cout_total_estime_fcfa"],
            "ecart_distance_voie_m": round(metriques["distance_voie_m"] - resume_auto["distance_voie_m"], 1),
        }

    return {
        "parcelle_id": parcelle_id,
        "valide": valide,
        "violations": violations,
        "metriques": metriques,
        "comparaison_optimum": comparaison,
        "features": {"type": "FeatureCollection", "features": features},
        "metadata": {"synthetic": True, "source": "Évaluation sur données synthétiques — démonstration, non officiel"},
    }
