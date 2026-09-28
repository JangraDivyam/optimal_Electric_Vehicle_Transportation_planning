'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Battery, BatteryCharging, Car, CheckCircle2, MapPin, SlidersHorizontal } from 'lucide-react';
import { EVRequest } from '@/lib/types';
import { formatEnergy, formatSocPercent } from '@/lib/formatters';

interface JourneySummaryProps {
  request: EVRequest;
  vehicleName: string;
  originName: string;
  destName: string;
  candidateCount: number;
  feasibleCount: number;
  shownCount: number;
  onModifyJourney: () => void;
}

export const JourneySummary: React.FC<JourneySummaryProps> = ({
  request,
  vehicleName,
  originName,
  destName,
  candidateCount,
  feasibleCount,
  shownCount,
  onModifyJourney,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs mb-6">
      {/* Top row: Route and Back/Modify button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Active Journey Route
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{originName}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{destName}</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onModifyJourney}
          className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          title="Return to form to modify parameters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span>Edit Parameters</span>
        </button>
      </div>

      {/* Middle row: Vehicle and Battery Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Car className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">Vehicle</div>
            <div className="font-semibold text-slate-900 truncate max-w-[140px]">{vehicleName}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Battery className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">Battery Capacity</div>
            <div className="font-semibold text-slate-900">{formatEnergy(request.battery_capacity_kwh)}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <BatteryCharging className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">Departure SOC</div>
            <div className="font-semibold text-slate-900">{formatSocPercent(request.current_soc)}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">Destination Target</div>
            <div className="font-semibold text-slate-900">{formatSocPercent(request.target_destination_soc)}</div>
          </div>
        </div>
      </div>

      {/* Bottom row: Feasibility & Recommendations badge */}
      <div className="flex items-center justify-between pt-2.5 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {feasibleCount} feasible stations
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600 font-medium">
            Showing top {shownCount} recommendations
          </span>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
          {candidateCount} candidates evaluated via H3
        </span>
      </div>
    </div>
  );
};
