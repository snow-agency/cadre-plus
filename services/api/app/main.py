import os
from typing import Literal

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import ai_client, assistant, data_access, investissements, placement
from .ratelimit import limiter_ia

app = FastAPI(title="Cadre+ API", version="0.2.0")

def origines_autorisees() -> list[str]:
    brut = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
    return [o.strip().rstrip("/") for o in brut.split(",") if o.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origines_autorisees(),
    allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX") or None,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

Coordonnees = tuple[float, float]


class QuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class BatimentManuel(BaseModel):
    centre: Coordonnees
    dim_est_ouest_m: float = Field(gt=1, le=200)
    dim_nord_sud_m: float = Field(gt=1, le=200)
    angle_deg: float = Field(default=0, ge=-180, le=180)


class AmenagementManuelRequest(BaseModel):
    parcelle_id: str
    batiment: BatimentManuel | None = None
    point_collecte: Coordonnees | None = None


class PlanRequest(BaseModel):
    budget_mfcfa: int = Field(default=5000, ge=0, le=30000)
    equite: float = Field(default=0.5, ge=0, le=1)
    imposes: dict[str, list[str]] = Field(default_factory=dict, description="id quartier -> leviers décidés à la main")
    completer_auto: bool = True


class AvisRequest(BaseModel):
    type: Literal["amenagement", "investissements"]
    payload: dict


def _appel_ia(fonction, *args) -> str:
    try:
        return fonction(*args)
    except ai_client.AIClientNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e))
    except assistant.PayloadTropGros as e:
        raise HTTPException(status_code=413, detail=str(e))
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Le fournisseur IA a échoué : {e}")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/icv")
def icv() -> dict:
    return data_access.get_icv()


@app.get("/api/conception-assistee")
def conception_assistee() -> dict:
    return data_access.get_conception_assistee()


@app.get("/api/conception-assistee/amenagement")
def amenagement() -> dict:
    return placement.calculer_amenagements()


@app.post("/api/conception-assistee/evaluer")
def evaluer_amenagement(body: AmenagementManuelRequest) -> dict:
    try:
        return placement.evaluer_amenagement_manuel(
            body.parcelle_id,
            body.batiment.model_dump() if body.batiment else None,
            list(body.point_collecte) if body.point_collecte else None,
        )
    except placement.ParcelleIntrouvable:
        raise HTTPException(status_code=404, detail=f"Parcelle inconnue : {body.parcelle_id}")


@app.get("/api/investissements")
def arbitrage_investissements(
    budget_mfcfa: int = Query(5000, ge=0, le=30000, description="Budget en millions de FCFA"),
    equite: float = Query(0.5, ge=0, le=1, description="0 = efficacité pure, 1 = priorité forte aux quartiers défavorisés"),
) -> dict:
    return investissements.calculer_arbitrage(budget_mfcfa, equite)


@app.post("/api/investissements/plan")
def plan_investissements(body: PlanRequest) -> dict:
    try:
        return investissements.calculer_plan(body.budget_mfcfa, body.equite, body.imposes, body.completer_auto)
    except investissements.QuartierInconnu as e:
        raise HTTPException(status_code=404, detail=f"Quartier inconnu : {e.args[0]}")
    except investissements.LevierInconnu as e:
        raise HTTPException(status_code=422, detail=f"Levier inconnu : {e.args[0]}")


@app.post("/api/assistant", dependencies=[Depends(limiter_ia)])
def ask_assistant(body: QuestionRequest) -> dict:
    return {"answer": _appel_ia(assistant.answer_question, body.question)}


@app.post("/api/assistant/avis", dependencies=[Depends(limiter_ia)])
def avis_assistant(body: AvisRequest) -> dict:
    return {"answer": _appel_ia(assistant.commenter, body.type, body.payload)}
