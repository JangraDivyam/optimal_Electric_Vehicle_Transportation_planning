"""
cost_calculator.py

Responsible ONLY for:
    - charging cost
"""

from __future__ import annotations


def calculate_charging_cost(
    charging_energy_kwh: float, price_per_kwh: float, session_fee: float = 0.0
) -> float:
    return session_fee + charging_energy_kwh * price_per_kwh
