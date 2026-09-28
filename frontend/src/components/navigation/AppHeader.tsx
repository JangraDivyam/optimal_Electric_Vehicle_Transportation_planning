'use client';

import React from 'react';
import { ArrowLeft, Home, Zap } from 'lucide-react';

interface AppHeaderProps {
  isHomePage: boolean;
  onBack: () => void;
  onHome: () => void;
  backendHealth: 'checking' | 'online' | 'offline';
  stationsCount: number | null;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isHomePage,
  onBack,
  onHome,
  backendHealth,
  stationsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Left Side: Brand and Navigation */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          <button
            type="button"
            onClick={onHome}
            className="flex items-center space-x-2.5 text-left focus:outline-none focus:ring-2 focus:ring-slate-400 rounded-md p-0.5 transition"
            title="EV Route Planner - Go to Home"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight block">
                EV Route
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
                Station Planner
              </span>
            </div>
          </button>

          {/* Navigation Controls: Rendered ONLY on non-home pages */}
          {!isHomePage && (
            <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3 sm:pl-6">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                aria-label="Back to previous page"
                title="Go back in history"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={onHome}
                className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                aria-label="Go to Home"
                title="Return to journey planner"
              >
                <Home className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Subtle Service Status */}
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              backendHealth === 'online'
                ? 'bg-emerald-500'
                : backendHealth === 'offline'
                ? 'bg-rose-500'
                : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-medium hidden sm:inline text-slate-500">
            {backendHealth === 'online'
              ? `Service Online (${stationsCount ?? '770'} stations)`
              : backendHealth === 'offline'
              ? 'Backend Offline'
              : 'Connecting...'}
          </span>
        </div>
      </div>
    </header>
  );
};
