/**
 * types.ts
 * Strictly typed data contracts corresponding to FastAPI backend schemas
 * and frontend state representations.
 */

export interface Location {
  latitude: number;
  longitude: number;
}

export interface LocationPreset {
  id: string;
  name: string;
  description: string;
  location: Location;
}

export interface EVRequest {
  current_location: Location;
  destination: Location;
  current_soc: number; // 0.0 to 1.0 decimal
  target_destination_soc: number; // 0.0 to 1.0 decimal
  battery_capacity_kwh: number;
  energy_consumption_kwh_per_km: number;
}

export interface RouteLeg {
  distance_km: number;
  travel_time_min: number;
}

export interface EnergyResult {
  available_energy_kwh: number;
  energy_to_station_kwh: number;
  feasible: boolean;
  remaining_energy_at_station_kwh?: number;
  energy_from_station_to_destination_kwh?: number;
  target_energy_at_destination_kwh?: number;
  charging_energy_kwh?: number;
}

export interface ChargingResult {
  charger_power_kw: number;
  charging_time_min: number;
}

export interface OptimizationResult {
  total_drive_distance_km: number;
  total_drive_time_min: number;
  total_journey_time_min: number;
  normalized_metrics: Record<string, number>;
  overall_score: number;
  rank: number;
}

/**
 * Future-proof Grid & Infrastructure extensions
 */
export interface GridInfrastructure {
  grid_load_percent?: number;
  substation_id?: string;
  maximum_available_power_kw?: number;
  estimated_grid_congestion?: 'Low' | 'Moderate' | 'High';
  operator?: string;
  connector_type?: string;
  queue_length?: number;
}

export interface StationRecommendation {
  station_id: string;
  location: Location;
  source_to_station: RouteLeg;
  station_to_destination: RouteLeg;
  energy: EnergyResult;
  charging: ChargingResult;
  waiting_time_min: number;
  charging_cost: number;
  optimization: OptimizationResult;
  station_name?: string;
  city?: string;
  vendor?: string;
  charger_type?: string;
  no_of_chargers?: number;
  available_chargers?: number;
  address?: string;
  grid?: GridInfrastructure;
  route_geometry?: {
    source_to_station?: [number, number][];
    station_to_destination?: [number, number][];
  };
}

export interface RecommendationResponse {
  candidate_count: number;
  feasible_count: number;
  recommendations: StationRecommendation[];
  message?: string | null;
}

export interface Vehicle {
  id: string;
  manufacturer: string;
  model: string;
  batteryCapacityKwh: number;
  efficiencyKwhPerKm: number;
  rangeKm?: number;
  category?: 'Hatchback' | 'SUV' | 'Sedan';
}

export type SortOption =
  | 'recommended'
  | 'journey_time'
  | 'cost'
  | 'waiting_time'
  | 'charging_time'
  | 'distance'
  | 'power';
