"""
schemas.py

Pydantic models for API requests/responses and for the data that flows
between pipeline stages. Every other module in this package should use
these shapes rather than passing around loose dicts.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------

class Location(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class EVRequest(BaseModel):
    current_location: Location
    destination: Location
    current_soc: float = Field(..., ge=0, le=1)
    target_destination_soc: float = Field(..., ge=0, le=1)
    battery_capacity_kwh: float = Field(..., gt=0)
    energy_consumption_kwh_per_km: float = Field(..., gt=0)

    # Deliberately no cross-field validation forcing
    # target_destination_soc > current_soc - the target may be lower,
    # equal, or higher than the current SOC.


# ---------------------------------------------------------------------------
# Station data
# ---------------------------------------------------------------------------

class ChargingStation(BaseModel):
    station_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    charger_power_kw: float = Field(..., gt=0)
    price_per_kwh: float = Field(..., ge=0)
    # Extra passthrough attributes (city, vendor, charger_type, ...) that
    # Harsh's ML model may need but this module does not interpret itself.
    extra_features: dict = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Per-stage results
# ---------------------------------------------------------------------------

class RouteLeg(BaseModel):
    distance_km: float
    travel_time_min: float


class RouteResult(BaseModel):
    station_id: str
    ev_to_station: Optional[RouteLeg] = None
    station_to_destination: Optional[RouteLeg] = None
    routing_failed: bool = False


class EnergyResult(BaseModel):
    available_energy_kwh: float
    energy_to_station_kwh: float
    feasible: bool
    remaining_energy_at_station_kwh: Optional[float] = None
    energy_from_station_to_destination_kwh: Optional[float] = None
    target_energy_at_destination_kwh: Optional[float] = None
    charging_energy_kwh: Optional[float] = None


class ChargingResult(BaseModel):
    charger_power_kw: float
    charging_time_min: float


class OptimizationResult(BaseModel):
    total_drive_distance_km: float
    total_drive_time_min: float
    total_journey_time_min: float
    normalized_metrics: dict
    overall_score: float
    rank: int


class StationRecommendation(BaseModel):
    station_id: str
    location: Location
    source_to_station: RouteLeg
    station_to_destination: RouteLeg
    energy: EnergyResult
    charging: ChargingResult
    waiting_time_min: float
    charging_cost: float
    optimization: OptimizationResult
    station_name: Optional[str] = None
    city: Optional[str] = None
    vendor: Optional[str] = None
    charger_type: Optional[str] = None
    no_of_chargers: Optional[int] = None
    available_chargers: Optional[int] = None
    address: Optional[str] = None


class RecommendationResponse(BaseModel):
    candidate_count: int
    feasible_count: int
    recommendations: list[StationRecommendation]
    message: Optional[str] = None
