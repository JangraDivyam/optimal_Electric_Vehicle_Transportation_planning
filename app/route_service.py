"""
route_service.py

Responsible ONLY for:
    - road distance
    - road travel time
    - routing API integration
    - mock routing

Defines a RoutingProvider abstraction so the concrete backend (Google
Maps, another provider, or a deterministic mock) can be swapped without
touching any other module.
"""

from __future__ import annotations

import logging
import math
from abc import ABC, abstractmethod

import requests

from app.schemas import ChargingStation, Location, RouteResult

logger = logging.getLogger(__name__)


class RoutingProvider(ABC):
    """Abstract interface every routing backend must implement."""

    @abstractmethod
    def get_routes(
        self,
        ev_location: Location,
        destination: Location,
        stations: list[ChargingStation],
    ) -> list[RouteResult]:
        """
        For each station, compute:
          - ev_location -> station (distance_km, travel_time_min)
          - station -> destination (distance_km, travel_time_min)
        A station that cannot be routed is returned with routing_failed=True
        rather than raising, so one bad candidate never blocks the rest.
        """
        raise NotImplementedError


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km. Used only as the mock provider's base
    distance estimate - never as a substitute for real road routing."""
    earth_radius_km = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * earth_radius_km * math.asin(math.sqrt(a))


class MockRoutingProvider(RoutingProvider):
    """
    Deterministic routing for local development and tests. Approximates
    road distance as straight-line distance * a fixed detour factor, and
    travel time from an assumed average urban speed. No network calls,
    no randomness, so it produces the same numbers every run.
    """

    DETOUR_FACTOR = 1.3  # roads are rarely a straight line
    AVERAGE_SPEED_KMH = 30.0  # typical Delhi urban-driving average

    def get_routes(
        self,
        ev_location: Location,
        destination: Location,
        stations: list[ChargingStation],
    ) -> list[RouteResult]:
        results: list[RouteResult] = []
        for station in stations:
            ev_to_station_km = (
                _haversine_km(
                    ev_location.latitude,
                    ev_location.longitude,
                    station.latitude,
                    station.longitude,
                )
                * self.DETOUR_FACTOR
            )
            station_to_dest_km = (
                _haversine_km(
                    station.latitude,
                    station.longitude,
                    destination.latitude,
                    destination.longitude,
                )
                * self.DETOUR_FACTOR
            )
            results.append(
                RouteResult(
                    station_id=station.station_id,
                    ev_to_station={
                        "distance_km": round(ev_to_station_km, 3),
                        "travel_time_min": round(
                            ev_to_station_km / self.AVERAGE_SPEED_KMH * 60, 2
                        ),
                    },
                    station_to_destination={
                        "distance_km": round(station_to_dest_km, 3),
                        "travel_time_min": round(
                            station_to_dest_km / self.AVERAGE_SPEED_KMH * 60, 2
                        ),
                    },
                    routing_failed=False,
                )
            )
        return results


class GoogleRoutingProvider(RoutingProvider):
    """
    Real routing via the Google Maps Platform Routes API
    (Compute Route Matrix). Requires GOOGLE_MAPS_API_KEY to be set.
    """

    ROUTE_MATRIX_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"

    def __init__(self, api_key: str, timeout_seconds: float = 10.0):
        if not api_key:
            raise ValueError("GOOGLE_MAPS_API_KEY is required for GoogleRoutingProvider")
        self.api_key = api_key
        self.timeout_seconds = timeout_seconds

    def _compute_leg(self, origin: Location, dest: Location) -> dict | None:
        """One origin -> destination lookup. Returns None on any failure."""
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration,condition",
        }
        body = {
            "origins": [
                {"waypoint": {"location": {"latLng": {
                    "latitude": origin.latitude, "longitude": origin.longitude
                }}}}
            ],
            "destinations": [
                {"waypoint": {"location": {"latLng": {
                    "latitude": dest.latitude, "longitude": dest.longitude
                }}}}
            ],
            "travelMode": "DRIVE",
        }
        try:
            response = requests.post(
                self.ROUTE_MATRIX_URL, json=body, headers=headers, timeout=self.timeout_seconds
            )
            response.raise_for_status()
            rows = response.json()
            if not rows:
                return None
            entry = rows[0]
            if entry.get("condition") != "ROUTE_EXISTS":
                return None
            distance_km = entry["distanceMeters"] / 1000.0
            duration_seconds = float(str(entry["duration"]).rstrip("s"))
            return {
                "distance_km": round(distance_km, 3),
                "travel_time_min": round(duration_seconds / 60.0, 2),
            }
        except (requests.RequestException, KeyError, ValueError, TypeError) as exc:
            logger.warning("Google routing request failed: %s", exc)
            return None

    def get_routes(
        self,
        ev_location: Location,
        destination: Location,
        stations: list[ChargingStation],
    ) -> list[RouteResult]:
        results: list[RouteResult] = []
        for station in stations:
            station_location = Location(latitude=station.latitude, longitude=station.longitude)
            ev_to_station = self._compute_leg(ev_location, station_location)
            station_to_dest = self._compute_leg(station_location, destination)

            if ev_to_station is None or station_to_dest is None:
                results.append(
                    RouteResult(station_id=station.station_id, routing_failed=True)
                )
                continue

            results.append(
                RouteResult(
                    station_id=station.station_id,
                    ev_to_station=ev_to_station,
                    station_to_destination=station_to_dest,
                    routing_failed=False,
                )
            )
        return results


class OpenRouteServiceRoutingProvider(RoutingProvider):
    """
    Real routing via OpenRouteService's Matrix API (free tier, no billing
    required). Instead of one HTTP request per station per leg (40 calls
    for 20 candidates), this batches every candidate into exactly TWO
    matrix calls total:

        call 1: EV        -> all stations   (one-to-many)
        call 2: stations  -> destination    (many-to-one)

    This is the "route-matrix API" efficiency the spec asks for, applied
    to a provider that doesn't require a Google Cloud billing account.
    """

    MATRIX_URL = "https://api.openrouteservice.org/v2/matrix/driving-car"

    def __init__(self, api_key: str, timeout_seconds: float = 15.0):
        if not api_key:
            raise ValueError(
                "OPENROUTESERVICE_API_KEY is required for OpenRouteServiceRoutingProvider"
            )
        self.api_key = api_key
        self.timeout_seconds = timeout_seconds

    def _call_matrix(
        self, locations: list[list[float]], sources: list[int], destinations: list[int]
    ) -> dict | None:
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json",
        }
        body = {
            "locations": locations,  # [ [lon, lat], ... ] - ORS uses lon,lat order
            "sources": sources,
            "destinations": destinations,
            "metrics": ["distance", "duration"],
            "units": "km",
        }
        try:
            response = requests.post(
                self.MATRIX_URL, json=body, headers=headers, timeout=self.timeout_seconds
            )
            response.raise_for_status()
            return response.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("OpenRouteService matrix request failed: %s", exc)
            return None

    def get_routes(
        self,
        ev_location: Location,
        destination: Location,
        stations: list[ChargingStation],
    ) -> list[RouteResult]:
        if not stations:
            return []

        # Build one combined location list: [ev, destination, station_1, ..., station_n]
        # ORS expects [longitude, latitude] order.
        locations = [
            [ev_location.longitude, ev_location.latitude],
            [destination.longitude, destination.latitude],
        ] + [[s.longitude, s.latitude] for s in stations]
        ev_index = 0
        destination_index = 1
        station_indices = list(range(2, 2 + len(stations)))

        # Call 1: EV -> every station (one-to-many)
        leg1 = self._call_matrix(locations, sources=[ev_index], destinations=station_indices)
        # Call 2: every station -> destination (many-to-one)
        leg2 = self._call_matrix(locations, sources=station_indices, destinations=[destination_index])

        results: list[RouteResult] = []
        for position, station in enumerate(stations):
            ev_to_station = None
            station_to_dest = None

            if leg1 is not None:
                try:
                    distance_km = leg1["distances"][0][position]
                    duration_s = leg1["durations"][0][position]
                    if distance_km is not None and duration_s is not None:
                        ev_to_station = {
                            "distance_km": round(distance_km, 3),
                            "travel_time_min": round(duration_s / 60.0, 2),
                        }
                except (KeyError, IndexError, TypeError):
                    ev_to_station = None

            if leg2 is not None:
                try:
                    distance_km = leg2["distances"][position][0]
                    duration_s = leg2["durations"][position][0]
                    if distance_km is not None and duration_s is not None:
                        station_to_dest = {
                            "distance_km": round(distance_km, 3),
                            "travel_time_min": round(duration_s / 60.0, 2),
                        }
                except (KeyError, IndexError, TypeError):
                    station_to_dest = None

            if ev_to_station is None or station_to_dest is None:
                results.append(RouteResult(station_id=station.station_id, routing_failed=True))
                continue

            results.append(
                RouteResult(
                    station_id=station.station_id,
                    ev_to_station=ev_to_station,
                    station_to_destination=station_to_dest,
                    routing_failed=False,
                )
            )

        return results
