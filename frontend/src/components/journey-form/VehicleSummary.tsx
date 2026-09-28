'use client';

import React from 'react';
import { Battery, Zap, BatteryMedium, Target } from 'lucide-react';
import { Vehicle } from '@/lib/types';
import { formatEnergy } from '@/lib/formatters';

interface VehicleSummaryProps {
  vehicle: Vehicle;
  batteryCapacityKwh: number;
  efficiencyKwhPerKm: number;
  currentSoc: number;
  targetDestinationSoc: number;
}

export const VehicleSummary: React.FC<VehicleSummaryProps> = ({
  vehicle,
  batteryCapacityKwh,
  efficiencyKwhPerKm,
  currentSoc,
  targetDestinationSoc,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 block">
            Journey Parameters Summary
          </span>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight mt-0.5">
            {vehicle.manufacturer} {vehicle.model}
          </h4>
        </div>
        <span className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
          {vehicle.category || 'Electric Vehicle'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        <div className="pt-1.5 sm:pt-0 sm:px-2 first:px-0">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] mb-0.5">
            <Battery className="w-3.5 h-3.5 text-emerald-600" />
            <span>Battery Capacity</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {formatEnergy(batteryCapacityKwh)}
          </div>
        </div>

        <div className="pt-1.5 sm:pt-0 sm:px-2">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] mb-0.5">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Consumption</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {efficiencyKwhPerKm} kWh/km
          </div>
        </div>

        <div className="pt-1.5 sm:pt-0 sm:px-2">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] mb-0.5">
            <BatteryMedium className="w-3.5 h-3.5 text-amber-600" />
            <span>Current SOC</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {currentSoc}%
          </div>
        </div>

        <div className="pt-1.5 sm:pt-0 sm:px-2">
          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] mb-0.5">
            <Target className="w-3.5 h-3.5 text-purple-600" />
            <span>Target SOC</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {targetDestinationSoc}%
          </div>
        </div>
      </div>
    </div>
  );
};
