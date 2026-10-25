# services/api

Backend Cadre+ : Python + FastAPI + Shapely (voir docs/adr/0001-stack.md).

## Endpoints
| Méthode | Route | Rôle |
|---|---|---|
| GET | `/health` | état du service |
| GET | `/api/icv` | quartiers + ICV (GeoJSON, poids dans `metadata.poids_icv`) |
| GET | `/api/conception-assistee` | parcelles + indice de constructibilité (GeoJSON) |
| GET | `/api/conception-assistee/amenagement` | aménagement optimal calculé (GeoJSON + `summaries`) |
| POST | `/api/conception-assistee/evaluer` | vérifie un aménagement dessiné à la main (mêmes contraintes que l'optimiseur) |
| GET | `/api/investissements?budget_mfcfa=&equite=` | plan d'investissement optimal |
| POST | `/api/investissements/plan` | plan automatique / mixte / manuel (`imposes`, `completer_auto`) |
| POST | `/api/assistant` | question libre à l'assistant IA |
| POST | `/api/assistant/avis` | avis d'ingénieur-conseil sur un aménagement ou un plan |

Documentation interactive : http://localhost:8001/docs

## Organisation
- `app/data_access.py` : lecture des données (fichiers GeoJSON aujourd'hui ; seul
  fichier à réécrire pour brancher Neon/PostGIS).
- `app/placement.py` : optimiseur de placement + évaluation manuelle.
- `app/investissements.py` : optimiseur d'investissements (sac à dos exact).
- `app/ai_client.py` : appel au fournisseur IA (RodiumAI) ; `app/assistant.py` :
  contexte et consignes des prompts.
- `tests/` : pytest (`.venv/Scripts/python.exe -m pytest -q`).

## Configuration
Copier `.env.example` en `.env` et renseigner `RODIUM_API_KEY` (jamais commité).
Sans clé, tout fonctionne sauf l'IA (erreur 503 explicite).

## Lancer
Depuis la racine du dépôt : `npm run dev` (web + api).
Seul : `npm run dev:api`.
