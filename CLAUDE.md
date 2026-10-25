# Cadre+ — mémoire du projet

## Contexte
Proposition spontanée (pas de TDR imposé) que le porteur de projet — ingénieur
géotechnique et développeur, seul pour l'instant — présentera lui-même au
Ministère du Cadre de Vie du Bénin. Les 7 défis du ministère :
1. Anticiper le doublement de la population béninoise.
2. Garantir un accès équitable à un bon cadre de vie.
3. Optimiser les coûts de mise en place d'un bon cadre de vie.
4. Organiser la transition des zones précaires vers des zones mieux structurées.
5. Aménager en conservant les espaces naturels (gestion des déchets incluse).
6. Mobilité et connectivité entre villes, transport multimodal.
7. Climat, au sens large (pas seulement environnemental).

Idée : une plateforme unique (jumeau numérique territorial), un module par défi,
sur une base géographique commune (docs/vision.md). Angle recommandé par le
conseil `llm-council` : présenter un **pilote ancré** (démonstration sur cas
concret, ministère garde la main sur les données et la décision), pas le jumeau
national d'un coup.

## Règles de conception (décidées avec l'utilisateur)
- **L'humain décide, l'IA et l'optimiseur proposent.** Chaque module doit offrir
  le calcul automatique ET la modification manuelle, avec vérification des
  contraintes en direct et comparaison à l'optimum. L'IA relit (avis) mais ne
  décide jamais.
- **Aide intégrée** : chaque fonctionnalité de l'interface a son petit « ? »
  (`apps/web/components/HelpTip.tsx`) et le mode d'emploi
  (`apps/web/app/guide/page.tsx`) doit être mis à jour à chaque nouveauté.
- **Données synthétiques étiquetées** partout (bandeau rouge, popups, réponses
  IA) — ADR 0002. Jamais présentées comme officielles.
- Tout est en français (interface, doc, messages d'erreur).
- **Design system** : `docs/design-system.md` (mélange des styles Sleek + Bento + Enterprise du dépôt
  awesome-design-skills, installés dans `.agents/skills/`). Jetons dans `apps/web/app/globals.css`, échelle
  de l'ICV dans `apps/web/lib/couleurs.ts`. Violet = IA uniquement. Ne pas copier un site tiers.
- **Pages** : `/` page d'accueil (produit), `/app` application cartographique, `/guide` mode d'emploi.
- Ne jamais lire/afficher/committer `services/api/.env` (clé API).

## État des modules (à tenir à jour)
| Module | État |
|---|---|
| ICV + carte des inégalités | Fait (8 quartiers synthétiques d'Abomey-Calavi) |
| Conception assistée | Fait : optimiseur de placement + éditeur manuel + avis IA |
| Arbitrage des investissements | Fait : optimiseur exact (sac à dos), mode auto / mixte / manuel, équité, avis IA |
| Assistant IA conversationnel | Fait (RodiumAI, ADR 0003) |
| Prospective 2050, Résilience/climat, Mobilité multimodale, Transition des quartiers | Pas commencés |
| App citoyenne (`apps/citoyen`) | Pas commencée |
| Données réelles (Neon/PostGIS) | Infos de connexion à venir ; lecture actuelle = fichiers GeoJSON (`services/api/app/data_access.py`, seul fichier à réécrire) |

## Stack (docs/adr/0001-stack.md)
- Backend `services/api` : Python 3.14 + FastAPI + Shapely ; venv dans `services/api/.venv`.
- Web `apps/web` : Next.js 16 (App Router, TypeScript) + Tailwind CSS 4 + MapLibre GL 6.
- IA : RodiumAI (API compatible OpenAI), isolée dans `services/api/app/ai_client.py` (ADR 0003).
- Base de données future : Neon (Postgres serverless) + PostGIS.
- Monorepo : **npm workspaces** (pnpm écarté : droits admin requis sur la machine).
- Données : scripts Python dans `data/` → `data/output/*.geojson`.

## Commandes
- `npm run dev` (racine) : lance web (:3000) ET api (:8001) via `scripts/dev.mjs`.
  Ne pas remplacer par `concurrently`/scripts npm imbriqués : sur cette machine
  `npm run` qui lance l'exe Python du venv via cmd.exe s'arrête silencieusement.
  `predev` copie le worker de MapLibre dans `apps/web/public/maplibre/`.
- `npm run dev:web` / `npm run dev:api` : un seul des deux.
- Tests backend (40) : dans `services/api`, `.venv/Scripts/python.exe -m pytest -q`.
- Tests e2e (navigateur réel, Chromium via Playwright) : dans `apps/web`,
  `npx playwright test` (serveurs déjà lancés ou démarrés automatiquement ;
  `E2E_SHOTS_DIR=<dossier>` pour sauvegarder des captures).
- Typage : dans `apps/web`, `npx tsc --noEmit`.
- Régénérer les données : voir `data/README.md`.

## Déploiement (Vercel + Render)
- Front `apps/web` → **Vercel** (Root Directory = `apps/web`). Variable : `NEXT_PUBLIC_API_URL` =
  URL Render (intégrée au build : redéployer après changement).
- Back `services/api` → **Render** via `render.yaml` (Blueprint, Python 3.13, Frankfurt, plan gratuit :
  mise en veille après 15 min, premier appel lent). Variables : `RODIUM_API_KEY` (secret),
  `RODIUM_API_URL`, `RODIUM_MODEL`, `CORS_ORIGINS` (URL Vercel, sans « / » final),
  `CORS_ORIGIN_REGEX` (optionnel, prévisualisations Vercel), `AI_RATE_LIMIT_PER_HOUR` (30 par IP),
  `AI_GLOBAL_LIMIT_PER_HOUR` (300). L'API lit `data/output/*.geojson` à la racine du dépôt : ces
  fichiers doivent être commités.
- Les appels IA sont limités par adresse IP et globalement (`app/ratelimit.py`, en mémoire : une seule
  instance). Sans cela le point d'accès public vide le crédit du fournisseur IA.
- Test e2e contre un build de production : `NEXT_PUBLIC_E2E=1 npm run build -w @cadre-plus/web`
  (expose la prise de test `window.__cadreMap`), puis `next start`, puis `npx playwright test`.

## Pièges connus
- **Marqueurs MapLibre** : ne jamais réaffecter `el.className` (efface la classe de positionnement de
  MapLibre → pastille en `position: static`, décalée). Utiliser `classList`.
- **Conteneur de carte** : MapLibre force `position: relative` ; donner au conteneur `h-full w-full` dans un
  parent `absolute inset-0`, pas `absolute` directement.
- Aperçu de la page d'accueil (`public/img/apercu-application.jpg`) : se régénère avec
  `CAPTURE_APERCU=1 npx playwright test e2e/apercu.spec.ts` (dans `apps/web`) après un changement visuel.
- Un test e2e (« fiche explicative ») a échoué une fois au tout premier lancement après démarrage du
  serveur, jamais ensuite (30+ exécutions) : `retries: 1` est configuré.
- **MapLibre v6 + Next/Turbopack** : le worker ne se charge pas tout seul
  (« Worker failed to load » → aucune couche GeoJSON). Solution en place :
  `scripts/copy-maplibre-assets.mjs` + `maplibregl.setWorkerUrl(...)` dans
  `CadreMap.tsx`. Un test e2e vérifie que les données se chargent.
- MapLibre v6 : pas d'export par défaut (`import * as maplibregl`).
- Les tests e2e ne jugent pas le rendu visuel : toujours regarder les captures.
- Windows : un port peut rester « occupé » par un PID fantôme (8000 l'a été) ;
  l'API utilise 8001.
- Les couches de données sont ajoutées à `style.load` (pas `load`) : sinon elles attendent toutes les
  tuiles du fond de carte, très lent en connexion faible.
- Fond de carte : tuiles OpenStreetMap (usage léger) ; en production, fournisseur
  dédié via `NEXT_PUBLIC_MAP_STYLE_URL`.

## Conventions
Python : fonctions courtes, pas de dépendance inutile ; tests pytest pour toute
logique métier. TypeScript strict. Pas de commentaires sauf contrainte non
évidente.
