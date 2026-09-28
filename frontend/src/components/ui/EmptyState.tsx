'use client';

import React from 'react';
import { AlertTriangle, ArrowLeft, BatteryMedium, Gauge, Home, MapPin } from 'lucide-react';

interface EmptyStateProps {
  onReset: () => void;
  onHome?: () => void;
  candidateCount?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onReset, onHome, candidateCount }) => {
  return (
    <div className="max-w-xl mx-auto my-10 p-6 sm:p-8 bg-white border border-amber-200 rounded-xl shadow-xs text-center">
      <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center mx-auto mb-4 text-amber-600">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1.5">
        No energy-feasible charging stations found
      </h2>

      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
        We evaluated candidate charging stations along your route, but none allow your vehicle to reach the destination while satisfying your desired destination SOC reserve.
        {candidateCount !== undefined && candidateCount > 0 && (
          <span className="block mt-1 text-slate-500 font-mono text-xs">
            ({candidateCount} candidate stations were evaluated)
          </span>
        )}
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left mb-6 text-xs">
        <p className="font-semibold text-slate-800 mb-2">Recommended adjustments:</p>
        <ul className="space-y-2 text-slate-600">
          <li className="flex items-start space-x-2">
            <BatteryMedium className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>Increase departure SOC</strong>: Start with higher initial battery charge.</span>
          </li>
          <li className="flex items-start space-x-2">
            <Gauge className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <span><strong>Lower target arrival SOC</strong>: Relax your buffer requirement at destination.</span>
          </li>
          <li className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <span><strong>Select an intermediate waystop</strong>: Add a stopover to split longer routes.</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow-2xs space-x-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Adjust Journey Parameters</span>
        </button>
        {onHome && (
          <button
            type="button"
            onClick={onHome}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition space-x-2"
          >
            <Home className="w-3.5 h-3.5 text-slate-500" />
            <span>Start Fresh</span>
          </button>
        )}
      </div>
    </div>
  );
};
