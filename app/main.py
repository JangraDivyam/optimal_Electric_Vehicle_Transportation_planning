"""
main.py

FastAPI application entrypoint.

    POST /recommend  - run the full recommendation pipeline
    GET  /health      - liveness check
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.pipeline import recommend_charging_stations
from app.route_service import (
    GoogleRoutingProvider,
    MockRoutingProvider,
    OpenRouteServiceRoutingProvider,
    RoutingProvider,
)
from app.schemas import EVRequest, RecommendationResponse
from app.settings import settings
from app.station_loader import load_charging_stations
from app.wait_time_service import (
    HttpWaitingTimePredictor,
    MockWaitingTimePredictor,
    WaitingTimePredictor,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="EV Route & Charging Station Recommendation Module")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_charging_stations = load_charging_stations(settings.charging_station_csv_path)


def _build_routing_provider() -> RoutingProvider:
    if settings.mock_routing:
        return MockRoutingProvider()
    if settings.routing_provider == "google":
        return GoogleRoutingProvider(api_key=settings.google_maps_api_key)
    if settings.routing_provider == "openrouteservice":
        return OpenRouteServiceRoutingProvider(api_key=settings.openrouteservice_api_key)
    raise ValueError(
        f"Unknown ROUTING_PROVIDER '{settings.routing_provider}' "
        "(expected 'google' or 'openrouteservice')"
    )


def _build_waiting_time_predictor() -> WaitingTimePredictor:
    if settings.mock_waiting_time:
        return MockWaitingTimePredictor()
    return HttpWaitingTimePredictor(ml_service_url=settings.ml_service_url)


@app.get("/")
@app.head("/")
def root() -> dict:
    return {
        "service": "EV Route & Charging Station Recommendation API",
        "status": "online",
        "stations_loaded": len(_charging_stations),
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "stations_loaded": len(_charging_stations)}


@app.get("/debug")
def debug() -> dict:
    provider = _build_routing_provider()
    return {
        "mock_routing": settings.mock_routing,
        "routing_provider": settings.routing_provider,
        "provider_name": type(provider).__name__,
        "has_ors_key": bool(settings.openrouteservice_api_key),
        "ors_key_length": len(settings.openrouteservice_api_key),
        "stations_loaded": len(_charging_stations),
    }


@app.post("/recommend", response_model=RecommendationResponse)
def recommend(ev_request: EVRequest) -> RecommendationResponse:
    try:
        routing_provider = _build_routing_provider()
        waiting_time_predictor = _build_waiting_time_predictor()
        return recommend_charging_stations(
            ev_request=ev_request,
            charging_stations=_charging_stations,
            routing_provider=routing_provider,
            waiting_time_predictor=waiting_time_predictor,
            settings=settings,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
