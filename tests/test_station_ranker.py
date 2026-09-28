from app.station_ranker import RankableStation, normalize, rank_stations, select_top_n

DEFAULT_WEIGHTS = {
    "drive_time": 0.20,
    "waiting_time": 0.25,
    "charging_time": 0.25,
    "cost": 0.15,
    "distance": 0.15,
}


def test_normalization():
    # Test 8
    assert normalize([10, 20, 30]) == [0.0, 0.5, 1.0]


def test_equal_normalization_values():
    # Test 9
    assert normalize([20, 20, 20]) == [0.0, 0.0, 0.0]


def _make_station(station_id: str, seed: float) -> RankableStation:
    return RankableStation(
        station_id=station_id,
        total_drive_time_min=10 + seed,
        waiting_time_min=5 + seed,
        charging_time_min=20 + seed,
        charging_cost=100 + seed,
        total_drive_distance_km=8 + seed,
    )


def test_top_10():
    # Test 10
    stations = [_make_station(f"S{i}", i) for i in range(15)]
    ranked = rank_stations(stations, DEFAULT_WEIGHTS)
    top = select_top_n(ranked, n=10)
    assert len(top) == 10


def test_fewer_than_10():
    # Test 11
    stations = [_make_station(f"S{i}", i) for i in range(6)]
    ranked = rank_stations(stations, DEFAULT_WEIGHTS)
    top = select_top_n(ranked, n=10)
    assert len(top) == 6


def test_zero_feasible():
    # Test 12
    ranked = rank_stations([], DEFAULT_WEIGHTS)
    assert ranked == []


def test_ranks_are_sequential_starting_at_one():
    stations = [_make_station(f"S{i}", i) for i in range(5)]
    ranked = rank_stations(stations, DEFAULT_WEIGHTS)
    ranks = [entry[3] for entry in ranked]
    assert ranks == [1, 2, 3, 4, 5]


def test_weights_must_sum_to_one():
    import pytest

    bad_weights = {**DEFAULT_WEIGHTS, "cost": 0.5}
    with pytest.raises(ValueError):
        rank_stations([_make_station("S0", 0)], bad_weights)
