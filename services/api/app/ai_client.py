"""Client IA, isolé pour pouvoir changer de fournisseur sans toucher au
reste de l'API. Aujourd'hui : RodiumAI (https://www.rodiumai.io), compatible
avec le format OpenAI Chat Completions (`POST {RODIUM_API_URL}/chat/completions`).

Pour changer de fournisseur plus tard (OpenRouter, Anthropic direct, etc.),
seule la fonction `complete()` doit changer — les routes qui l'appellent
(voir main.py) n'ont pas à changer.
"""
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

RODIUM_API_KEY = os.environ.get("RODIUM_API_KEY")
RODIUM_API_URL = os.environ.get("RODIUM_API_URL", "https://api.rodiumai.io/v1")
RODIUM_MODEL = os.environ.get("RODIUM_MODEL", "anthropic/claude-sonnet-5")


class AIClientNotConfigured(RuntimeError):
    pass


def complete(system_prompt: str, user_prompt: str) -> str:
    """Appelle le modèle configuré et renvoie le texte de la réponse."""
    if not RODIUM_API_KEY:
        raise AIClientNotConfigured(
            "RODIUM_API_KEY manquante — copier services/api/.env.example en "
            ".env et renseigner la vraie clé."
        )

    response = httpx.post(
        f"{RODIUM_API_URL}/chat/completions",
        headers={"Authorization": f"Bearer {RODIUM_API_KEY}"},
        json={
            "model": RODIUM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        },
        timeout=30.0,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]
