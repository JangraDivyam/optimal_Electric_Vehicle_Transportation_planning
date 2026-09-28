'use client';

import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Scale, SlidersHorizontal } from 'lucide-react';
import { StationRecommendation, SortOption } from '@/lib/types';
import { StationCard } from './StationCard';

interface StationListProps {
  stations: StationRecommendation[];
  selectedStationId?: string;
  comparedStationIds: string[];
  onSelectStation: (stationId: string) => void;
  onToggleCompare: (stationId: string) => void;
  onOpenCompare: () => void;
  candidateCount?: number;
  feasibleCount?: number;
}

export const StationList: React.FC<StationListProps> = ({
  stations,
  selectedStationId,
  comparedStationIds,
  onSelectStation,
  onToggleCompare,
  onOpenCompare,
  candidateCount,
  feasibleCount,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  // Sorted list for presentation only - backend rank property is untouched!
  const sortedStations = useMemo(() => {
    const list = [...stations];
    switch (sortBy) {
      case 'journey_time':
        return list.sort(
          (a, b) => a.optimization.total_journey_time_min - b.optimization.total_journey_time_min
        );
      case 'cost':
        return list.sort((a, b) => a.charging_cost - b.charging_cost);
      case 'waiting_time':
        return list.sort((a, b) => a.waiting_time_min - b.waiting_time_min);
      case 'charging_time':
        return list.sort(
          (a, b) => a.charging.charging_time_min - b.charging.charging_time_min
        );
      case 'distance':
        return list.sort(
          (a, b) => a.optimization.total_drive_distance_km - b.optimization.total_drive_distance_km
        );
      case 'power':
        return list.sort(
          (a, b) => b.charging.charger_power_kw - a.charging.charger_power_kw
        );
      case 'recommended':
      default:
        return list.sort((a, b) => a.optimization.rank - b.optimization.rank);
    }
  }, [stations, sortBy]);

  return (
    <div className="space-y-4">
      {/* List Header with Sorting & Compare Drawer Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Recommended Stations
          </h2>
          <p className="text-xs text-slate-500">
            Click any station to focus on map • Sorted by {sortBy === 'recommended' ? 'Recommended Rank' : sortBy}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sorting Dropdown */}
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <label htmlFor="station-sort" className="sr-only">
              Sort recommendations
            </label>
            <select
              id="station-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="recommended">Sort: Recommended (Rank)</option>
              <option value="journey_time">Lowest Total Journey Time</option>
              <option value="cost">Lowest Cost</option>
              <option value="waiting_time">Lowest Waiting Time</option>
              <option value="charging_time">Fastest Charging Time</option>
              <option value="distance">Shortest Distance</option>
              <option value="power">Highest Charger Power</option>
            </select>
          </div>

          {/* Compare Button */}
          {comparedStationIds.length > 0 && (
            <button
              type="button"
              onClick={onOpenCompare}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare ({comparedStationIds.length}/3)</span>
            </button>
          )}
        </div>
      </div>

      {/* Station Cards List */}
      <div className="space-y-3.5">
        {sortedStations.map((station) => (
          <StationCard
            key={station.station_id}
            station={station}
            isSelected={selectedStationId === station.station_id}
            isCompared={comparedStationIds.includes(station.station_id)}
            onSelect={() => onSelectStation(station.station_id)}
            onToggleCompare={() => onToggleCompare(station.station_id)}
            candidateCount={candidateCount}
            feasibleCount={feasibleCount}
          />
        ))}
      </div>
    </div>
  );
};
