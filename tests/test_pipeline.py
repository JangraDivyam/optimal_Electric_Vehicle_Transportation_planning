from app.pipeline import recommend_charging_stations
from app.route_service import MockRoutingProvider
from app.schemas import ChargingStation, EVRequest, Location
from app.settings import OptimizationWeights, Settings
from app.wait_time_service import MockWaitingTimePredictor

DEFAULT_SETTINGS = Settings(
    h3_resolution=9,
    candidate_station_count=20,
    final_recommendation_count=10,
    weights=OptimizationWeights(
        drive_time=0.20, waiting_time=0.25, charging_time=0.25, cost=0.15, distance=0.15
    ),
)


def _make_ev_request(current_soc: float = 0.35) -> EVRequest:
    return EVRequest(
        current_location=Location(latitude=28.6139, longitude=77.2090),
        destination=Location(latitude=28.5355, longitude=77.3910),
        current_soc=current_soc,
        target_destination_soc=0.80,
        battery_capacity_kwh=60,
        energy_consumption_kwh_per_km=0.16,
    )


def _make_stations(count: int, near_ev: bool = True) -> list[ChargingStation]:
    base_lat, base_lon = (28.615, 77.21) if near_ev else (29.5, 76.95)
    stations = []
    for i in range(count):
        stations.append(
            ChargingStation(
                station_id=f"ST{i:03d}",
                latitude=base_lat + i * 0.002,
                longitude=base_lon + i * 0.002,
                charger_power_kw=60,
                price_per_kwh=10,
            )
        )
    return stations


def test_infeasible_stations_do_not_reach_optimization():
    # Test 15
    stations = _make_stations(20)
    # Nearly empty battery: only a few (very close) stations should be feasible.
    ev_request = _make_ev_request(current_soc=0.02)

    response = recommend_charging_stations(
        ev_request=ev_request,
        charging_stations=stations,
        routing_provider=MockRoutingProvider(),
        waiting_time_predictor=MockWaitingTimePredictor(),
        settings=DEFAULT_SETTINGS,
    )

    assert response.candidate_count == 20
    assert response.feasible_count <= response.candidate_count
    # Every recommendation returned must itself be feasible.
    for rec in response.recommendations:
        assert rec.energy.feasible is True


def test_top_10_returned_when_enough_feasible_stations_exist():
    stations = _make_stations(25)
    ev_request = _make_ev_request(current_soc=0.9)

    response = recommend_charging_stations(
        ev_request=ev_request,
        charging_stations=stations,
        routing_provider=MockRoutingProvider(),
        waiting_time_predictor=MockWaitingTimePredictor(),
        settings=DEFAULT_SETTINGS,
    )

    assert response.feasible_count >= 10
    assert len(response.recommendations) == 10
    ranks = [r.optimization.rank for r in response.recommendations]
    assert ranks == sorted(ranks)


def test_zero_feasible_stations_handled():
    stations = _make_stations(5, near_ev=False)  # far away
    ev_request = _make_ev_request(current_soc=0.01)  # almost no charge

    response = recommend_charging_stations(
        ev_request=ev_request,
        charging_stations=stations,
        routing_provider=MockRoutingProvider(),
        waiting_time_predictor=MockWaitingTimePredictor(),
        settings=DEFAULT_SETTINGS,
    )

    assert response.feasible_count == 0
    assert response.recommendations == []
    assert response.message is not None


def test_empty_dataset_handled_without_crashing():
    ev_request = _make_ev_request()
    response = recommend_charging_stations(
        ev_request=ev_request,
        charging_stations=[],
        routing_provider=MockRoutingProvider(),
        waiting_time_predictor=MockWaitingTimePredictor(),
        settings=DEFAULT_SETTINGS,
    )
    assert response.candidate_count == 0
    assert response.recommendations == []
