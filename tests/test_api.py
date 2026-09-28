from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["stations_loaded"] > 0


def test_recommend_endpoint_happy_path():
    payload = {
        "current_location": {"latitude": 28.6139, "longitude": 77.2090},
        "destination": {"latitude": 28.5355, "longitude": 77.3910},
        "current_soc": 0.35,
        "target_destination_soc": 0.80,
        "battery_capacity_kwh": 60,
        "energy_consumption_kwh_per_km": 0.16,
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["candidate_count"] > 0
    assert len(body["recommendations"]) <= 10
    for rec in body["recommendations"]:
        assert rec["energy"]["feasible"] is True


def test_recommend_endpoint_rejects_invalid_soc():
    payload = {
        "current_location": {"latitude": 28.6139, "longitude": 77.2090},
        "destination": {"latitude": 28.5355, "longitude": 77.3910},
        "current_soc": 1.5,  # invalid: > 1
        "target_destination_soc": 0.80,
        "battery_capacity_kwh": 60,
        "energy_consumption_kwh_per_km": 0.16,
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 422
