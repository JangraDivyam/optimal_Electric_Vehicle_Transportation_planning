"""
station_loader.py

Responsible ONLY for loading the charging-station CSV into validated
ChargingStation objects. Invalid rows are reported, not silently dropped.
"""

from __future__ import annotations

import logging

import pandas as pd

from app.schemas import ChargingStation

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = [
    "station_id",
    "latitude",
    "longitude",
    "charger_power_kw",
    "price_per_kwh",
]

# Columns from the CSV that are NOT part of the core schema, but may be
# useful features for Harsh's waiting-time ML model. Captured verbatim
# in ChargingStation.extra_features rather than being interpreted here.
PASSTHROUGH_COLUMNS = [
    "city",
    "vendor",
    "charger_type",
    "no_of_chargers",
    "available",
]


def load_charging_stations(csv_path: str) -> list[ChargingStation]:
    """
    Load, validate, and return charging stations from a CSV file.

    Rows with missing required fields or out-of-range coordinates/power
    are rejected and logged, not silently skipped.
    """
    df = pd.read_csv(csv_path)

    missing_columns = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_columns:
        raise ValueError(
            f"Charging-station CSV is missing required columns: {missing_columns}"
        )

    stations: list[ChargingStation] = []
    rejected_count = 0

    for row_index, row in df.iterrows():
        try:
            extra_features = {
                col: row[col]
                for col in PASSTHROUGH_COLUMNS
                if col in df.columns and pd.notna(row[col])
            }
            station = ChargingStation(
                station_id=str(row["station_id"]),
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                charger_power_kw=float(row["charger_power_kw"]),
                price_per_kwh=float(row["price_per_kwh"]),
                extra_features=extra_features,
            )
            stations.append(station)
        except Exception as exc:  # noqa: BLE001 - report and continue
            rejected_count += 1
            logger.warning("Rejected station row %d: %s", row_index, exc)

    logger.info(
        "Loaded %d charging stations (%d rows rejected) from %s",
        len(stations),
        rejected_count,
        csv_path,
    )
    return stations
