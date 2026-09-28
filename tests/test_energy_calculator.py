from app.energy_calculator import (
    calculate_available_energy_kwh,
    calculate_charging_energy_kwh,
    calculate_energy_from_station_to_destination_kwh,
    calculate_energy_to_station_kwh,
    calculate_remaining_energy_at_station_kwh,
    calculate_target_energy_at_destination_kwh,
    is_station_feasible,
)


def test_available_battery_energy():
    # Test 1
    assert calculate_available_energy_kwh(battery_capacity_kwh=60, current_soc=0.35) == 21.0


def test_energy_to_station():
    # Test 2
    result = calculate_energy_to_station_kwh(
        ev_to_station_distance_km=10, energy_consumption_kwh_per_km=0.16
    )
    assert round(result, 6) == 1.6


def test_reachable_station():
    # Test 3
    assert is_station_feasible(available_energy_kwh=5, energy_to_station_kwh=4) is True


def test_unreachable_station():
    # Test 4
    assert is_station_feasible(available_energy_kwh=5, energy_to_station_kwh=6) is False


def test_complete_charging_energy_calculation():
    # Test 5
    battery_capacity_kwh = 60
    current_soc = 0.35
    available_energy_kwh = calculate_available_energy_kwh(battery_capacity_kwh, current_soc)
    assert available_energy_kwh == 21.0

    energy_to_station_kwh = calculate_energy_to_station_kwh(
        ev_to_station_distance_km=10, energy_consumption_kwh_per_km=0.16
    )
    assert round(energy_to_station_kwh, 2) == 1.6

    remaining_energy_at_station_kwh = calculate_remaining_energy_at_station_kwh(
        available_energy_kwh, energy_to_station_kwh
    )
    assert round(remaining_energy_at_station_kwh, 2) == 19.4

    energy_from_station_to_destination_kwh = calculate_energy_from_station_to_destination_kwh(
        station_to_destination_distance_km=100, energy_consumption_kwh_per_km=0.16
    )
    assert round(energy_from_station_to_destination_kwh, 2) == 16.0

    target_energy_at_destination_kwh = calculate_target_energy_at_destination_kwh(
        battery_capacity_kwh=60, target_destination_soc=0.80
    )
    assert target_energy_at_destination_kwh == 48.0

    charging_energy_kwh = calculate_charging_energy_kwh(
        energy_from_station_to_destination_kwh,
        target_energy_at_destination_kwh,
        remaining_energy_at_station_kwh,
    )
    assert round(charging_energy_kwh, 2) == 44.6


def test_no_charging_required():
    # Test 6
    remaining_energy_at_station_kwh = 50.0
    energy_from_station_to_destination_kwh = 5.0
    target_energy_at_destination_kwh = 10.0

    charging_energy_kwh = calculate_charging_energy_kwh(
        energy_from_station_to_destination_kwh,
        target_energy_at_destination_kwh,
        remaining_energy_at_station_kwh,
    )
    assert charging_energy_kwh == 0.0
