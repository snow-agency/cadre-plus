# 0003 — Première intégration IA : assistant conversationnel de décision

## Contexte
Avant cette décision, aucune IA n'était utilisée dans le projet : l'ICV et
« Conception assistée » reposent sur des formules déterministes (pondération,
seuils). Le besoin identifié : démontrer concrètement la valeur d'un outil
« d'aide à la décision » pour le ministère, avec un effort proportionné à une
équipe d'un développeur solo.

## Décision
Premier cas d'usage IA implémenté : un **assistant conversationnel** qui
répond en français à des questions libres sur les données ICV / Conception
assistée exposées par l'API, en citant les vrais chiffres (synthétiques pour
l'instant). Endpoint : `POST /api/assistant`.

Fournisseur : **RodiumAI** (https://www.rodiumai.io), compatible avec le
format OpenAI Chat Completions. Clés dans `services/api/.env` (voir
`.env.example`, jamais commité) :
```
RODIUM_API_KEY=...
RODIUM_API_URL=https://api.rodiumai.io/v1
RODIUM_MODEL=anthropic/claude-sonnet-5
```

## Conséquences
- L'appel au fournisseur est isolé dans `app/ai_client.py` (une seule
  fonction `complete()`). Changer de fournisseur (OpenRouter, Anthropic
  direct, etc.) ne touche que ce fichier.
- La construction du contexte (quelles données on donne au modèle) est
  isolée dans `app/assistant.py`, séparée de l'appel réseau — permet de faire
  évoluer le "RAG" (aujourd'hui : tout le contenu des deux jeux de données,
  très petit) sans toucher au client IA.
- Le prompt système rappelle explicitement au modèle que les données sont
  synthétiques — cohérent avec docs/adr/0002-donnees-synthetiques.md,
  évite que l'assistant donne l'illusion de répondre avec des données
  officielles.
- Si `RODIUM_API_KEY` n'est pas configurée, l'endpoint renvoie une erreur
  503 claire plutôt que de planter l'API.
- RodiumAI est un service tiers peu connu (pas de retour d'expérience
  indépendant) : ne pas lui envoyer de données sensibles/réelles avant
  d'avoir vérifié ses conditions d'utilisation et sa politique de rétention,
  en particulier une fois les vraies données (Neon) connectées.

## Prochaines étapes IA envisagées (non implémentées)
Par ordre de priorité suggéré :
1. Génération de rapports/recommandations en langage naturel (enrichir ce
   qui est aujourd'hui des chaînes if/else dans `generate_conception_assistee.py`).
2. Classification des signalements citoyens (futur module `apps/citoyen`).
3. Détection de bâti/occupation du sol depuis l'imagerie satellite (vision).
4. Optimisation spatiale réelle du placement/dimensionnement des bâtiments
   (recherche opérationnelle, plus gros chantier).
