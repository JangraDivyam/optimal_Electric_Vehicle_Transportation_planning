"""
candidate_generator.py

Responsible ONLY for:
    - H3 indexing of charging stations
    - H3 neighborhood search
    - nearby station candidate generation
    - selecting the configured number of candidates (default 20)

H3 answers "which stations are geographically nearby" only. It is never
used here for road distance, travel time, or final ranking - that is the
job of route_service.py and station_ranker.py respectively.
"""

from __future__ import annotations

import logging

import h3

from app.schemas import ChargingStation, Location

logger = logging.getLogger(__name__)

# How far the expanding H3 ring search is allowed to grow before giving up.
# At resolution 9 (~0.1 km^2 hexagons) a ring of 40 already covers a large
# metro area, so this is a safety bound, not an expected value.
MAX_RING_EXPANSION = 40


def index_stations_by_h3_cell(
    stations: list[ChargingStation], resolution: int
) -> dict[str, list[ChargingStation]]:
    """Group stations by the H3 cell (at the given resolution) they fall in."""
    index: dict[str, list[ChargingStation]] = {}
    for station in stations:
        cell = h3.latlng_to_cell(station.latitude, station.longitude, resolution)
        index.setdefault(cell, []).append(station)
    return index


def generate_candidate_stations(
    ev_location: Location,
    stations: list[ChargingStation],
    resolution: int,
    candidate_count: int,
) -> list[ChargingStation]:
    """
    Find geographically nearby charging stations using an expanding H3
    ring search, and return up to `candidate_count` of them.

    If the dataset has fewer than `candidate_count` stations in total,
    all available stations are returned.
    """
    if not stations:
        logger.info("No charging stations available for candidate generation")
        return []

    if len(stations) <= candidate_count:
        logger.info(
            "Dataset has only %d stations (<= candidate count %d) - "
            "returning all of them without H3 filtering",
            len(stations),
            candidate_count,
        )
        return list(stations)

    station_index = index_stations_by_h3_cell(stations, resolution)
    ev_cell = h3.latlng_to_cell(ev_location.latitude, ev_location.longitude, resolution)

    logger.info("H3 candidate generation started")

    collected: list[ChargingStation] = []
    seen_ids: set[str] = set()
    ring = 0

    while len(collected) < candidate_count and ring <= MAX_RING_EXPANSION:
        nearby_cells = h3.grid_disk(ev_cell, ring)
        collected = []
        seen_ids = set()
        for cell in nearby_cells:
            for station in station_index.get(cell, []):
                if station.station_id not in seen_ids:
                    seen_ids.add(station.station_id)
                    collected.append(station)
        if len(collected) < candidate_count:
            ring += 1

    logger.info(
        "H3 candidate generation found %d nearby stations at ring k=%d",
        len(collected),
        ring,
    )

    # Stable order: sort by H3 cell distance from the EV cell so the
    # "first 20" is deterministic rather than dict-insertion-order noise.
    def cell_distance(station: ChargingStation) -> int:
        station_cell = h3.latlng_to_cell(station.latitude, station.longitude, resolution)
        try:
            return h3.grid_distance(ev_cell, station_cell)
        except Exception:  # noqa: BLE001 - rare H3 grid-navigation edge case
            return MAX_RING_EXPANSION + 1

    collected.sort(key=cell_distance)
    selected = collected[:candidate_count]

    logger.info("Selected %d H3 candidates", len(selected))
    return selected
