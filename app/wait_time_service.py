"""
wait_time_service.py

Responsible ONLY for:
    - Harsh's ML model interface
    - waiting-time prediction
    - mock waiting-time prediction

This module does NOT recreate Harsh's model, and does NOT assume its
feature schema. It defines a thin interface; the real implementation
(HttpWaitingTimePredictor) forwards whatever feature dict it is given to
Harsh's service and returns his predicted minutes.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any

import requests

logger = logging.getLogger(__name__)


class WaitingTimePredictor(ABC):
    @abstractmethod
    def predict(self, features: dict[str, Any]) -> float:
        """Return predicted waiting_time_min for one station."""
        raise NotImplementedError


class MockWaitingTimePredictor(WaitingTimePredictor):
    """
    Deterministic stand-in for Harsh's model, for local development and
    tests. Waiting time is derived only from charger_power_kw and
    charging_energy_kwh so the same input always produces the same
    output - no randomness.
    """

    BASE_WAIT_MIN = 5.0

    def predict(self, features: dict[str, Any]) -> float:
        charger_power_kw = float(features.get("charger_power_kw", 0) or 0)
        charging_energy_kwh = float(features.get("charging_energy_kwh", 0) or 0)
        # Busier-looking (higher-power, higher-draw) stations get a
        # slightly higher deterministic wait - purely illustrative.
        return round(self.BASE_WAIT_MIN + 0.05 * charger_power_kw + 0.02 * charging_energy_kwh, 2)


class HttpWaitingTimePredictor(WaitingTimePredictor):
    """
    Calls Harsh's real ML service over HTTP. The exact feature schema is
    owned by his model, not by this module - callers pass whatever
    features are configured/required, and this class just forwards them.
    """

    def __init__(self, ml_service_url: str, timeout_seconds: float = 5.0):
        if not ml_service_url:
            raise ValueError("ML_SERVICE_URL is required for HttpWaitingTimePredictor")
        self.ml_service_url = ml_service_url
        self.timeout_seconds = timeout_seconds

    def predict(self, features: dict[str, Any]) -> float:
        try:
            response = requests.post(
                self.ml_service_url, json=features, timeout=self.timeout_seconds
            )
            response.raise_for_status()
            payload = response.json()
            return float(payload["waiting_time_min"])
        except (requests.RequestException, KeyError, ValueError, TypeError) as exc:
            logger.warning("Waiting-time prediction failed, defaulting to 0: %s", exc)
            return 0.0
