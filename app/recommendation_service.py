"""
recommendation_service.py

Coordinates recommendation logic: turns the per-stage results from the
pipeline into the final StationRecommendation / RecommendationResponse
shapes defined in schemas.py.
"""

from __future__ import annotations

from app.charging_calculator import ChargingResult
from app.schemas import (
    ChargingStation,
    EnergyResult,
    Location,
    OptimizationResult,
    RecommendationResponse,
    RouteResult,
    StationRecommendation,
)
from app.station_ranker import RankableStation


def build_recommendation(
    station: ChargingStation,
    route_result: RouteResult,
    energy_result: EnergyResult,
    charging_result: ChargingResult,
    waiting_time_min: float,
    charging_cost: float,
    normalized_metrics: dict[str, float],
    overall_score: float,
    rank: int,
) -> StationRecommendation:
    total_drive_distance_km = (
        route_result.ev_to_station.distance_km
        + route_result.station_to_destination.distance_km
    )
    total_drive_time_min = (
        route_result.ev_to_station.travel_time_min
        + route_result.station_to_destination.travel_time_min
    )
    total_journey_time_min = total_drive_time_min + waiting_time_min + charging_result.charging_time_min

    def _to_int(val):
        try:
            if val is not None and str(val).lower() != "nan":
                return int(float(val))
        except (ValueError, TypeError):
            pass
        return None

    vendor = station.extra_features.get("vendor")
    city = station.extra_features.get("city")
    charger_type = station.extra_features.get("charger_type")
    no_of_chargers = _to_int(station.extra_features.get("no_of_chargers"))
    available_chargers = _to_int(station.extra_features.get("available"))

    vendor_str = str(vendor) if vendor and str(vendor).lower() != "nan" else "EV Charging Hub"
    city_str = str(city) if city and str(city).lower() != "nan" else "Delhi NCR"
    station_name = f"{vendor_str} Station {station.station_id}"
    address = f"{city_str}, Delhi-NCR Region"

    return StationRecommendation(
        station_id=station.station_id,
        location=Location(latitude=station.latitude, longitude=station.longitude),
        source_to_station=route_result.ev_to_station,
        station_to_destination=route_result.station_to_destination,
        energy=energy_result,
        charging=charging_result,
        waiting_time_min=waiting_time_min,
        charging_cost=charging_cost,
        optimization=OptimizationResult(
            total_drive_distance_km=round(total_drive_distance_km, 3),
            total_drive_time_min=round(total_drive_time_min, 2),
            total_journey_time_min=round(total_journey_time_min, 2),
            normalized_metrics={k: round(v, 4) for k, v in normalized_metrics.items()},
            overall_score=round(overall_score, 4),
            rank=rank,
        ),
        station_name=station_name,
        city=city_str,
        vendor=vendor_str,
        charger_type=str(charger_type) if charger_type and str(charger_type).lower() != "nan" else None,
        no_of_chargers=no_of_chargers,
        available_chargers=available_chargers,
        address=address,
    )


def build_response(
    candidate_count: int,
    feasible_count: int,
    recommendations: list[StationRecommendation],
    message: str | None = None,
) -> RecommendationResponse:
    return RecommendationResponse(
        candidate_count=candidate_count,
        feasible_count=feasible_count,
        recommendations=recommendations,
        message=message,
    )
