'use client';

import React, { useState } from 'react';
import { ChevronDown, Code2 } from 'lucide-react';
import { StationRecommendation } from '@/lib/types';

interface TechnicalDetailsProps {
  station: StationRecommendation;
  candidateCount?: number;
  feasibleCount?: number;
}

export const TechnicalDetails: React.FC<TechnicalDetailsProps> = ({
  station,
  candidateCount,
  feasibleCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { optimization } = station;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden text-xs bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center space-x-1.5 font-medium text-slate-700">
          <Code2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Technical & Optimization Metrics (Backend Raw Scores)</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2.5 font-mono">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[10px]">H3 Candidates</span>
              <span className="font-semibold text-slate-800">{candidateCount ?? 'N/A'}</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Feasible Count</span>
              <span className="font-semibold text-emerald-700">{feasibleCount ?? 'N/A'}</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Backend Rank</span>
              <span className="font-semibold text-blue-700">#{optimization.rank}</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Overall Score</span>
              <span className="font-semibold text-slate-900">{optimization.overall_score.toFixed(4)}</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-600 block mb-1 font-sans">
              Normalized Weights & Metrics:
            </span>
            <div className="bg-slate-900 text-slate-200 p-2 rounded text-[10px] overflow-x-auto">
              <pre>{JSON.stringify(optimization.normalized_metrics, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
