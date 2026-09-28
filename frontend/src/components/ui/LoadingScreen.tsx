'use client';

import React, { useEffect, useState } from 'react';
import { Zap, CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  vehicleModel?: string;
  originName?: string;
  destName?: string;
  onBack?: () => void;
}

const STAGES = [
  { id: 1, label: 'Validating vehicle specifications & battery parameters' },
  { id: 2, label: 'Finding nearby charging candidates with H3 spatial indexing' },
  { id: 3, label: 'Calculating driving routes and detour time' },
  { id: 4, label: 'Simulating energy feasibility & charging requirements' },
  { id: 5, label: 'Optimizing ranking by waiting time, charging speed, and cost' },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  vehicleModel,
  originName,
  destName,
  onBack,
}) => {
  const [currentStage, setCurrentStage] = useState(1);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStage(2), 500);
    const timer2 = setTimeout(() => setCurrentStage(3), 1200);
    const timer3 = setTimeout(() => setCurrentStage(4), 2000);
    const timer4 = setTimeout(() => setCurrentStage(5), 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[460px] p-6 max-w-xl mx-auto">
      {/* Clean Spinner / Brand Indicator */}
      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs mb-5">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 tracking-tight text-center">
        Calculating Recommended Stations
      </h2>
      <p className="text-xs text-slate-500 mt-1 mb-6 text-center max-w-md">
        {originName && destName
          ? `${originName} → ${destName}`
          : 'Analyzing charging station candidates and battery constraints'}
      </p>

      {/* Progress Stages */}
      <div className="w-full space-y-3 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        {STAGES.map((stage) => {
          const isCompleted = currentStage > stage.id;
          const isCurrent = currentStage === stage.id;

          return (
            <div
              key={stage.id}
              className={`flex items-center space-x-3 text-xs transition-colors duration-200 ${
                isCompleted
                  ? 'text-slate-700 font-medium'
                  : isCurrent
                  ? 'text-emerald-700 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
              )}
              <span className="flex-1">{stage.label}</span>
            </div>
          );
        })}
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-6 text-xs text-slate-500 hover:text-slate-800 font-medium transition"
        >
          Cancel and return to form
        </button>
      )}

      <div className="mt-4 text-[11px] text-slate-400 text-center font-mono">
        FastAPI H3 spatial index • Multi-criteria optimization
      </div>
    </div>
  );
};
