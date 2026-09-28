# EV Route & Charging Station Recommendation Module

## 1. Project objective

Given an EV's current location, destination, battery state, and a charging
station dataset, recommend the **Top 10 feasible charging stations** to
stop at en route, ranked by a configurable multi-objective score.

This module owns everything from H3 candidate generation through final
ranking. It does **not** own waiting-time prediction (that is teammate
Harsh's ML model, integrated through a clean interface) and does **not**
own grid/substation capacity analysis (a separate future module).

## 2. Architecture

```
EV INPUT
    |
    v
H3 CANDIDATE GENERATION  (20 nearby stations, geography only)
    |
    v
ROAD ROUTING             (EV->station, station->destination)
    |
    v
ENERGY + FEASIBILITY     (road distance only, never H3 distance)
    |
    v
CHARGING ENERGY/TIME
    |
    v
HARSH'S ML MODEL         (waiting time - only feasible stations reach this)
    |
    v
CHARGING COST
    |
    v
NORMALIZATION -> WEIGHTED SCORE -> SORT -> TOP 10
```

H3 is used **only** to find nearby stations. All distance/energy math uses
real road distances from the routing provider.

## 3. Folder structure

```
ev_route_recommendation/
├── app/
│   ├── main.py                  FastAPI app (/recommend, /health)
│   ├── pipeline.py               orchestrates all stages in order
│   ├── candidate_generator.py    H3 indexing + expanding-ring search
│   ├── route_service.py          RoutingProvider abstraction (Mock/Google)
│   ├── energy_calculator.py       available/required energy, feasibility
│   ├── charging_calculator.py    charging time
│   ├── wait_time_service.py      WaitingTimePredictor interface (Mock/Http)
│   ├── cost_calculator.py        charging cost
│   ├── station_ranker.py         normalization, weighted score, Top N
│   ├── recommendation_service.py builds the final response shapes
│   ├── station_loader.py         loads/validates the station CSV
│   ├── schemas.py                Pydantic models
│   └── settings.py               env-var configuration
├── data/
│   ├── switch_delhi_charging_stations_raw.xlsx  the real, messy source export
│   ├── prepare_station_data.py                   cleans the raw export -> CSV
│   └── charging_stations.csv                     cleaned dataset the app reads
├── tests/                        pytest suite (26 tests)
├── .env.example
├── .gitignore
└── requirements.txt
```

## 4. Installation

```bash
cd ev_route_recommendation
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## 5. Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | (empty) | Required only when `MOCK_ROUTING=false` and `ROUTING_PROVIDER=google` |
| `OPENROUTESERVICE_API_KEY` | (empty) | Required only when `MOCK_ROUTING=false` and `ROUTING_PROVIDER=openrouteservice` (the default) |
| `ROUTING_PROVIDER` | openrouteservice | Which real provider to use once `MOCK_ROUTING=false`: `openrouteservice` or `google` |
| `H3_RESOLUTION` | 9 | H3 cell resolution for candidate search |
| `MOCK_ROUTING` | true | Use `MockRoutingProvider` instead of a real routing API |
| `MOCK_WAITING_TIME` | true | Use `MockWaitingTimePredictor` instead of Harsh's real model |
| `ML_SERVICE_URL` | (empty) | Harsh's waiting-time service endpoint |
| `CHARGING_STATION_CSV_PATH` | `data/charging_stations.csv` | Which station CSV to load |
| `CANDIDATE_STATION_COUNT` | 20 | H3 candidates generated per request |
| `FINAL_RECOMMENDATION_COUNT` | 10 | Stations returned per request |
| `WEIGHT_DRIVE_TIME` / `WEIGHT_WAITING_TIME` / `WEIGHT_CHARGING_TIME` / `WEIGHT_COST` / `WEIGHT_DISTANCE` | 0.20/0.25/0.25/0.15/0.15 | Multi-objective weights; must sum to 1.0 |

**H3 resolution 9** was chosen because its hexagons are roughly
0.1 km² — small enough to distinguish nearby stations in a dense urban
area like Delhi, but large enough that a handful of rings covers a
realistic driving radius without an excessive ring-expansion loop. The
resolution is fully configurable and the search logic works unchanged at
any resolution.

## 6. Charging-station dataset format

Required columns: `station_id, latitude, longitude, charger_power_kw,
price_per_kwh`. Extra columns are preserved per-station in
`extra_features` and forwarded to Harsh's waiting-time model, but are not
interpreted by this module itself.

### This project uses a real dataset, not synthetic demo data

`data/switch_delhi_charging_stations_raw.xlsx` is a real, messy export of
Delhi-area EV charging stations (891 rows, multiple vendors). It does
**not** match the required schema directly, so `data/prepare_station_data.py`
cleans it into `data/charging_stations.csv`. Documented cleaning decisions:

- **121 rows** had neither latitude/longitude nor capacity (blank
  template rows) — dropped, since a station with no location can't be
  H3-indexed or routed to.
- **`capacity`** is stored inconsistently (`'3.3kw'`, `'15 KW'`, or a bare
  number) — parsed into a numeric `charger_power_kw`. All rows in this
  dataset happened to already have a usable capacity value after
  cleanup; the fallback (median charger power) exists for datasets where
  that isn't true.
- **`cost_per_unit` was missing for ~28% of rows** — filled with the
  per-vendor median price, falling back to the dataset-wide median where
  a vendor has no price data at all. This is a documented estimate, not
  a claim about actual tariffs.
- **`id`** is missing for ~1/3 of rows and duplicated for a few others —
  a synthetic `GENxxxx` id is minted for missing ids, and a `-1`/`-2`
  suffix disambiguates real duplicate ids, so every `station_id` is
  guaranteed unique.

Re-run the cleaning step with:

```bash
python data/prepare_station_data.py
```

## 7. H3 candidate generation

`candidate_generator.py` indexes every station into an H3 cell at
`H3_RESOLUTION`, converts the EV's location to a cell, and searches an
expanding ring (`h3.grid_disk`, k = 0, 1, 2, ...) until at least
`CANDIDATE_STATION_COUNT` stations are found (or the dataset is
exhausted). If the whole dataset has fewer stations than that count, all
of them are returned. H3 never computes road distance — it only decides
which stations are worth sending to the routing stage.

## 8. Routing

`route_service.py` defines `RoutingProvider` with three implementations:
- `MockRoutingProvider` — deterministic, haversine distance × a detour
  factor and a fixed average urban speed. No network calls.
- `OpenRouteServiceRoutingProvider` — the default real provider. Calls
  OpenRouteService's free Matrix API in exactly **two** requests total
  regardless of candidate count (EV→all-stations one-to-many, then
  all-stations→destination many-to-one), rather than one request per
  leg per station. No billing account required — just a free API key.
- `GoogleRoutingProvider` — calls the Google Maps Routes API
  (Compute Route Matrix) per candidate, with timeout/error handling.

Both real providers mark a station `routing_failed` if its route can't
be computed, rather than crashing the whole request; `ROUTING_PROVIDER`
in `.env` picks which one is used once `MOCK_ROUTING=false`.

### Getting a free OpenRouteService API key

1. Sign up at https://openrouteservice.org/dev/#/signup (no credit card).
2. Create a token/API key from the dashboard.
3. Put it in `.env`: `OPENROUTESERVICE_API_KEY=your_key_here`.
4. Set `MOCK_ROUTING=false` and `ROUTING_PROVIDER=openrouteservice`.

The free tier's daily/per-minute quota comfortably covers development
and testing (2 API calls per `/recommend` request, regardless of how
many candidate stations are routed).

## 9. Energy model

See `energy_calculator.py`. Key formulas are in section 11 below.
`target_destination_soc` applies only to the station→destination leg,
never as a reserve for reaching the station.

## 10. Charging calculation

Idealized linear model: `charging_time_min = (charging_energy_kwh /
charger_power_kw) * 60`. Isolated in `charging_calculator.py` so a
realistic charging curve can replace it later.

## 11. ML integration (waiting time)

`wait_time_service.py` defines `WaitingTimePredictor.predict(features)`.
`MockWaitingTimePredictor` is deterministic (no randomness, safe for
tests). `HttpWaitingTimePredictor` forwards a feature dict — including
every extra CSV column captured per station — to `ML_SERVICE_URL`
(Harsh's real model) and returns `waiting_time_min`. This module does
**not** assume or hard-code his model's feature schema.

## 12. Cost calculation

`cost_calculator.py`: `charging_cost = charging_energy_kwh *
price_per_kwh` (+ an optional session fee).

## 13. Optimization

Five component metrics, min-max normalized to [0, 1] (equal values ⇒ 0,
no divide-by-zero), combined with configurable weights that must sum to
1.0:

```
overall_score =
    weight_drive_time    * normalized_drive_time
  + weight_waiting_time  * normalized_waiting_time
  + weight_charging_time * normalized_charging_time
  + weight_cost          * normalized_cost
  + weight_distance      * normalized_distance
```

`total_journey_time` is reported but intentionally **not** an
independent weighted objective, since it's the sum of drive + waiting +
charging time and would double-count them.

## 14. API usage

```
GET  /health
POST /recommend
```

Request body:
```json
{
  "current_location": {"latitude": 28.6139, "longitude": 77.2090},
  "destination": {"latitude": 28.5355, "longitude": 77.3910},
  "current_soc": 0.35,
  "target_destination_soc": 0.80,
  "battery_capacity_kwh": 60,
  "energy_consumption_kwh_per_km": 0.16
}
```

Run locally:
```bash
uvicorn app.main:app --reload
```

## 15. Mock mode

`MOCK_ROUTING=true` and `MOCK_WAITING_TIME=true` (the defaults) let the
entire pipeline run with zero external API calls or ML dependencies —
useful before Google Maps billing or Harsh's model are wired up.

## 16. Testing

```bash
pytest -q
```

26 tests covering: available energy, energy-to-station, feasibility
(reachable/unreachable), the full charging-energy worked example,
no-charging-required, charging time (incl. zero-energy and zero-power
edge cases), normalization (incl. equal-values edge case), Top-10 /
fewer-than-10 / zero-feasible ranking, H3 candidate count and expanding
search, infeasible-stations-excluded-from-optimization, and end-to-end
API happy-path/validation tests against the real cleaned dataset.

## 17. Limitations

- `MockRoutingProvider` uses haversine × detour factor, not real roads —
  fine for development, not for production distance/time accuracy.
- The cleaned dataset fills ~28% of prices and a small number of missing
  charger powers with medians rather than real per-station values (see
  section 6) — treat absolute cost/time numbers as illustrative until
  real routing + real pricing are wired in.
- `HttpWaitingTimePredictor` assumes Harsh's service accepts a JSON
  feature dict and returns `{"waiting_time_min": ...}` — adjust the
  request/response shape once his actual contract is finalized.
- No charging curve (linear charging model only).

## 18. Future improvements

- Real Google Routes integration in production (`MOCK_ROUTING=false`).
- Real waiting-time integration once Harsh's model is deployed.
- Optional routing-result cache (origin, destination) to cut repeated
  API calls during development.
- Non-linear charging curves.
- Grid/substation capacity analysis as a separate downstream module.
