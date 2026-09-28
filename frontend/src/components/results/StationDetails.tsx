'use client';

import React from 'react';
import {
  Navigation,
  Battery,
  Zap,
  Clock,
  IndianRupee,
  Building,
  MapPin,
  ExternalLink,
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
import { RankingExplanation } from './RankingExplanation';
import { TechnicalDetails } from './TechnicalDetails';

interface StationDetailsProps {
  station: StationRecommendation;
  candidateCount?: number;
  feasibleCount?: number;
}

export const StationDetails: React.FC<StationDetailsProps> = ({
  station,
  candidateCount,
  feasibleCount,
}) => {
  const { energy, charging, source_to_station, station_to_destination } = station;
  const displayName = getStationDisplayName(station);
  const locationDetails = getStationLocationDetails(station);

  return (
    <div className="pt-3.5 border-t border-slate-100 space-y-3.5">
      {/* Station Overview & Location Information */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
            <Building className="w-3.5 h-3.5 text-slate-600" />
            <span>Station & Location Overview</span>
          </span>
          <a
            href={locationDetails.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center space-x-1 hover:underline"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="text-sm font-bold text-slate-900 mb-1.5">
          {displayName}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
          <div className="flex items-start space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">{locationDetails.area}</span>
              <span className="text-[11px] text-slate-500">{locationDetails.city}, Delhi NCR</span>
            </div>
          </div>

          <div className="flex items-start space-x-1.5 font-mono text-[11px]">
            <span className="text-slate-400">Coordinates:</span>
            <span className="text-slate-800 font-semibold">{locationDetails.formattedCoords}</span>
          </div>

          {station.vendor && (
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Operator:</span>
              <span className="font-medium text-slate-800">{station.vendor}</span>
            </div>
          )}

          {station.charger_type && (
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Connector:</span>
              <span className="font-medium text-slate-800">{station.charger_type}</span>
            </div>
          )}

          {station.no_of_chargers !== undefined && station.no_of_chargers !== null && (
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Chargers:</span>
              <span className="font-medium text-emerald-700">
                {station.available_chargers ?? station.no_of_chargers} of {station.no_of_chargers} Available
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 1. Route Breakdown */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5 mb-2">
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          <span>Route Breakdown</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="bg-white border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
              Leg 1: Current → Station
            </span>
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-500">Distance:</span>
              <span className="font-semibold text-slate-800">
                {formatDistance(source_to_station.distance_km)}
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-1">
              <span className="text-slate-500">Travel Time:</span>
              <span className="font-semibold text-slate-800">
                {formatTime(source_to_station.travel_time_min)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
              Leg 2: Station → Destination
            </span>
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="text-slate-500">Distance:</span>
              <span className="font-semibold text-slate-800">
                {formatDistance(station_to_destination.distance_km)}
              </span>
            </div>
            <div className="flex justify-between py-0.5 pt-1">
              <span className="text-slate-500">Travel Time:</span>
              <span className="font-semibold text-slate-800">
                {formatTime(station_to_destination.travel_time_min)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Energy Breakdown */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5 mb-2">
          <Battery className="w-3.5 h-3.5 text-emerald-600" />
          <span>Battery & Energy Simulation</span>
        </h4>

        <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs divide-y divide-slate-100">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-600">Available energy at departure:</span>
            <span className="font-semibold text-slate-800">
              {formatEnergy(energy.available_energy_kwh)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-600">Energy required to reach station:</span>
            <span className="font-semibold text-amber-700">
              -{formatEnergy(energy.energy_to_station_kwh)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-600">Remaining energy at station arrival:</span>
            <span className="font-semibold text-slate-800">
              {formatEnergy(energy.remaining_energy_at_station_kwh)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-600">Energy needed from station to destination:</span>
            <span className="font-semibold text-slate-800">
              {formatEnergy(energy.energy_from_station_to_destination_kwh)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 text-emerald-900 font-semibold bg-emerald-50/50 px-2 rounded -mx-1">
            <span>Energy to charge at this station:</span>
            <span className="font-bold text-emerald-700">
              +{formatEnergy(energy.charging_energy_kwh)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Charging, Cost & Waiting Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="bg-white border border-slate-200 rounded-lg p-2.5">
          <div className="flex items-center space-x-1.5 text-slate-500 mb-0.5">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] font-semibold uppercase">Charger Power</span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {formatPower(charging.charger_power_kw)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Duration: <strong className="text-slate-700">{formatTime(charging.charging_time_min)}</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-2.5">
          <div className="flex items-center space-x-1.5 text-slate-500 mb-0.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-semibold uppercase">Waiting Time</span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {formatTime(station.waiting_time_min)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Estimated queue duration
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-2.5">
          <div className="flex items-center space-x-1.5 text-slate-500 mb-0.5">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-semibold uppercase">Estimated Cost</span>
          </div>
          <div className="text-sm font-bold text-emerald-700">
            {formatCost(station.charging_cost)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Billing for energy recharged
          </div>
        </div>
      </div>

      {/* 4. Why is this station recommended? */}
      <RankingExplanation station={station} />

      {/* 5. Technical Details Debug View */}
      <TechnicalDetails
        station={station}
        candidateCount={candidateCount}
        feasibleCount={feasibleCount}
      />
    </div>
  );
};
