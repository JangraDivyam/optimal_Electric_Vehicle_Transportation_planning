"""
station_ranker.py

Responsible ONLY for:
    - normalization
    - weighted score
    - sorting
    - Top N selection

Optimization metrics (component-based, no double counting):
    total_drive_time_min, waiting_time_min, charging_time_min,
    charging_cost, total_drive_distance_km
total_journey_time is reported for information but is NOT itself an
independent weighted objective (it's the sum of three of the others).
"""

from __future__ import annotations

from dataclasses import dataclass

METRIC_NAMES = ["drive_time", "waiting_time", "charging_time", "cost", "distance"]


@dataclass
class RankableStation:
    station_id: str
    total_drive_time_min: float
    waiting_time_min: float
    charging_time_min: float
    charging_cost: float
    total_drive_distance_km: float


def normalize(values: list[float]) -> list[float]:
    """
    Min-max normalize a list of lower-is-better values to [0, 1].
    If every value is equal, returns 0 for every value (no divide-by-zero,
    and the metric provides no differentiation between stations).
    """
    if not values:
        return []
    minimum_value = min(values)
    maximum_value = max(values)
    if maximum_value == minimum_value:
        return [0.0 for _ in values]
    return [(value - minimum_value) / (maximum_value - minimum_value) for value in values]


def rank_stations(
    stations: list[RankableStation], weights: dict[str, float]
) -> list[tuple[RankableStation, dict[str, float], float, int]]:
    """
    Returns a list of (station, normalized_metrics, overall_score, rank)
    tuples sorted by overall_score ascending (rank 1 = best). Empty input
    returns an empty list.
    """
    if not stations:
        return []

    weight_total = sum(weights.get(name, 0.0) for name in METRIC_NAMES)
    if abs(weight_total - 1.0) > 1e-6:
        raise ValueError(f"Optimization weights must sum to 1.0, got {weight_total}")

    raw_metrics = {
        "drive_time": [s.total_drive_time_min for s in stations],
        "waiting_time": [s.waiting_time_min for s in stations],
        "charging_time": [s.charging_time_min for s in stations],
        "cost": [s.charging_cost for s in stations],
        "distance": [s.total_drive_distance_km for s in stations],
    }
    normalized_metrics = {name: normalize(values) for name, values in raw_metrics.items()}

    scored: list[tuple[RankableStation, dict[str, float], float]] = []
    for index, station in enumerate(stations):
        station_normalized = {name: normalized_metrics[name][index] for name in METRIC_NAMES}
        overall_score = sum(
            weights[name] * station_normalized[name] for name in METRIC_NAMES
        )
        scored.append((station, station_normalized, overall_score))

    scored.sort(key=lambda item: item[2])

    return [
        (station, station_normalized, overall_score, rank_index + 1)
        for rank_index, (station, station_normalized, overall_score) in enumerate(scored)
    ]


def select_top_n(
    ranked: list[tuple[RankableStation, dict[str, float], float, int]], n: int
) -> list[tuple[RankableStation, dict[str, float], float, int]]:
    return ranked[:n]
