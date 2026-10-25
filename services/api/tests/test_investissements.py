import pytest

from app import investissements as inv

BUDGETS = (0, 1000, 3000, 8000, 20000)


@pytest.mark.parametrize("equite", [0.0, 0.5, 1.0])
def test_budget_respecte_et_zero_budget(equite):
    for b in BUDGETS:
        r = inv.calculer_plan(b, equite)
        assert r["plan"]["cout_total_fcfa"] <= b * 1_000_000
        assert r["reste_budget_fcfa"] >= 0
    zero = inv.calculer_plan(0, equite)
    assert zero["plan"]["cout_total_fcfa"] == 0
    assert all(not q["leviers"] for q in zero["plan"]["quartiers"])


@pytest.mark.parametrize("equite", [0.0, 0.5, 1.0])
def test_optimal_au_moins_aussi_bon_que_la_strategie_naive_et_monotone(equite):
    precedent = -1
    for b in BUDGETS:
        r = inv.calculer_plan(b, equite)
        assert r["plan"]["valeur_ponderee_equite"] >= r["strategie_naive"]["valeur_ponderee_equite"]
        assert r["plan"]["valeur_ponderee_equite"] >= precedent
        precedent = r["plan"]["valeur_ponderee_equite"]


def test_remise_de_coordination_uniquement_si_deux_reseaux():
    r = inv.calculer_plan(20000, 0.5)
    vus_avec_remise = 0
    for q in r["plan"]["quartiers"]:
        nb_reseaux = sum(1 for l in q["leviers"] if inv.LEVIERS[l["levier"]]["reseau"])
        if nb_reseaux >= 2:
            assert q["economie_coordination_fcfa"] > 0
            vus_avec_remise += 1
        else:
            assert q["economie_coordination_fcfa"] == 0
    assert vus_avec_remise > 0


def test_icv_apres_borne():
    for q in inv.calculer_plan(30000, 1.0)["plan"]["quartiers"]:
        assert q["icv_avant"] <= q["icv_apres"] <= 100


def test_mode_mixte_respecte_les_leviers_imposes_et_complete_dans_le_budget():
    r = inv.calculer_plan(8000, 0.5, {"quartier-ouedo": ["eau", "ecole"]})
    assert r["mode"] == "mixte"
    ouedo = next(q for q in r["plan"]["quartiers"] if q["id"] == "quartier-ouedo")
    assert ouedo["origine"] == "manuel"
    assert {l["levier"] for l in ouedo["leviers"]} == {"eau", "ecole"}
    assert any(q["origine"] == "auto" for q in r["plan"]["quartiers"])
    assert r["plan"]["cout_total_fcfa"] <= 8000 * 1_000_000
    assert r["reference_optimale"] is not None
    assert r["ecart_vs_optimum_pct"] <= 0.01


def test_mode_manuel_pur_ne_finance_que_ce_qui_est_impose():
    r = inv.calculer_plan(8000, 0.5, {"quartier-zinvie": ["drainage"]}, completer_auto=False)
    assert r["mode"] == "manuel"
    financés = [q["id"] for q in r["plan"]["quartiers"] if q["leviers"]]
    assert financés == ["quartier-zinvie"]


def test_leviers_imposes_qui_depassent_le_budget():
    r = inv.calculer_plan(100, 0.5, {"quartier-godomey": ["drainage", "eau", "sante"]})
    assert r["depasse_budget"] is True
    assert r["reste_budget_fcfa"] < 0
    assert r["avertissements"]
    assert all(q["origine"] != "auto" for q in r["plan"]["quartiers"])


def test_quartier_vide_impose_empeche_tout_financement_la():
    r = inv.calculer_plan(8000, 0.5, {"quartier-zinvie": []})
    zinvie = next(q for q in r["plan"]["quartiers"] if q["id"] == "quartier-zinvie")
    assert zinvie["leviers"] == [] and zinvie["origine"] == "manuel"


def test_inconnus():
    with pytest.raises(inv.QuartierInconnu):
        inv.calculer_plan(1000, 0.5, {"nope": ["eau"]})
    with pytest.raises(inv.LevierInconnu):
        inv.calculer_plan(1000, 0.5, {"quartier-ouedo": ["magie"]})
