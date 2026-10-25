# Cadre+ — Vision

## Problème
Le Ministère (Bénin) fait face à 7 défis liés au cadre de vie : croissance
démographique, équité d'accès, maîtrise des coûts, résorption des zones précaires,
aménagement respectueux de l'environnement, mobilité/connectivité interurbaine,
et climat au sens large.

## Idée centrale
Un jumeau numérique territorial (« Cadre+ ») : une représentation virtuelle du
territoire, alimentée en continu, permettant de simuler avant de construire.

### Couches
1. Base de données géographique commune (Sentinel-2, cadastre ANDF, recensements
   INStaD, OpenStreetMap, réseaux eau/électricité/drainage, données opérateurs
   mobiles anonymisées, signalements citoyens).
2. Moteurs d'analyse et de simulation (un module par problème, voir ci-dessous).
3. Interfaces : tableau de bord ministère/mairies, outil de conception pour
   urbanistes, application citoyenne.

### Modules (un par problème du ministère)
| # | Problème | Module |
|---|----------|--------|
| 1 | Doublement de la population | Prospective 2050 |
| 2 | Accès équitable | Indice de Cadre de Vie (ICV) + carte des inégalités |
| 3 | Optimisation des coûts | Arbitrage des investissements |
| 4 | Zones précaires | Transition des quartiers |
| 5 | Aménagement / nature / déchets | Conception assistée |
| 6 | Mobilité / connectivité | Mobilité multimodale |
| 7 | Climat (sens large) | Résilience et climat |

L'application citoyenne (signalement, consultation ICV, itinéraires, éco-points,
WhatsApp/USSD multilingue) relie tous les modules côté population.

## Niveaux d'ambition
- **Complet** : jumeau numérique national, porté par le ministère (plusieurs années).
- **MVP réaliste (recommandé pour l'appel à projet)** : ICV + carte des inégalités +
  app de signalement, sur une commune pilote, résultats visibles en 6-12 mois.
- **Outil isolé** : si un seul module doit être présenté, le module « Conception
  assistée » est le plus différenciant (aménagement + déchets + climat + coûts,
  et valorise un profil géotechnique/dev).

## Ce qui reste à valider avant de rédiger le dossier
- Texte exact de l'appel à projet (TDR) : budget plafond, calendrier, format,
  grille d'évaluation.
- Commune(s) pilote(s).
- Partenariats de données (ANDF, INStaD, mairies, opérateurs mobiles) — point
  probable de vigilance des évaluateurs.
- Indicateurs chiffrés de succès (ménages couverts, évolution ICV, délai de
  traitement des signalements, tonnes de déchets mieux collectées, etc.).
- Stack technique.
