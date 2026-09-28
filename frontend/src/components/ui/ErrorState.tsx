'use client';

import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Home } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  statusCode?: number;
  onRetry: () => void;
  onBack?: () => void;
  onHome?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  statusCode,
  onRetry,
  onBack,
  onHome,
}) => {
  return (
    <div className="max-w-lg mx-auto my-10 p-6 sm:p-8 bg-white border border-rose-200 rounded-xl shadow-xs text-center">
      <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center mx-auto mb-4 text-rose-600">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1.5">
        Service Request Failed
      </h2>

      <p className="text-slate-600 text-xs sm:text-sm mb-4 leading-relaxed">
        {message}
      </p>

      {statusCode ? (
        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px] font-mono mb-6">
          HTTP {statusCode}
        </span>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
        )}
        {onHome && (
          <button
            type="button"
            onClick={onHome}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
};
