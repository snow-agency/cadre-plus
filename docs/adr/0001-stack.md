# 0001 — Choix de la stack technique

## Contexte
Cadre+ doit : traiter des données géographiques (imagerie satellite, cadastre,
réseaux), exposer un moteur de scoring (ICV) et des simulations, afficher des
cartes interactives à des urbanistes et des ministères, et toucher des citoyens
en connexion faible (avec une évolution vers WhatsApp/USSD). L'équipe de départ
est petite (1 ingénieur-dev).

## Décision
- **Backend (`services/api`)** : Python + FastAPI.
  Raison : l'écosystème géospatial/scientifique Python (GeoPandas, Shapely,
  Rasterio, GDAL) est le plus mature pour traiter Sentinel-2, le cadastre et
  calculer l'ICV ; FastAPI donne une API typée (Pydantic) et une doc OpenAPI
  générée automatiquement.
- **Base de données** : PostgreSQL + PostGIS.
  Raison : standard de fait pour les données géographiques, gratuit,
  compatible avec QGIS pour le travail manuel des urbanistes.
- **Web (`apps/web`, tableau de bord ministère/mairies + outil de conception)** :
  Next.js (React + TypeScript) + Tailwind CSS (style) + MapLibre GL
  (cartographie, libre, sans clé API payante).
- **App citoyenne (`apps/citoyen`)** : même stack que `apps/web` mais en PWA
  allégée (pas de carte lourde par défaut), pensée pour fonctionner sur
  connexion faible. Le pont WhatsApp/USSD sera un service séparé
  (`services/messaging`) ajouté plus tard, pas construit maintenant.
- **Scripts de données (`data/`)** : Python (GeoPandas, rasterio, GDAL),
  partagent les mêmes modèles que `services/api`.
- **Monorepo JS** : pnpm workspaces (simple, pas besoin de Turborepo au stade
  MVP).
- **Environnement local** : Docker Compose (Postgres+PostGIS, API, web) pour
  que tout tourne en une commande.

## Conséquences
- Deux écosystèmes à maintenir (Python + TypeScript), mais c'est le choix le
  plus adapté : le SIG et le scoring sont fondamentalement des problèmes
  Python, l'UI cartographique interactive est fondamentalement un problème
  JS/React. Les types d'API sont le contrat entre les deux (OpenAPI).
- Pas de framework mobile natif pour l'instant : l'app citoyenne reste web/PWA
  tant que l'usage WhatsApp/USSD n'est pas prioritaire.

## Amendement (bootstrap initial)
`pnpm` nécessite des droits administrateur sur la machine de développement
actuelle (corepack ne peut pas écrire dans `Program Files`). En attendant,
on utilise **npm workspaces** (strictement équivalent pour nos besoins au
stade MVP). À revoir si pnpm devient disponible.

## Alternatives écartées
- Django (plus lourd, son ORM est moins naturel avec PostGIS que
  GeoAlchemy2+FastAPI pour une API pensée API-first).
- Tout-JS (Node + Turf.js) : écosystème géospatial bien plus pauvre que Python
  pour le traitement d'images satellite et les calculs scientifiques de l'ICV.
