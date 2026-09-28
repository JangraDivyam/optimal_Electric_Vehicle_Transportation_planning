"""
energy_calculator.py

Responsible ONLY for:
    - available battery energy
    - energy to station
    - station reachability (feasibility)
    - remaining energy at station
    - energy required after the charging station
    - required charging energy

All distances used here MUST be road distances from route_service.py -
never H3 grid distance. target_destination_soc applies only to the
station -> destination leg, never as a reserve for reaching the station.
"""

from __future__ import annotations

from app.schemas import EnergyResult, EVRequest, RouteResult


def calculate_available_energy_kwh(battery_capacity_kwh: float, current_soc: float) -> float:
    return battery_capacity_kwh * current_soc


def calculate_energy_to_station_kwh(
    ev_to_station_distance_km: float, energy_consumption_kwh_per_km: float
) -> float:
    return ev_to_station_distance_km * energy_consumption_kwh_per_km


def is_station_feasible(available_energy_kwh: float, energy_to_station_kwh: float) -> bool:
    """A station is reachable if the current charge alone can get there -
    target_destination_soc is NOT a reserve for this leg."""
    return available_energy_kwh >= energy_to_station_kwh


def calculate_remaining_energy_at_station_kwh(
    available_energy_kwh: float, energy_to_station_kwh: float
) -> float:
    return available_energy_kwh - energy_to_station_kwh


def calculate_energy_from_station_to_destination_kwh(
    station_to_destination_distance_km: float, energy_consumption_kwh_per_km: float
) -> float:
    return station_to_destination_distance_km * energy_consumption_kwh_per_km


def calculate_target_energy_at_destination_kwh(
    battery_capacity_kwh: float, target_destination_soc: float
) -> float:
    return battery_capacity_kwh * target_destination_soc


def calculate_charging_energy_kwh(
    energy_from_station_to_destination_kwh: float,
    target_energy_at_destination_kwh: float,
    remaining_energy_at_station_kwh: float,
) -> float:
    energy_required_after_station_kwh = (
        energy_from_station_to_destination_kwh + target_energy_at_destination_kwh
    )
    return max(0.0, energy_required_after_station_kwh - remaining_energy_at_station_kwh)


def evaluate_station_energy(ev_request: EVRequest, route_result: RouteResult) -> EnergyResult:
    """
    Run the full energy pipeline for one station's route result.
    If the station is infeasible, the result stops at feasibility - the
    remaining fields (charging energy, etc.) are left unset so callers
    know not to pass this station on to ML/optimization.
    """
    available_energy_kwh = calculate_available_energy_kwh(
        ev_request.battery_capacity_kwh, ev_request.current_soc
    )

    if route_result.routing_failed or route_result.ev_to_station is None:
        return EnergyResult(
            available_energy_kwh=available_energy_kwh,
            energy_to_station_kwh=float("inf"),
            feasible=False,
        )

    energy_to_station_kwh = calculate_energy_to_station_kwh(
        route_result.ev_to_station.distance_km, ev_request.energy_consumption_kwh_per_km
    )
    feasible = is_station_feasible(available_energy_kwh, energy_to_station_kwh)

    if not feasible:
        return EnergyResult(
            available_energy_kwh=available_energy_kwh,
            energy_to_station_kwh=energy_to_station_kwh,
            feasible=False,
        )

    remaining_energy_at_station_kwh = calculate_remaining_energy_at_station_kwh(
        available_energy_kwh, energy_to_station_kwh
    )
    energy_from_station_to_destination_kwh = calculate_energy_from_station_to_destination_kwh(
        route_result.station_to_destination.distance_km,
        ev_request.energy_consumption_kwh_per_km,
    )
    target_energy_at_destination_kwh = calculate_target_energy_at_destination_kwh(
        ev_request.battery_capacity_kwh, ev_request.target_destination_soc
    )
    charging_energy_kwh = calculate_charging_energy_kwh(
        energy_from_station_to_destination_kwh,
        target_energy_at_destination_kwh,
        remaining_energy_at_station_kwh,
    )

    return EnergyResult(
        available_energy_kwh=available_energy_kwh,
        energy_to_station_kwh=energy_to_station_kwh,
        feasible=True,
        remaining_energy_at_station_kwh=remaining_energy_at_station_kwh,
        energy_from_station_to_destination_kwh=energy_from_station_to_destination_kwh,
        target_energy_at_destination_kwh=target_energy_at_destination_kwh,
        charging_energy_kwh=charging_energy_kwh,
    )
