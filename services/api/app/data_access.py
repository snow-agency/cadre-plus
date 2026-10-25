"""Couche d'accès aux données.

Phase actuelle : lit les GeoJSON synthétiques dans data/output/ (voir
docs/adr/0002-donnees-synthetiques.md). Quand Neon (Postgres) sera connecté,
seules les deux fonctions ci-dessous changeront d'implémentation (requêtes
PostGIS à la place de la lecture de fichier) — le reste de l'API n'a pas à
changer.
"""
import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "output"


def get_icv() -> dict:
    with open(DATA_DIR / "icv_abomey_calavi.geojson", encoding="utf-8") as f:
        return json.load(f)


def get_conception_assistee() -> dict:
    with open(DATA_DIR / "conception_assistee_togba.geojson", encoding="utf-8") as f:
        return json.load(f)
