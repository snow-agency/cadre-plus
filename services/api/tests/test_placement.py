import pytest
from shapely.geometry import shape

from app import data_access, placement


@pytest.fixture(scope="module")
def resultat():
    return placement.calculer_amenagements()


def _par_parcelle(resultat):
    out = {}
    for f in resultat["features"]:
        pid = f["properties"]["parcelle_id"]
        out.setdefault(pid, {}).setdefault(f["properties"]["type"], []).append(f)
    return out


def _en_metres(feature_geom, parcelle_geom):
    c = shape(parcelle_geom).centroid
    vers_metres, _ = placement._projecteurs(c.x, c.y)
    return vers_metres(shape(feature_geom))


def _parcelles():
    return {f["properties"]["id"]: f for f in data_access.get_conception_assistee()["features"]}


def test_toutes_les_parcelles_ont_un_resume(resultat):
    assert {s["parcelle_id"] for s in resultat["summaries"]} == set(_parcelles())


def test_batiment_dans_parcelle_et_sous_plafond_ces(resultat):
    parcelles = _parcelles()
    for pid, elems in _par_parcelle(resultat).items():
        if "batiment" not in elems:
            continue
        parcelle = _en_metres(parcelles[pid]["geometry"], parcelles[pid]["geometry"])
        bat = _en_metres(elems["batiment"][0]["geometry"], parcelles[pid]["geometry"])
        assert parcelle.buffer(0.01).contains(bat)
        indice = parcelles[pid]["properties"]["indice_constructibilite_0_100"]
        plafond = placement.CES_PRIORITAIRE if indice >= placement.SEUIL_PRIORITAIRE else placement.CES_SOUS_CONDITIONS
        assert bat.area <= plafond * parcelle.area + 1e-6


def test_respect_des_retraits(resultat):
    parcelles = _parcelles()
    for pid, elems in _par_parcelle(resultat).items():
        if "batiment" not in elems:
            continue
        g = parcelles[pid]["geometry"]
        parcelle = _en_metres(g, g)
        bat = _en_metres(elems["batiment"][0]["geometry"], g)
        assert bat.distance(parcelle.exterior) >= placement.RETRAIT_LATERAL_M - 0.01
        voie = placement._arete(parcelle.bounds, parcelles[pid]["properties"]["voie_acces_cote"])
        assert bat.distance(voie) >= placement.RETRAIT_VOIE_M - 0.01


def test_pas_de_chevauchement_avec_bati_existant_ni_tampon(resultat):
    parcelles = _parcelles()
    for pid, elems in _par_parcelle(resultat).items():
        if "batiment" not in elems:
            continue
        g = parcelles[pid]["geometry"]
        props = parcelles[pid]["properties"]
        bat = _en_metres(elems["batiment"][0]["geometry"], g)
        if "emprise_existante" in elems:
            existant = _en_metres(elems["emprise_existante"][0]["geometry"], g)
            assert bat.distance(existant) >= placement.RETRAIT_LATERAL_M - 0.01
        parcelle = _en_metres(g, g)
        for cote in props["zone_naturelle_cotes"]:
            arete = placement._arete(parcelle.bounds, cote)
            assert bat.distance(arete) >= placement.TAMPON_ZONE_NATURELLE_M - 0.01


def test_point_de_collecte_accessible_et_hors_tampon(resultat):
    parcelles = _parcelles()
    for pid, elems in _par_parcelle(resultat).items():
        if "point_collecte" not in elems:
            continue
        g = parcelles[pid]["geometry"]
        props = parcelles[pid]["properties"]
        parcelle = _en_metres(g, g)
        point = _en_metres(elems["point_collecte"][0]["geometry"], g)
        bat = _en_metres(elems["batiment"][0]["geometry"], g)
        assert parcelle.contains(point)
        assert point.distance(bat) >= 3.0
        voie = placement._arete(parcelle.bounds, props["voie_acces_cote"])
        assert point.distance(voie) <= placement.DECALAGE_POINT_COLLECTE_M + 0.01
        for cote in props["zone_naturelle_cotes"]:
            arete = placement._arete(parcelle.bounds, cote)
            assert point.distance(arete) >= placement.TAMPON_ZONE_NATURELLE_M - 0.01


def test_parcelle_non_constructible_donne_bassin_sans_batiment(resultat):
    elems = _par_parcelle(resultat)["parcelle-togba-03"]
    assert "batiment" not in elems
    assert "point_collecte" not in elems
    assert "bassin_retention" in elems
    resume = next(s for s in resultat["summaries"] if s["parcelle_id"] == "parcelle-togba-03")
    assert resume["statut"] == "non_constructible"
    assert resume["bassin_volume_m3"] > 0


def test_couts_coherents(resultat):
    for s in resultat["summaries"]:
        if s["statut"] != "constructible":
            continue
        assert s["cout_total_estime_fcfa"] == s["cout_fondation_fcfa"] + s["cout_drainage_fcfa"]
        assert s["drainage_peripherique"] == (s["cout_drainage_fcfa"] > 0)


# --- Mode manuel -----------------------------------------------------------

def _resume_auto(resultat, pid):
    return next(s for s in resultat["summaries"] if s["parcelle_id"] == pid)


def _codes(evaluation):
    return {v["code"] for v in evaluation["violations"]}


def test_proposition_auto_est_valide_en_mode_manuel(resultat):
    for s in resultat["summaries"]:
        if s["statut"] != "constructible":
            continue
        ev = placement.evaluer_amenagement_manuel(
            s["parcelle_id"], s["batiment_param"], s.get("point_collecte_param"))
        assert ev["valide"], ev["violations"]
        assert abs(ev["comparaison_optimum"]["ecart_distance_voie_m"]) < 0.2
        assert abs(ev["comparaison_optimum"]["ecart_cout_fcfa"]) < 0.001 * s["cout_total_estime_fcfa"]


def test_manuel_batiment_hors_parcelle(resultat):
    s = _resume_auto(resultat, "parcelle-togba-01")
    b = {**s["batiment_param"], "centre": [s["batiment_param"]["centre"][0], s["batiment_param"]["centre"][1] + 0.0003]}
    ev = placement.evaluer_amenagement_manuel("parcelle-togba-01", b, None)
    assert not ev["valide"]
    assert "hors_parcelle" in _codes(ev)


def test_manuel_emprise_trop_grande_et_retraits(resultat):
    s = _resume_auto(resultat, "parcelle-togba-01")
    b = {**s["batiment_param"], "dim_est_ouest_m": 45, "dim_nord_sud_m": 50}
    ev = placement.evaluer_amenagement_manuel("parcelle-togba-01", b, s["point_collecte_param"])
    assert {"ces_depasse", "retrait_lateral", "retrait_voie"} <= _codes(ev)


def test_manuel_chevauchement_bati_existant(resultat):
    parcelle = _parcelles()["parcelle-togba-02"]
    existant = shape(parcelle["properties"]["emprise_existante"]).centroid
    b = {"centre": [existant.x, existant.y], "dim_est_ouest_m": 6, "dim_nord_sud_m": 6, "angle_deg": 0}
    ev = placement.evaluer_amenagement_manuel("parcelle-togba-02", b, None)
    assert "chevauche_existant" in _codes(ev)


def test_manuel_point_de_collecte_en_tampon(resultat):
    s = _resume_auto(resultat, "parcelle-togba-02")
    c = shape(_parcelles()["parcelle-togba-02"]["geometry"]).centroid
    _, vers_lonlat = placement._projecteurs(c.x, c.y)
    point_ouest = vers_lonlat(shape({"type": "Point", "coordinates": (-20.0, 0.0)}))
    ev = placement.evaluer_amenagement_manuel(
        "parcelle-togba-02", s["batiment_param"], [point_ouest.x, point_ouest.y])
    assert "point_en_tampon" in _codes(ev)
    assert not ev["valide"]


def test_manuel_parcelle_non_constructible_donne_avertissement_pas_erreur_bloquante(resultat):
    c = shape(_parcelles()["parcelle-togba-03"]["geometry"]).centroid
    b = {"centre": [c.x, c.y], "dim_est_ouest_m": 10, "dim_nord_sud_m": 10, "angle_deg": 0}
    ev = placement.evaluer_amenagement_manuel("parcelle-togba-03", b, None)
    avertissements = {v["code"] for v in ev["violations"] if v["severite"] == "avertissement"}
    assert "parcelle_non_recommandee" in avertissements


def test_manuel_parcelle_inconnue():
    with pytest.raises(placement.ParcelleIntrouvable):
        placement.evaluer_amenagement_manuel("nope", None, None)


def test_voie_d_acces_et_etiquettes(resultat):
    for pid, elems in _par_parcelle(resultat).items():
        voie = elems["voie_acces"][0]
        assert voie["properties"]["etiquette"] == "Voie d'accès"
        parcelle = _parcelles()[pid]["geometry"]
        assert not _en_metres(voie["geometry"], parcelle).intersects(_en_metres(parcelle, parcelle).buffer(-0.01))
        for type_, features in elems.items():
            for f in features:
                if "etiquette" in f["properties"]:
                    lon, lat = f["properties"]["etiquette_lonlat"]
                    assert 2.0 < lon < 3.0 and 6.0 < lat < 7.0


def test_etiquette_du_batiment_donne_les_dimensions(resultat):
    bat = _par_parcelle(resultat)["parcelle-togba-01"]["batiment"][0]["properties"]
    assert bat["etiquette"].startswith("Bâtiment proposé")
    assert "m" in bat["etiquette"]
    assert all("voie_cote" in s for s in resultat["summaries"])
