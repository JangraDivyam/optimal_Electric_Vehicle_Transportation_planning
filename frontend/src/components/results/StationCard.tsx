'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  Clock,
  Zap,
  MapPin,
  ArrowRight,
  IndianRupee,
  Navigation,
  CheckSquare,
  Square,
} from 'lucide-react';
import { StationRecommendation } from '@/lib/types';
import {
  formatDistance,
  formatTime,
  formatCost,
  formatEnergy,
  formatPower,
  getStationDisplayName,
  getStationLocationDetails,
} from '@/lib/formatters';
import { StationDetails } from './StationDetails';

interface StationCardProps {
  station: StationRecommendation;
  isSelected?: boolean;
  isCompared?: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
  candidateCount?: number;
  feasibleCount?: number;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  isSelected = false,
  isCompared = false,
  onSelect,
  onToggleCompare,
  candidateCount,
  feasibleCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { optimization, charging, source_to_station, station_to_destination, waiting_time_min, charging_cost } = station;

  const isTopRanked = optimization.rank === 1;
  const displayName = getStationDisplayName(station);
  const locationDetails = getStationLocationDetails(station);

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl transition-all duration-150 cursor-pointer border shadow-2xs overflow-hidden ${
        isSelected
          ? 'border-emerald-600 ring-1 ring-emerald-600/30'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top Header: Rank Badge, Vendor/Type tags, Compare Toggle */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-tight ${
                isTopRanked
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              #{optimization.rank}
              <span className="ml-1 font-medium">
                {isTopRanked ? 'Top Pick' : 'Station'}
              </span>
            </span>

            {station.vendor && (
              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {station.vendor}
              </span>
            )}

            {station.charger_type && (
              <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {station.charger_type}
              </span>
            )}

            <span className="text-[11px] font-mono text-slate-400">
              {station.station_id}
            </span>
          </div>

          {/* Compare toggle button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
            className={`inline-flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
              isCompared
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title="Select up to 3 stations to compare side-by-side"
          >
            {isCompared ? (
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Compare</span>
          </button>
        </div>

        {/* Station Name & Location Details */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            {displayName}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span className="flex items-center text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-rose-500 mr-1 flex-shrink-0" />
              <span>{locationDetails.area}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-[11px] text-slate-500">
              {locationDetails.formattedCoords}
            </span>
            {station.available_chargers !== undefined && station.available_chargers !== null && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-medium text-emerald-700">
                  {station.available_chargers}/{station.no_of_chargers ?? 1} Available
                </span>
              </>
            )}
          </div>
        </div>

        {/* PRIMARY METRIC: Total Journey Time (Section 17) */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Total Journey Time
            </span>
            <div className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
              {formatTime(optimization.total_journey_time_min)}
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-600 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Drive</span>
              <span className="font-semibold text-slate-800">
                {formatTime(optimization.total_drive_time_min)}
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Waiting</span>
              <span className="font-semibold text-amber-700">
                {formatTime(waiting_time_min)}
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Charging</span>
              <span className="font-semibold text-emerald-700">
                {formatTime(charging.charging_time_min)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Key Metrics Strip (Section 16) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 border-t border-b border-slate-100">
          {/* Leg 1 */}
          <div>
            <div className="text-slate-400 text-[10px] font-semibold uppercase mb-0.5">
              Origin → Station
            </div>
            <div className="font-semibold text-slate-900">
              {formatDistance(source_to_station.distance_km)}
            </div>
            <div className="text-[11px] text-slate-500">
              {formatTime(source_to_station.travel_time_min)}
            </div>
          </div>

          {/* Leg 2 */}
          <div>
            <div className="text-slate-400 text-[10px] font-semibold uppercase mb-0.5">
              Station → Dest
            </div>
            <div className="font-semibold text-slate-900">
              {formatDistance(station_to_destination.distance_km)}
            </div>
            <div className="text-[11px] text-slate-500">
              {formatTime(station_to_destination.travel_time_min)}
            </div>
          </div>

          {/* Charger Power */}
          <div>
            <div className="text-slate-400 text-[10px] font-semibold uppercase mb-0.5">
              Charger Power
            </div>
            <div className="font-semibold text-slate-900">
              {formatPower(charging.charger_power_kw)}
            </div>
            <div className="text-[11px] text-slate-500">
              {formatTime(charging.charging_time_min)} charge
            </div>
          </div>

          {/* Charging Cost */}
          <div>
            <div className="text-slate-400 text-[10px] font-semibold uppercase mb-0.5">
              Est. Cost
            </div>
            <div className="font-semibold text-emerald-700">
              {formatCost(charging_cost)}
            </div>
            <div className="text-[11px] text-slate-500">
              +{formatEnergy(station.energy.charging_energy_kwh)}
            </div>
          </div>
        </div>

        {/* Expand Details Trigger */}
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 transition"
          >
            <span>{isExpanded ? 'Hide details' : 'View details'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          <span className="text-[11px] font-mono text-slate-400">
            {locationDetails.formattedCoords}
          </span>
        </div>

        {/* Detailed Breakdown when expanded */}
        {isExpanded && (
          <div onClick={(e) => e.stopPropagation()}>
            <StationDetails
              station={station}
              candidateCount={candidateCount}
              feasibleCount={feasibleCount}
            />
          </div>
        )}
      </div>
    </div>
  );
};
