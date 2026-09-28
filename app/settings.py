"""
settings.py

All tunable configuration for the module lives here, loaded from
environment variables (with sane defaults) via python-dotenv. Nothing
else in the codebase should read os.environ directly.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


def _get_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _get_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    return float(raw) if raw is not None else default


def _get_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    return int(raw) if raw is not None else default


@dataclass(frozen=True)
class OptimizationWeights:
    drive_time: float = _get_float("WEIGHT_DRIVE_TIME", 0.20)
    waiting_time: float = _get_float("WEIGHT_WAITING_TIME", 0.25)
    charging_time: float = _get_float("WEIGHT_CHARGING_TIME", 0.25)
    cost: float = _get_float("WEIGHT_COST", 0.15)
    distance: float = _get_float("WEIGHT_DISTANCE", 0.15)

    def as_dict(self) -> dict[str, float]:
        return {
            "drive_time": self.drive_time,
            "waiting_time": self.waiting_time,
            "charging_time": self.charging_time,
            "cost": self.cost,
            "distance": self.distance,
        }

    def total(self) -> float:
        return sum(self.as_dict().values())


DEFAULT_ORS_KEY = (
    "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjY2YzE0MWEwOTM4NDQxOGRhNTkzYTlkNGRlN2Q2Mjc0IiwiaCI6Im11cm11cjY0In0="
)


def _get_ors_key() -> str:
    raw = os.getenv("OPENROUTESERVICE_API_KEY", "")
    if not raw or len(raw.strip()) < 40:
        return DEFAULT_ORS_KEY
    return raw.strip()


@dataclass(frozen=True)
class Settings:
    google_maps_api_key: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    openrouteservice_api_key: str = field(default_factory=_get_ors_key)
    h3_resolution: int = _get_int("H3_RESOLUTION", 9)
    candidate_station_count: int = _get_int("CANDIDATE_STATION_COUNT", 20)
    final_recommendation_count: int = _get_int("FINAL_RECOMMENDATION_COUNT", 10)
    mock_routing: bool = _get_bool("MOCK_ROUTING", True)
    # Which real provider to use when mock_routing is false: "google" or
    # "openrouteservice". Ignored while mock_routing is true.
    routing_provider: str = os.getenv("ROUTING_PROVIDER", "openrouteservice")
    mock_waiting_time: bool = _get_bool("MOCK_WAITING_TIME", True)
    ml_service_url: str = os.getenv("ML_SERVICE_URL", "")
    charging_station_csv_path: str = os.getenv(
        "CHARGING_STATION_CSV_PATH", "data/charging_stations.csv"
    )
    weights: OptimizationWeights = field(default_factory=OptimizationWeights)


settings = Settings()
