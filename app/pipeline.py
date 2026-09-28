"""
pipeline.py

Connects every module in the correct order:

  1. Validate EV input (Pydantic does this on EVRequest construction)
  2. Load/index charging stations
  3. Generate H3 candidates
  4. Select N candidates (default 20)
  5. Request road routes
  6. Calculate energy required to reach each station
  7. Remove infeasible stations
  8. Calculate remaining energy
  9. Calculate energy needed after each station
  10. Calculate charging energy
  11. Calculate charging time
  12. Request waiting-time predictions
  13. Calculate charging cost
  14. Normalize optimization metrics
  15. Calculate weighted scores
  16. Sort feasible stations
  17. Return Top N

This module orchestrates; it does not itself perform any domain
calculation - those all live in their dedicated modules.
"""

from __future__ import annotations

import logging

from app.candidate_generator import generate_candidate_stations
from app.charging_calculator import evaluate_charging
from app.cost_calculator import calculate_charging_cost
from app.energy_calculator import evaluate_station_energy
from app.recommendation_service import build_recommendation, build_response
from app.route_service import RoutingProvider
from app.schemas import ChargingStation, EVRequest, RecommendationResponse
from app.settings import Settings
from app.station_ranker import RankableStation, rank_stations, select_top_n
from app.wait_time_service import WaitingTimePredictor

logger = logging.getLogger(__name__)


def recommend_charging_stations(
    ev_request: EVRequest,
    charging_stations: list[ChargingStation],
    routing_provider: RoutingProvider,
    waiting_time_predictor: WaitingTimePredictor,
    settings: Settings,
) -> RecommendationResponse:
    if not charging_stations:
        logger.info("No charging stations available at all")
        return build_response(
            candidate_count=0,
            feasible_count=0,
            recommendations=[],
            message="No charging stations are available in the dataset.",
        )

    # --- Steps 3-4: H3 candidate generation ---------------------------------
    candidates = generate_candidate_stations(
        ev_location=ev_request.current_location,
        stations=charging_stations,
        resolution=settings.h3_resolution,
        candidate_count=settings.candidate_station_count,
    )
    candidate_count = len(candidates)

    # --- Step 5: routing -----------------------------------------------------
    logger.info("Routing %d candidate stations", candidate_count)
    route_results = routing_provider.get_routes(
        ev_request.current_location, ev_request.destination, candidates
    )
    route_by_station_id = {r.station_id: r for r in route_results}
    successful_routes = sum(1 for r in route_results if not r.routing_failed)
    logger.info("%d routes successfully calculated", successful_routes)

    # --- Steps 6-11: energy + feasibility + charging --------------------------
    feasible_entries: list[
        tuple[ChargingStation, object, object, object]
    ] = []  # (station, route_result, energy_result, charging_result)

    for station in candidates:
        route_result = route_by_station_id.get(station.station_id)
        if route_result is None:
            continue

        energy_result = evaluate_station_energy(ev_request, route_result)
        if not energy_result.feasible:
            continue

        charging_result = evaluate_charging(
            energy_result.charging_energy_kwh, station.charger_power_kw
        )
        feasible_entries.append((station, route_result, energy_result, charging_result))

    logger.info("%d stations are energy-feasible", len(feasible_entries))

    if not feasible_entries:
        return build_response(
            candidate_count=candidate_count,
            feasible_count=0,
            recommendations=[],
            message="No charging station is reachable with the current battery state.",
        )

    # --- Steps 12-13: waiting time + cost -------------------------------------
    rankable: list[RankableStation] = []
    per_station_extra: dict[str, dict] = {}

    for station, route_result, energy_result, charging_result in feasible_entries:
        features = {
            "station_id": station.station_id,
            "charging_energy_kwh": energy_result.charging_energy_kwh,
            "charger_power_kw": station.charger_power_kw,
            **station.extra_features,
        }
        waiting_time_min = waiting_time_predictor.predict(features)
        charging_cost = calculate_charging_cost(
            energy_result.charging_energy_kwh, station.price_per_kwh
        )

        total_drive_distance_km = (
            route_result.ev_to_station.distance_km
            + route_result.station_to_destination.distance_km
        )
        total_drive_time_min = (
            route_result.ev_to_station.travel_time_min
            + route_result.station_to_destination.travel_time_min
        )

        rankable.append(
            RankableStation(
                station_id=station.station_id,
                total_drive_time_min=total_drive_time_min,
                waiting_time_min=waiting_time_min,
                charging_time_min=charging_result.charging_time_min,
                charging_cost=charging_cost,
                total_drive_distance_km=total_drive_distance_km,
            )
        )
        per_station_extra[station.station_id] = {
            "waiting_time_min": waiting_time_min,
            "charging_cost": charging_cost,
        }

    logger.info("Waiting-time prediction completed")

    # --- Steps 14-16: normalize, score, sort -----------------------------------
    ranked = rank_stations(rankable, settings.weights.as_dict())
    logger.info("Optimization completed")

    # --- Step 17: Top N --------------------------------------------------------
    top_ranked = select_top_n(ranked, settings.final_recommendation_count)

    station_lookup = {station.station_id: station for station, *_ in feasible_entries}
    route_lookup = {station.station_id: r for station, r, *_ in feasible_entries}
    energy_lookup = {station.station_id: e for station, r, e, c in feasible_entries}
    charging_lookup = {station.station_id: c for station, r, e, c in feasible_entries}

    recommendations = []
    for rankable_station, normalized_metrics, overall_score, rank in top_ranked:
        station_id = rankable_station.station_id
        extra = per_station_extra[station_id]
        recommendations.append(
            build_recommendation(
                station=station_lookup[station_id],
                route_result=route_lookup[station_id],
                energy_result=energy_lookup[station_id],
                charging_result=charging_lookup[station_id],
                waiting_time_min=extra["waiting_time_min"],
                charging_cost=extra["charging_cost"],
                normalized_metrics=normalized_metrics,
                overall_score=overall_score,
                rank=rank,
            )
        )

    logger.info("Returning Top %d recommendations", len(recommendations))

    return build_response(
        candidate_count=candidate_count,
        feasible_count=len(feasible_entries),
        recommendations=recommendations,
    )
