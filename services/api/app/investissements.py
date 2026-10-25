"""Module « Arbitrage des investissements ».

Pour un budget donné, choisit par quartier l'ensemble de leviers à financer
qui maximise la valeur du plan, par optimisation exacte (sac à dos à choix
multiples : un seul ensemble de leviers par quartier).

Valeur d'un plan = somme sur les quartiers de population x gain d'ICV x
facteur d'équité, avec facteur d'équité = 1 + équité x (100 - ICV) / 50.
`equite = 0` : efficacité pure (personnes x points d'ICV) ; `equite = 1` :
les quartiers défavorisés comptent jusqu'à ~2,3 fois plus.

Coordination des chantiers : quand au moins deux leviers « réseau »
(drainage, électrification, eau) sont réalisés dans le même quartier, une
remise s'applique sur leur coût cumulé (une seule ouverture de voirie).
Le drainage réduit aussi le risque d'inondation (co-bénéfice).

Tous les coûts unitaires sont des hypothèses synthétiques, à remplacer par
des barèmes réels avant tout usage décisionnel.
"""
import math
from itertools import combinations

from . import data_access

DELTA_POINTS = 25.0
REMISE_COORDINATION = 0.12
UNITE_FCFA = 10_000_000

# cout : FCFA par habitant et par point de sous-score gagné (avant facteur de saturation)
# effets : sous-scores améliorés en plus (coefficient x delta du levier)
LEVIERS = {
    "drainage": {"label": "Drainage et assainissement", "cout": 900, "reseau": True,
                 "effets": {"inondation": 0.5}},
    "electrification": {"label": "Extension du réseau électrique", "cout": 600, "reseau": True, "effets": {}},
    "eau": {"label": "Accès à l'eau potable", "cout": 700, "reseau": True, "effets": {}},
    "dechets": {"label": "Collecte des déchets", "cout": 250, "reseau": False, "effets": {}},
    "ecole": {"label": "Écoles de proximité", "cout": 550, "reseau": False, "effets": {}},
    "sante": {"label": "Centres de santé", "cout": 700, "reseau": False, "effets": {}},
    "espaces_verts": {"label": "Espaces verts (foncier inclus)", "cout": 800, "reseau": False, "effets": {}},
}


def _facteur_equite(icv: float, equite: float) -> float:
    return 1 + equite * (100.0 - icv) / 50.0


def _leviers_disponibles(quartier: dict, poids: dict) -> list[dict]:
    p = quartier["properties"]
    scores = p["sous_scores_normalises_0_100"]
    leviers = []
    for cle, lev in LEVIERS.items():
        delta = min(DELTA_POINTS, 100.0 - scores[cle])
        if delta < 1:
            continue
        gain = poids[cle] * delta
        for cible, coef in lev["effets"].items():
            gain += poids[cible] * min(coef * delta, 100.0 - scores[cible])
        leviers.append({
            "levier": cle, "label": lev["label"], "reseau": lev["reseau"], "delta_points": delta,
            # le coût par point augmente quand le sous-score approche de 100 (rendements décroissants)
            "cout_brut_fcfa": p["population"] * lev["cout"] * delta * (1 + scores[cle] / 100),
            "gain_icv": gain,
        })
    return leviers


def _option(leviers: list[dict], quartier: dict, equite: float) -> dict:
    p = quartier["properties"]
    cout_reseau = sum(l["cout_brut_fcfa"] for l in leviers if l["reseau"])
    nb_reseau = sum(1 for l in leviers if l["reseau"])
    remise = REMISE_COORDINATION * cout_reseau if nb_reseau >= 2 else 0.0
    gain = sum(l["gain_icv"] for l in leviers)
    benefice = p["population"] * gain
    return {
        "leviers": list(leviers), "cout": sum(l["cout_brut_fcfa"] for l in leviers) - remise,
        "remise": remise, "gain_icv": gain, "benefice": benefice,
        "valeur": benefice * _facteur_equite(p["icv"], equite),
    }


def _pareto(options: list[dict]) -> list[dict]:
    garde, meilleur = [], -1.0
    for o in sorted(options, key=lambda o: (o["cout"], -o["valeur"])):
        if o["valeur"] > meilleur:
            garde.append(o)
            meilleur = o["valeur"]
    return garde


def _options_quartier(dispo: list[dict], quartier: dict, equite: float) -> list[dict]:
    options = [_option(list(c), quartier, equite)
               for r in range(len(dispo) + 1) for c in combinations(dispo, r)]
    return _pareto(options)


def _optimiser(options_par_quartier: list[list[dict]], budget_unites: int) -> list[dict]:
    n = len(options_par_quartier)
    dp = [0.0] * (budget_unites + 1)
    choix = []
    for opts in options_par_quartier:
        nouveau, pick = dp[:], [None] * (budget_unites + 1)
        for idx, o in enumerate(opts):
            cu = math.ceil(o["cout"] / UNITE_FCFA)
            for b in range(cu, budget_unites + 1):
                v = dp[b - cu] + o["valeur"]
                if v > nouveau[b] + 1e-9:
                    nouveau[b], pick[b] = v, (idx, cu)
        dp, choix = nouveau, choix + [pick]
    selection, b = [None] * n, budget_unites
    for i in range(n - 1, -1, -1):
        pick = choix[i][b]
        if pick is None:
            selection[i] = _option([], {"properties": {"population": 0, "icv": 100}}, 0)
        else:
            idx, cu = pick
            selection[i] = options_par_quartier[i][idx]
            b -= cu
    return selection


def _strategie_naive(quartiers: list[dict], dispos: list[list[dict]], budget_fcfa: float, equite: float) -> list[dict]:
    """Quartiers les plus défavorisés d'abord ; leviers ajoutés un par un tant que le budget le permet."""
    selection = [_option([], q, equite) for q in quartiers]
    reste = budget_fcfa
    for i in sorted(range(len(quartiers)), key=lambda i: quartiers[i]["properties"]["icv"]):
        retenus = []
        for lev in dispos[i]:
            candidat = _option(retenus + [lev], quartiers[i], equite)
            if candidat["cout"] - selection[i]["cout"] <= reste:
                reste -= candidat["cout"] - selection[i]["cout"]
                retenus.append(lev)
                selection[i] = candidat
    return selection


def _resume(quartiers: list[dict], selection: list[dict]) -> dict:
    pop_totale = sum(q["properties"]["population"] for q in quartiers)
    cout = sum(s["cout"] for s in selection)
    benefice = sum(s["benefice"] for s in selection)
    return {
        "cout_total_fcfa": round(cout),
        "benefice_personnes_x_points_icv": round(benefice),
        "valeur_ponderee_equite": round(sum(s["valeur"] for s in selection)),
        "gain_icv_moyen_pondere": round(benefice / pop_totale, 2),
        "benefice_par_million_fcfa": round(benefice / (cout / 1e6)) if cout else 0,
    }


class QuartierInconnu(KeyError):
    pass


class LevierInconnu(ValueError):
    pass


def _plan_quartiers(quartiers: list[dict], selection: list[dict], origine: list[str]) -> list[dict]:
    plan = []
    for q, s, o in zip(quartiers, selection, origine):
        p = q["properties"]
        plan.append({
            "id": p["id"], "nom": p["nom_quartier"], "population": p["population"], "origine": o,
            "icv_avant": p["icv"], "icv_apres": round(min(100.0, p["icv"] + s["gain_icv"]), 1),
            "cout_fcfa": round(s["cout"]), "economie_coordination_fcfa": round(s["remise"]),
            "leviers": [{"levier": l["levier"], "label": l["label"], "gain_icv": round(l["gain_icv"], 2)}
                        for l in s["leviers"]],
        })
    return plan


def calculer_plan(budget_mfcfa: int, equite: float = 0.5, imposes: dict[str, list[str]] | None = None,
                  completer_auto: bool = True) -> dict:
    """Plan d'investissement.

    imposes : {id_quartier: [leviers]} décidés à la main (liste vide = « ne rien financer là »).
    completer_auto : l'optimiseur répartit le budget restant sur les autres quartiers.
    Sans `imposes` et avec `completer_auto`, c'est le plan optimal.
    """
    imposes = imposes or {}
    icv = data_access.get_icv()
    quartiers = icv["features"]
    poids = icv["metadata"]["poids_icv"]
    index = {q["properties"]["id"]: i for i, q in enumerate(quartiers)}
    for qid, leviers in imposes.items():
        if qid not in index:
            raise QuartierInconnu(qid)
        for lev in leviers:
            if lev not in LEVIERS:
                raise LevierInconnu(lev)

    budget_fcfa = budget_mfcfa * 1_000_000
    dispos = [_leviers_disponibles(q, poids) for q in quartiers]
    n = len(quartiers)
    selection: list[dict | None] = [None] * n
    origine = ["aucun"] * n
    avertissements: list[str] = []

    for qid, leviers in imposes.items():
        i = index[qid]
        par_cle = {d["levier"]: d for d in dispos[i]}
        retenus = []
        for lev in dict.fromkeys(leviers):
            if lev in par_cle:
                retenus.append(par_cle[lev])
            else:
                avertissements.append(
                    f"{quartiers[i]['properties']['nom_quartier']} : le levier « {LEVIERS[lev]['label']} » "
                    "n'apporte plus rien (sous-score déjà au maximum).")
        selection[i] = _option(retenus, quartiers[i], equite)
        origine[i] = "manuel"

    cout_impose = sum(s["cout"] for s in selection if s is not None)
    reste = budget_fcfa - cout_impose
    depasse = reste < 0
    libres = [i for i in range(n) if selection[i] is None]
    if completer_auto and not depasse and libres:
        options = [_options_quartier(dispos[i], quartiers[i], equite) for i in libres]
        for i, s in zip(libres, _optimiser(options, math.floor(reste / UNITE_FCFA))):
            selection[i] = s
            origine[i] = "auto" if s["leviers"] else "aucun"
    else:
        for i in libres:
            selection[i] = _option([], quartiers[i], equite)
    if depasse:
        avertissements.append("Les leviers imposés dépassent le budget : aucun complément automatique n'a été calculé.")

    pop_totale = sum(q["properties"]["population"] for q in quartiers)
    icv_avant = sum(q["properties"]["icv"] * q["properties"]["population"] for q in quartiers) / pop_totale
    resume = _resume(quartiers, selection)
    naive = _strategie_naive(quartiers, dispos, budget_fcfa, equite)
    resume_naive = _resume(quartiers, naive)

    reference = None
    if imposes or not completer_auto:
        optimal = calculer_plan(budget_mfcfa, equite)["plan"]
        reference = {k: optimal[k] for k in ("cout_total_fcfa", "benefice_personnes_x_points_icv",
                                             "valeur_ponderee_equite", "icv_moyen_apres")}

    def _ecart(valeur: int, base: int) -> float | None:
        return round(100 * (valeur / base - 1), 1) if base else None

    return {
        "metadata": {
            "synthetic": True,
            "source": "Arbitrage calculé sur données synthétiques — démonstration, non officiel",
            "leviers": [{"levier": k, "label": v["label"], "reseau": v["reseau"]} for k, v in LEVIERS.items()],
            "hypotheses": {
                "gain_par_levier_points_sous_score": DELTA_POINTS,
                "remise_coordination_reseaux": REMISE_COORDINATION,
                "cout_unitaire_fcfa_par_hab_et_point": {k: v["cout"] for k, v in LEVIERS.items()},
                "note": "Coûts unitaires inventés ; rendements décroissants (coût x (1 + sous-score/100)).",
            },
        },
        "budget_fcfa": budget_fcfa,
        "reste_budget_fcfa": budget_fcfa - resume["cout_total_fcfa"],
        "depasse_budget": depasse,
        "equite": equite,
        "mode": "manuel" if not completer_auto else ("mixte" if imposes else "automatique"),
        "avertissements": avertissements,
        "icv_moyen_avant": round(icv_avant, 1),
        "plan": {**resume, "icv_moyen_apres": round(icv_avant + resume["gain_icv_moyen_pondere"], 1),
                 "quartiers": _plan_quartiers(quartiers, selection, origine)},
        "reference_optimale": reference,
        "ecart_vs_optimum_pct": _ecart(resume["valeur_ponderee_equite"], reference["valeur_ponderee_equite"])
        if reference else 0.0,
        "strategie_naive": {**resume_naive,
                            "icv_moyen_apres": round(icv_avant + resume_naive["gain_icv_moyen_pondere"], 1),
                            "description": "défavorisés d'abord, leviers ajoutés un par un jusqu'à épuisement du budget"},
        "amelioration_vs_naive_pct": _ecart(resume["valeur_ponderee_equite"], resume_naive["valeur_ponderee_equite"]),
    }


def calculer_arbitrage(budget_mfcfa: int, equite: float = 0.5) -> dict:
    return calculer_plan(budget_mfcfa, equite)
