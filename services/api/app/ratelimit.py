"""Limitation de débit des appels IA : protège le crédit du fournisseur contre les abus.

Deux plafonds par fenêtre glissante d'une heure : par adresse IP, et global (au cas où
l'adresse serait falsifiée). Les compteurs sont en mémoire : valables pour une seule
instance du service, ce qui correspond au déploiement actuel.
"""
import os
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

FENETRE_S = 3600
LIMITE_PAR_IP = int(os.environ.get("AI_RATE_LIMIT_PER_HOUR", "30"))
LIMITE_GLOBALE = int(os.environ.get("AI_GLOBAL_LIMIT_PER_HOUR", "300"))
MAX_ADRESSES_SUIVIES = 10_000

_par_ip: dict[str, deque] = defaultdict(deque)
_global: deque = deque()


def reinitialiser() -> None:
    _par_ip.clear()
    _global.clear()


def _purger(file: deque, maintenant: float) -> None:
    while file and maintenant - file[0] > FENETRE_S:
        file.popleft()


def adresse_client(request: Request) -> str:
    transmis = request.headers.get("x-forwarded-for")
    if transmis:
        return transmis.split(",")[0].strip()
    return request.client.host if request.client else "inconnue"


def limiter_ia(request: Request) -> None:
    maintenant = time.monotonic()
    if len(_par_ip) > MAX_ADRESSES_SUIVIES:
        for ip in [ip for ip, f in _par_ip.items() if not f or maintenant - f[-1] > FENETRE_S]:
            del _par_ip[ip]

    file = _par_ip[adresse_client(request)]
    _purger(file, maintenant)
    _purger(_global, maintenant)

    if len(_global) >= LIMITE_GLOBALE:
        raise HTTPException(429, "Le service IA a atteint sa limite horaire. Réessayez plus tard.",
                            headers={"Retry-After": str(FENETRE_S)})
    if len(file) >= LIMITE_PAR_IP:
        raise HTTPException(429, f"Trop de demandes à l'IA depuis votre adresse (maximum {LIMITE_PAR_IP} par heure).",
                            headers={"Retry-After": str(int(FENETRE_S - (maintenant - file[0])) + 1)})
    file.append(maintenant)
    _global.append(maintenant)
