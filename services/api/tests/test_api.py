from fastapi.testclient import TestClient

from app import ai_client, main

client = TestClient(main.app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_icv_et_conception_assistee():
    icv = client.get("/api/icv").json()
    assert len(icv["features"]) == 8
    assert icv["metadata"]["synthetic"] is True
    assert len(client.get("/api/conception-assistee").json()["features"]) == 3


def test_amenagement():
    data = client.get("/api/conception-assistee/amenagement").json()
    assert len(data["summaries"]) == 3
    assert data["metadata"]["synthetic"] is True


def test_assistant_sans_cle_renvoie_503(monkeypatch):
    monkeypatch.setattr(ai_client, "RODIUM_API_KEY", None)
    r = client.post("/api/assistant", json={"question": "test"})
    assert r.status_code == 503


def test_assistant_avec_reponse_simulee(monkeypatch):
    captured = {}

    def faux_complete(system_prompt, user_prompt):
        captured["system"] = system_prompt
        captured["user"] = user_prompt
        return "réponse simulée"

    monkeypatch.setattr(ai_client, "complete", faux_complete)
    r = client.post("/api/assistant", json={"question": "Quel quartier ?"})
    assert r.status_code == 200
    assert r.json() == {"answer": "réponse simulée"}
    assert "Ouèdo" in captured["system"]
    assert "sans aucun Markdown" in captured["system"]
    assert captured["user"] == "Quel quartier ?"


def test_evaluer_amenagement_manuel_endpoint():
    auto = client.get("/api/conception-assistee/amenagement").json()
    s = next(x for x in auto["summaries"] if x["parcelle_id"] == "parcelle-togba-01")
    r = client.post("/api/conception-assistee/evaluer", json={
        "parcelle_id": "parcelle-togba-01", "batiment": s["batiment_param"],
        "point_collecte": s["point_collecte_param"]})
    assert r.status_code == 200 and r.json()["valide"] is True
    assert len(r.json()["features"]["features"]) == 2


def test_evaluer_amenagement_parcelle_inconnue_et_validation():
    assert client.post("/api/conception-assistee/evaluer", json={"parcelle_id": "x"}).status_code == 404
    mauvais = {"parcelle_id": "parcelle-togba-01",
               "batiment": {"centre": [2.3, 6.4], "dim_est_ouest_m": -5, "dim_nord_sud_m": 10}}
    assert client.post("/api/conception-assistee/evaluer", json=mauvais).status_code == 422


def test_plan_investissements_endpoint():
    r = client.post("/api/investissements/plan", json={
        "budget_mfcfa": 5000, "imposes": {"quartier-ouedo": ["eau"]}, "completer_auto": True})
    assert r.status_code == 200
    assert r.json()["mode"] == "mixte"
    assert client.post("/api/investissements/plan", json={"imposes": {"nope": []}}).status_code == 404
    assert client.post("/api/investissements/plan", json={"imposes": {"quartier-ouedo": ["magie"]}}).status_code == 422
    assert client.post("/api/investissements/plan", json={"budget_mfcfa": 10**9}).status_code == 422
    assert client.get("/api/investissements?budget_mfcfa=99999").status_code == 422


def test_avis_ia_utilise_le_bon_prompt_et_le_payload(monkeypatch):
    captured = {}

    def faux_complete(system_prompt, user_prompt):
        captured.update(system=system_prompt, user=user_prompt)
        return "avis simulé"

    monkeypatch.setattr(ai_client, "complete", faux_complete)
    r = client.post("/api/assistant/avis", json={"type": "amenagement", "payload": {"valide": False}})
    assert r.status_code == 200 and r.json() == {"answer": "avis simulé"}
    assert "ingénieur-conseil" in captured["system"] and '"valide": false' in captured["user"]
    assert "sans aucun Markdown" in captured["system"]
    assert client.post("/api/assistant/avis", json={"type": "autre", "payload": {}}).status_code == 422


def test_avis_ia_payload_trop_gros_et_fournisseur_en_panne(monkeypatch):
    monkeypatch.setattr(ai_client, "complete", lambda *a: "ok")
    gros = {"type": "investissements", "payload": {"x": "a" * 25_000}}
    assert client.post("/api/assistant/avis", json=gros).status_code == 413

    def en_panne(*a):
        import httpx
        raise httpx.ConnectError("boom")

    monkeypatch.setattr(ai_client, "complete", en_panne)
    assert client.post("/api/assistant", json={"question": "test"}).status_code == 502


def test_limitation_de_debit_ia_par_adresse(monkeypatch):
    from app import ratelimit
    monkeypatch.setattr(ai_client, "complete", lambda *a: "ok")
    monkeypatch.setattr(ratelimit, "LIMITE_PAR_IP", 2)
    entetes = {"x-forwarded-for": "203.0.113.7"}
    for _ in range(2):
        assert client.post("/api/assistant", json={"question": "q"}, headers=entetes).status_code == 200
    r = client.post("/api/assistant", json={"question": "q"}, headers=entetes)
    assert r.status_code == 429 and "Retry-After" in r.headers
    autre = {"x-forwarded-for": "198.51.100.9"}
    assert client.post("/api/assistant", json={"question": "q"}, headers=autre).status_code == 200


def test_limitation_de_debit_ia_globale_et_endpoints_non_concernes(monkeypatch):
    from app import ratelimit
    monkeypatch.setattr(ai_client, "complete", lambda *a: "ok")
    monkeypatch.setattr(ratelimit, "LIMITE_GLOBALE", 1)
    assert client.post("/api/assistant", json={"question": "q"}, headers={"x-forwarded-for": "1.1.1.1"}).status_code == 200
    assert client.post("/api/assistant/avis", json={"type": "amenagement", "payload": {}},
                       headers={"x-forwarded-for": "2.2.2.2"}).status_code == 429
    for _ in range(5):
        assert client.get("/api/icv").status_code == 200


def test_origines_cors_configurables(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://cadre-plus.vercel.app/, https://autre.example")
    assert main.origines_autorisees() == ["https://cadre-plus.vercel.app", "https://autre.example"]
    monkeypatch.delenv("CORS_ORIGINS")
    assert main.origines_autorisees() == ["http://localhost:3000"]
