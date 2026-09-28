from unittest.mock import MagicMock, patch

import pytest

from app.route_service import OpenRouteServiceRoutingProvider
from app.schemas import ChargingStation, Location


def _make_stations(n: int) -> list[ChargingStation]:
    return [
        ChargingStation(
            station_id=f"ST{i:02d}",
            latitude=28.6 + i * 0.01,
            longitude=77.2 + i * 0.01,
            charger_power_kw=50,
            price_per_kwh=10,
        )
        for i in range(n)
    ]


def test_missing_api_key_raises():
    with pytest.raises(ValueError):
        OpenRouteServiceRoutingProvider(api_key="")


def test_makes_exactly_two_matrix_calls_for_any_candidate_count():
    stations = _make_stations(5)
    ev_location = Location(latitude=28.6139, longitude=77.2090)
    destination = Location(latitude=28.5355, longitude=77.3910)

    fake_leg1 = {
        "distances": [[1.0, 2.0, 3.0, 4.0, 5.0]],
        "durations": [[60.0, 120.0, 180.0, 240.0, 300.0]],
    }
    fake_leg2 = {
        "distances": [[10.0], [11.0], [12.0], [13.0], [14.0]],
        "durations": [[600.0], [660.0], [720.0], [780.0], [840.0]],
    }

    mock_response_1 = MagicMock()
    mock_response_1.json.return_value = fake_leg1
    mock_response_1.raise_for_status.return_value = None

    mock_response_2 = MagicMock()
    mock_response_2.json.return_value = fake_leg2
    mock_response_2.raise_for_status.return_value = None

    provider = OpenRouteServiceRoutingProvider(api_key="test-key")

    with patch("app.route_service.requests.post", side_effect=[mock_response_1, mock_response_2]) as mock_post:
        results = provider.get_routes(ev_location, destination, stations)

    assert mock_post.call_count == 2  # exactly 2 calls regardless of station count
    assert len(results) == 5
    assert all(not r.routing_failed for r in results)
    assert results[0].ev_to_station.distance_km == 1.0
    assert results[0].station_to_destination.distance_km == 10.0
    assert results[4].ev_to_station.travel_time_min == 5.0


def test_failed_matrix_call_marks_all_stations_as_routing_failed():
    stations = _make_stations(3)
    ev_location = Location(latitude=28.6139, longitude=77.2090)
    destination = Location(latitude=28.5355, longitude=77.3910)

    provider = OpenRouteServiceRoutingProvider(api_key="test-key")

    import requests

    with patch("app.route_service.requests.post", side_effect=requests.exceptions.ConnectionError("network down")):
        results = provider.get_routes(ev_location, destination, stations)

    assert len(results) == 3
    assert all(r.routing_failed for r in results)
