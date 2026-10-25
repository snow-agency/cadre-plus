# data

Scripts d'import et de traitement des données géographiques (Sentinel-2,
OpenStreetMap, cadastre ANDF, recensements INStaD, réseaux eau/électricité).
Python (GeoPandas, rasterio, GDAL) — voir docs/adr/0001-stack.md.

## Données synthétiques (phase actuelle)

Tant qu'aucun partenariat de données officiel n'est signé, on travaille avec
des données **synthétiques mais réalistes** — voir
docs/adr/0002-donnees-synthetiques.md. Toujours les étiqueter comme telles
dans toute interface ou présentation.

- `generate_icv.py` → `output/icv_abomey_calavi.{geojson,csv}` : 8 quartiers
  d'Abomey-Calavi (positions réelles issues d'OpenStreetMap, carrés
  illustratifs, valeurs inventées), population, et Indice de Cadre de Vie
  (ICV) ; les poids de l'ICV sont exposés dans `metadata.poids_icv`.
- `generate_conception_assistee.py` → `output/conception_assistee_togba.geojson` :
  3 parcelles fictives à l'échelle réelle (dimensions en mètres) autour de
  Togba (bon sol / mixte / bas-fond), avec indice de constructibilité, côté de
  la voie d'accès, côtés de zone naturelle et bâti existant.

Ces deux scripts ne dépendent que de la bibliothèque standard Python (pas de
GeoPandas/Shapely requis pour l'instant) : volontaire, pour rester exécutables
même sans environnement Python complet installé.

Les fichiers de `output/` sont produits par ces scripts ; ne pas les éditer à
la main. Pour les régénérer, depuis `data/` :
```
../services/api/.venv/Scripts/python.exe generate_icv.py
../services/api/.venv/Scripts/python.exe generate_conception_assistee.py
```
