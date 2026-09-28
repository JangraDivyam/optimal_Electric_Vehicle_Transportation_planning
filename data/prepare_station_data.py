"""
prepare_station_data.py

Converts the raw "Switch Delhi" charging-station export
(switch_delhi_charging_stations_raw.xlsx) into the clean CSV schema that
the EV Route & Charging Station Recommendation Module expects:

    station_id, latitude, longitude, charger_power_kw, price_per_kwh
    (+ extra passthrough columns for Harsh's ML model / debugging)

This is a REAL, messy, third-party dataset, not synthetic demo data, so
this script documents every cleaning decision it makes. Run it once to
regenerate data/charging_stations.csv:

    python data/prepare_station_data.py
"""

from __future__ import annotations

import pandas as pd

RAW_PATH = "data/switch_delhi_charging_stations_raw.xlsx"
CLEAN_PATH = "data/charging_stations.csv"


def parse_charger_power_kw(raw_capacity) -> float | None:
    """
    The raw 'capacity' column is inconsistent:
      - some rows are strings like '3.3kw', '3.3 KW', '15 KW', '22 kW'
      - some rows are already plain numbers (7, 2.2, 48, 20, ...)
      - some rows are missing entirely
    Normalize all of these to a float number of kW, or None if unusable.
    """
    if pd.isna(raw_capacity):
        return None
    if isinstance(raw_capacity, (int, float)):
        return float(raw_capacity)
    text = str(raw_capacity).strip().lower().replace("kw", "").strip()
    try:
        return float(text)
    except ValueError:
        return None


def build_station_id(row, fallback_counter: dict) -> str:
    """
    Prefer the dataset's own 'id' column. About a third of rows have no id,
    and a handful of ids repeat across two rows (same code reused by the
    same vendor) - both cases would break a schema that needs one row per
    station_id, so we mint a synthetic, guaranteed-unique id in both cases.
    """
    raw_id = row["id"]
    if pd.isna(raw_id) or str(raw_id).strip() == "":
        fallback_counter["n"] += 1
        return f"GEN{fallback_counter['n']:04d}"
    return str(raw_id).strip()


def main() -> None:
    df = pd.read_excel(RAW_PATH)
    original_count = len(df)

    # --- Drop rows with no usable location -----------------------------
    # 121 rows have neither latitude/longitude nor capacity - these look
    # like entirely blank template rows. Without coordinates a station
    # cannot be H3-indexed or routed to at all, so it must be dropped.
    df = df.dropna(subset=["latitude", "longitude"]).copy()
    dropped_no_location = original_count - len(df)

    # --- Charger power ---------------------------------------------------
    df["charger_power_kw"] = df["capacity"].apply(parse_charger_power_kw)
    missing_power_mask = df["charger_power_kw"].isna()
    missing_power_count = int(missing_power_mask.sum())
    # Charging time = charging_energy_kwh / charger_power_kw, so a missing
    # power value can't be left blank. Fill with the dataset-wide median
    # charger power (documented assumption - not a manufacturer spec).
    median_power = float(df["charger_power_kw"].median())
    df.loc[missing_power_mask, "charger_power_kw"] = median_power
    # A handful of rows use 0 kW placeholders - guard against a later
    # division by zero the same way.
    zero_power_count = int((df["charger_power_kw"] <= 0).sum())
    df.loc[df["charger_power_kw"] <= 0, "charger_power_kw"] = median_power

    # --- Price per kWh -----------------------------------------------------
    # 'cost_per_unit' is missing for ~45% of rows. Fill with the per-vendor
    # median where available, else the dataset-wide median. This is a
    # documented estimate, not a claim about real tariffs.
    dataset_median_price = float(df["cost_per_unit"].median())
    vendor_median_price = df.groupby("vendor")["cost_per_unit"].transform("median")
    price = df["cost_per_unit"].fillna(vendor_median_price)
    missing_price_count = int(price.isna().sum())
    price = price.fillna(dataset_median_price)
    df["price_per_kwh"] = price

    # --- Station id --------------------------------------------------------
    fallback_counter = {"n": 0}
    df["station_id"] = df.apply(lambda r: build_station_id(r, fallback_counter), axis=1)
    # In case a real id still collides with another real id, disambiguate.
    dupe_mask = df["station_id"].duplicated(keep=False)
    if dupe_mask.any():
        dupe_counters: dict[str, int] = {}
        new_ids = []
        for station_id, is_dupe in zip(df["station_id"], dupe_mask):
            if not is_dupe:
                new_ids.append(station_id)
                continue
            dupe_counters[station_id] = dupe_counters.get(station_id, 0) + 1
            new_ids.append(f"{station_id}-{dupe_counters[station_id]}")
        df["station_id"] = new_ids

    clean = df[
        [
            "station_id",
            "latitude",
            "longitude",
            "charger_power_kw",
            "price_per_kwh",
            "city",
            "vendor",
            "charger_type",
            "no_of_chargers",
            "available",
        ]
    ].reset_index(drop=True)

    clean.to_csv(CLEAN_PATH, index=False)

    print(f"Loaded {original_count} raw rows from Switch Delhi export")
    print(f"Dropped {dropped_no_location} rows with no latitude/longitude")
    print(f"Filled {missing_power_count} missing charger_power_kw values with median {median_power:.2f} kW")
    print(f"Reset {zero_power_count} zero/invalid charger_power_kw values to the same median")
    print(f"Filled {missing_price_count} missing price_per_kwh values (vendor median, else dataset median {dataset_median_price:.2f})")
    print(f"Wrote {len(clean)} clean stations to {CLEAN_PATH}")


if __name__ == "__main__":
    main()
