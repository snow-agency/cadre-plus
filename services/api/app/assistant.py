"""Assistant IA de décision : questions libres, et avis d'ingénieur-conseil sur
un aménagement ou un plan d'investissement construit à la main.

L'IA ne remplace pas la décision humaine : elle répond et commente en se
basant uniquement sur les données exposées par l'API (actuellement
synthétiques — voir docs/adr/0002-donnees-synthetiques.md).
"""
import json

from . import ai_client, data_access, investissements

TAILLE_MAX_PAYLOAD = 20_000

FORMAT = (
    "\n\nFormat : texte brut, sans aucun Markdown (ni titres, ni gras, ni astérisques). "
    "Tu peux lister avec des tirets simples « - » en début de ligne. 120 mots maximum."
)

SYSTEM_PROMPT = """Tu es l'assistant du tableau de bord Cadre+ pour le \
Ministère du Cadre de Vie du Bénin. Réponds en français, de façon directe \
et concise (5-8 phrases maximum), en te basant UNIQUEMENT sur les données \
fournies ci-dessous. Si la question ne peut pas être répondue avec ces \
données, dis-le clairement plutôt que d'inventer. Rappelle que ces données \
sont synthétiques (démonstration), pas officielles.

Données disponibles :
{context}
"""

SYSTEM_PROMPTS_AVIS = {
    "amenagement": """Tu es un ingénieur-conseil en aménagement et géotechnique. On te donne \
l'évaluation d'un aménagement de parcelle dessiné à la main par l'utilisateur \
(contraintes violées, métriques, comparaison avec l'optimum calculé automatiquement). \
En français, en 6-8 phrases maximum : 1) un verdict clair (acceptable / à corriger), \
2) les corrections concrètes et chiffrées à apporter (déplacer, réduire, pivoter), \
3) les points de vigilance techniques (portance du sol, risque d'inondation, drainage, \
accès des camions de collecte). N'invente aucune donnée absente de l'évaluation. \
Rappelle brièvement que les données sont synthétiques (démonstration).""",
    "investissements": """Tu es un conseiller en programmation d'investissements publics. On te donne \
un plan d'investissement (mode manuel, mixte ou automatique, budget, plan par quartier, écart \
avec l'optimum calculé et avec une stratégie naïve). En français, en 6-8 phrases maximum : \
1) forces et faiblesses du plan, 2) lecture sous l'angle de l'équité entre quartiers, \
3) ajustements concrets proposés (ex. déplacer une part du budget d'un quartier vers un autre, \
regrouper des chantiers de réseaux), 4) risques. N'invente aucune donnée absente du plan. \
Rappelle brièvement que les données sont synthétiques (démonstration).""",
}


class PayloadTropGros(ValueError):
    pass


def _build_context() -> str:
    icv = data_access.get_icv()
    parcelles = data_access.get_conception_assistee()

    lignes = ["Quartiers (Indice de Cadre de Vie 0-100, population, indicateurs bruts) :"]
    for feat in icv["features"]:
        p = feat["properties"]
        b = p["indicateurs_bruts"]
        lignes.append(
            f"- {p['nom_quartier']} : ICV {p['icv']}, {p['population']} hab. ; accès école {b['temps_acces_ecole_min']} min, "
            f"santé {b['temps_acces_sante_min']} min, eau {b['temps_acces_eau_min']} min ; électrification "
            f"{b['taux_electrification_pct']}% ; drainage {b['score_drainage_0_10']}/10 ; collecte déchets "
            f"{b['couverture_collecte_dechets_pct']}% ; espaces verts {b['espaces_verts_pct_surface']}% ; "
            f"risque d'inondation {b['risque_inondation_0_10']}/10"
        )

    lignes.append("\nParcelles (module Conception assistée, Togba) :")
    for feat in parcelles["features"]:
        p = feat["properties"]
        lignes.append(
            f"- {p['nom']} : indice de constructibilité {p['indice_constructibilite_0_100']} — {p['recommandation']}"
        )

    plan = investissements.calculer_arbitrage(5000, 0.5)["plan"]
    lignes.append("\nPlan d'investissement optimal de référence (budget 5 000 M FCFA, équité 0,5) :")
    for q in plan["quartiers"]:
        leviers = ", ".join(l["label"] for l in q["leviers"]) or "aucun"
        lignes.append(f"- {q['nom']} : {leviers} (coût {q['cout_fcfa'] // 1_000_000} M FCFA, "
                      f"ICV {q['icv_avant']} -> {q['icv_apres']})")
    return "\n".join(lignes)


def answer_question(question: str) -> str:
    return ai_client.complete(SYSTEM_PROMPT.format(context=_build_context()) + FORMAT, question)


def commenter(type_: str, payload: dict) -> str:
    """Avis d'ingénieur-conseil sur une évaluation produite par l'API (aménagement ou plan)."""
    texte = json.dumps(payload, ensure_ascii=False)
    if len(texte) > TAILLE_MAX_PAYLOAD:
        raise PayloadTropGros(f"Contenu trop volumineux ({len(texte)} caractères, max {TAILLE_MAX_PAYLOAD}).")
    return ai_client.complete(SYSTEM_PROMPTS_AVIS[type_] + FORMAT, f"Données à commenter :\n{texte}")
