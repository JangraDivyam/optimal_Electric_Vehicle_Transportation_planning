"""
charging_calculator.py

Responsible ONLY for:
    - charging time
    - charger power

Idealized linear charging model (constant power). Kept isolated so a
realistic charging curve can replace this function later without
touching any other module.
"""

from __future__ import annotations

from app.schemas import ChargingResult


def calculate_charging_time_min(charging_energy_kwh: float, charger_power_kw: float) -> float:
    if charging_energy_kwh <= 0:
        return 0.0
    if charger_power_kw <= 0:
        raise ValueError("charger_power_kw must be > 0 to calculate charging time")
    charging_time_hours = charging_energy_kwh / charger_power_kw
    return charging_time_hours * 60


def evaluate_charging(charging_energy_kwh: float, charger_power_kw: float) -> ChargingResult:
    return ChargingResult(
        charger_power_kw=charger_power_kw,
        charging_time_min=calculate_charging_time_min(charging_energy_kwh, charger_power_kw),
    )
