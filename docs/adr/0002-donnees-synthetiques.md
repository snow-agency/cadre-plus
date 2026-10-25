# 0002 — Données mockées/synthétiques pour la phase de démonstration

## Contexte
Le conseil (voir résumé dans l'historique du projet) a identifié un risque fatal
pour toute démo construite sur des données officielles réelles (cadastre ANDF,
recensements INStaD) : ces couches sont réputées incomplètes/obsolètes au
Bénin, et une erreur visible en présentation unique (ex. recommander un point
de collecte en zone inondable connue d'un fonctionnaire présent) détruit la
crédibilité du porteur de projet solo. Par ailleurs, l'accès légal à ces
données officielles n'est pas encore obtenu (pas de partenariat signé avec
ANDF/INStaD/mairies à ce stade).

## Décision
Tant qu'aucun partenariat de données officiel n'est signé, Cadre+ utilise des
données **synthétiques mais réalistes** (générées pour ressembler aux
distributions et contraintes réelles du Bénin — tailles de parcelles, types de
sol, zones inondables, densité, réseaux — sans prétendre être des données
officielles).

## Conséquences
- **Toujours étiqueter explicitement** toute donnée synthétique comme telle
  dans l'interface et dans toute présentation ("données illustratives /
  simulées en attendant l'accès aux données officielles") — ne jamais laisser
  croire au ministère qu'il s'agit de données réelles. C'est une question de
  crédibilité (et d'éthique) directement liée au risque identifié par le
  conseil.
- Lève le risque de contradiction publique sur un cas réel connu des
  fonctionnaires présents.
- N'élimine pas le besoin, nommé par le conseil, de clarifier à terme la
  gouvernance des données et la responsabilité juridique si l'outil doit un
  jour s'appuyer sur des données officielles — ce sujet reste ouvert pour la
  suite des discussions avec le ministère.
- Les générateurs de données synthétiques (scripts Python dans `data/`)
  doivent documenter leurs hypothèses (distributions utilisées, sources
  d'inspiration réalistes) pour pouvoir être remplacés proprement par de vraies
  données plus tard, sans changer le schéma consommé par `services/api`.
