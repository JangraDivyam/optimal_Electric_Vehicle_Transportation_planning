from app.charging_calculator import calculate_charging_time_min


def test_charging_time():
    # Test 7
    result = calculate_charging_time_min(charging_energy_kwh=30, charger_power_kw=60)
    assert result == 30.0


def test_charging_time_is_zero_when_no_energy_needed():
    result = calculate_charging_time_min(charging_energy_kwh=0, charger_power_kw=60)
    assert result == 0.0


def test_charging_time_raises_on_zero_power_when_energy_needed():
    import pytest

    with pytest.raises(ValueError):
        calculate_charging_time_min(charging_energy_kwh=10, charger_power_kw=0)
