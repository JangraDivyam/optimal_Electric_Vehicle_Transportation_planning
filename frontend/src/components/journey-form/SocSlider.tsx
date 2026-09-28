'use client';

import React from 'react';
import { BatteryCharging, Battery, Info, CheckCircle2 } from 'lucide-react';

interface SocSliderProps {
  currentSoc: number;
  targetDestinationSoc: number;
  onCurrentSocChange: (value: number) => void;
  onTargetSocChange: (value: number) => void;
  currentSocError?: string;
  targetSocError?: string;
}

export const SocSlider: React.FC<SocSliderProps> = ({
  currentSoc,
  targetDestinationSoc,
  onCurrentSocChange,
  onTargetSocChange,
  currentSocError,
  targetSocError,
}) => {
  return (
    <div className="space-y-4 bg-slate-50/60 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <BatteryCharging className="w-4 h-4 text-emerald-700" />
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Battery Status & Destination Target
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">State of Charge (SOC)</span>
      </div>

      {/* 1. Current SOC Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="current-soc-slider"
            className="text-xs font-medium text-slate-700 flex items-center space-x-1.5"
          >
            <Battery className="w-3.5 h-3.5 text-slate-500" />
            <span>Current SOC</span>
          </label>
          <div className="flex items-center space-x-1">
            <input
              type="number"
              min="0"
              max="100"
              value={currentSoc}
              onChange={(e) =>
                onCurrentSocChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))
              }
              className="w-14 px-2 py-1 text-right font-mono font-semibold text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              aria-label="Current SOC percentage"
            />
            <span className="text-xs font-medium text-slate-500">%</span>
          </div>
        </div>

        {/* Range input */}
        <div className="pt-0.5">
          <input
            id="current-soc-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={currentSoc}
            onChange={(e) => onCurrentSocChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            aria-label="Current state of charge slider"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0%</span>
            <span>Current departure level</span>
            <span>100%</span>
          </div>
        </div>

        {currentSocError && (
          <p className="text-xs text-rose-600 font-medium">{currentSocError}</p>
        )}
      </div>

      {/* 2. Desired SOC at Destination Slider */}
      <div className="space-y-2 pt-2 border-t border-slate-200/60">
        <div className="flex items-center justify-between">
          <label
            htmlFor="target-soc-slider"
            className="text-xs font-medium text-slate-700 flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Desired SOC at Destination</span>
          </label>
          <div className="flex items-center space-x-1">
            <input
              type="number"
              min="0"
              max="100"
              value={targetDestinationSoc}
              onChange={(e) =>
                onTargetSocChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))
              }
              className="w-14 px-2 py-1 text-right font-mono font-semibold text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              aria-label="Desired SOC at destination percentage"
            />
            <span className="text-xs font-medium text-slate-500">%</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-normal flex items-start space-x-1">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>
            Minimum battery percentage remaining upon arrival at your destination.
          </span>
        </p>

        {/* Range input */}
        <div className="pt-0.5">
          <input
            id="target-soc-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={targetDestinationSoc}
            onChange={(e) => onTargetSocChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            aria-label="Desired SOC at destination slider"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0%</span>
            <span>Arrival reserve</span>
            <span>100%</span>
          </div>
        </div>

        {targetSocError && (
          <p className="text-xs text-rose-600 font-medium">{targetSocError}</p>
        )}
      </div>
    </div>
  );
};
