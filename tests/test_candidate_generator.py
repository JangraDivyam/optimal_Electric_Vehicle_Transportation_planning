from app.candidate_generator import generate_candidate_stations
from app.schemas import ChargingStation, Location

RESOLUTION = 9


def _grid_of_stations(count: int, center_lat: float, center_lon: float, spread: float) -> list[ChargingStation]:
    stations = []
    side = int(count**0.5) + 1
    i = 0
    for row in range(side):
        for col in range(side):
            if i >= count:
                break
            lat = center_lat + (row - side / 2) * spread
            lon = center_lon + (col - side / 2) * spread
            stations.append(
                ChargingStation(
                    station_id=f"ST{i:03d}",
                    latitude=lat,
                    longitude=lon,
                    charger_power_kw=50,
                    price_per_kwh=10,
                )
            )
            i += 1
    return stations


def test_h3_candidate_count():
    # Test 13: 50+ stations -> exactly 20 candidates returned
    stations = _grid_of_stations(55, 28.6139, 77.2090, spread=0.01)
    ev_location = Location(latitude=28.6139, longitude=77.2090)

    candidates = generate_candidate_stations(
        ev_location=ev_location, stations=stations, resolution=RESOLUTION, candidate_count=20
    )
    assert len(candidates) == 20


def test_h3_expanding_search():
    # Test 14: first H3 neighborhood has too few stations, search must expand
    # Spread the stations far apart so ring 0 alone can't find 20 of them.
    stations = _grid_of_stations(55, 28.6139, 77.2090, spread=0.05)
    ev_location = Location(latitude=28.6139, longitude=77.2090)

    candidates = generate_candidate_stations(
        ev_location=ev_location, stations=stations, resolution=RESOLUTION, candidate_count=20
    )
    assert len(candidates) == 20


def test_fewer_stations_than_candidate_count_returns_all():
    stations = _grid_of_stations(5, 28.6139, 77.2090, spread=0.01)
    ev_location = Location(latitude=28.6139, longitude=77.2090)

    candidates = generate_candidate_stations(
        ev_location=ev_location, stations=stations, resolution=RESOLUTION, candidate_count=20
    )
    assert len(candidates) == 5
