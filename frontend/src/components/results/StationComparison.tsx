'use client';

import React from 'react';
import { X, Scale, Check, Zap, Clock, IndianRupee, Navigation, MapPin, Building } from 'lucide-react';
import { StationRecommendation } from '@/lib/types';
import {
  formatDistance,
  formatTime,
  formatCost,
  formatPower,
  getStationDisplayName,
  getStationLocationDetails,
} from '@/lib/formatters';

interface StationComparisonProps {
  stations: StationRecommendation[];
  onRemoveStation: (stationId: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const StationComparison: React.FC<StationComparisonProps> = ({
  stations,
  onRemoveStation,
  onClearAll,
  onClose,
}) => {
  if (stations.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Compare Charging Stations
              </h3>
              <p className="text-xs text-slate-500">
                Evaluating {stations.length} selected stations side-by-side
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-slate-500 hover:text-rose-600 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close comparison modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-3 text-slate-500 font-bold uppercase tracking-wider w-40">
                  Metric
                </th>
                {stations.map((st) => (
                  <th key={st.station_id} className="py-3 px-3 text-slate-900 font-bold text-center">
                    <div className="flex items-center justify-center space-x-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                        #{st.optimization.rank}
                      </span>
                      <span className="font-mono text-xs">{st.station_id}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveStation(st.station_id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                        title="Remove from comparison"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Station Name */}
              <tr className="bg-slate-50/70">
                <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-600" />
                  <span>Station Name</span>
                </td>
                {stations.map((st) => (
                  <td key={st.station_id} className="py-2.5 px-3 text-center font-bold text-slate-900">
                    {getStationDisplayName(st)}
                  </td>
                ))}
              </tr>

              {/* Location & Area */}
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-600 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Location / Area</span>
                </td>
                {stations.map((st) => {
                  const loc = getStationLocationDetails(st);
                  return (
                    <td key={st.station_id} className="py-2.5 px-3 text-center">
                      <div className="font-medium text-slate-800">{loc.area}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{loc.formattedCoords}</div>
                    </td>
                  );
                })}
              </tr>

              {/* Operator & Connector */}
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-600">Operator & Connector</td>
                {stations.map((st) => (
                  <td key={st.station_id} className="py-2.5 px-3 text-center">
                    <span className="font-semibold text-slate-800">{st.vendor ?? 'EV Network'}</span>
                    {st.charger_type && (
                      <span className="block text-[11px] text-slate-500">{st.charger_type}</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Total Journey Time */}
              <tr className="bg-emerald-50/40">
                <td className="py-3 px-3 font-bold text-emerald-950 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Total Journey Time</span>
                </td>
                {stations.map((st) => (
                  <td key={st.station_id} className="py-3 px-3 text-center font-black text-slate-900 text-sm">
                    {formatTime(st.optimization.total_journey_time_min)}
                  </td>
                ))}
              </tr>

              {/* Total Distance */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-600 flex items-center space-x-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Total Drive Distance</span>
                </td>
                {stations.map((st) => (
                  <td key={st.station_id} className="py-3 px-3 text-center font-medium">
                    {formatDistance(st.optimization.total_drive_distance_km)}
                  </td>
                ))}
              </tr>

              {/* Total Drive Time */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-600">Drive Time</td>
                {stations.map((st) => (
                  <td key={st.station_id} className="py-3 px-3 text-center font-medium">
                    {formatTime(st.optimization.total_drive_time_min)}
                  </td>
                ))}
              </tr>

              {/* Waiting Time */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-600">Waiting Time</td>
                {stations.map((st) => (
                  <td key={st.station_id} className="py-3 px-3 text-center font-medium text-amber-700">
                    {formatTime(st.waiting_time_min)}
                  </td>
                ))}
              </tr>

              {/* Charger Power */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-600 flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Charger Power</span>
                </td>
                {stations.map((st) => (
                  <td key={st.station_id} className="py-3 px-3 text-center font-bold text-slate-900">
                    {formatPower(st.charging.charger_power_kw)}
                  </td>
                ))}
              </tr>

              {/* Charging Time */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-600">Charging Time</td>
                {stations.map((st) => (
                  <td key={st.station_id} className="py-3 px-3 text-center font-medium">
                    {formatTime(st.charging.charging_time_min)}
                  </td>
                ))}
              </tr>

              {/* Charging Cost */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-600 flex items-center space-x-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Estimated Cost</span>
                </td>
                {stations.map((st) => (
                  <td key={st.station_id} className="py-3 px-3 text-center font-bold text-emerald-700 text-sm">
                    {formatCost(st.charging_cost)}
                  </td>
                ))}
              </tr>

              {/* Energy Needed */}
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-600">Energy to Charge</td>
                {stations.map((st) => (
                  <td key={st.station_id} className="py-3 px-3 text-center font-medium">
                    {st.energy.charging_energy_kwh?.toFixed(1) ?? 'N/A'} kWh
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
