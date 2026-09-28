'use client';

import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { EVRequest, RecommendationResponse } from '@/lib/types';
import { JourneySummary } from './JourneySummary';
import { StationList } from './StationList';
import { StationComparison } from './StationComparison';
import { ChargingMap } from '../map/ChargingMap';

interface ResultsPageProps {
  request: EVRequest;
  response: RecommendationResponse;
  vehicleName: string;
  originName: string;
  destName: string;
  onModifyJourney: () => void;
  onHome?: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  request,
  response,
  vehicleName,
  originName,
  destName,
  onModifyJourney,
  onHome,
}) => {
  const { recommendations, candidate_count, feasible_count } = response;
  const [selectedStationId, setSelectedStationId] = useState<string>(
    recommendations[0]?.station_id || ''
  );
  const [comparedStationIds, setComparedStationIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Toggle compare selection (up to 3 stations)
  const handleToggleCompare = (stationId: string) => {
    setComparedStationIds((prev) => {
      if (prev.includes(stationId)) {
        return prev.filter((id) => id !== stationId);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 stations at a time.');
        return prev;
      }
      return [...prev, stationId];
    });
  };

  const comparedStations = recommendations.filter((st) =>
    comparedStationIds.includes(st.station_id)
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={onModifyJourney}
            className="inline-flex items-center space-x-1.5 font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Journey Planner</span>
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="font-semibold text-slate-900">Recommended Stations</span>
        </div>

        {onHome && (
          <button
            type="button"
            onClick={onHome}
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>New Journey</span>
          </button>
        )}
      </div>

      {/* Top-Level Journey Summary */}
      <JourneySummary
        request={request}
        vehicleName={vehicleName}
        originName={originName}
        destName={destName}
        candidateCount={candidate_count}
        feasibleCount={feasible_count}
        shownCount={recommendations.length}
        onModifyJourney={onModifyJourney}
      />

      {/* Main Dual-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recommendations List */}
        <div className="lg:col-span-7 order-2 lg:order-1">
          <StationList
            stations={recommendations}
            selectedStationId={selectedStationId}
            comparedStationIds={comparedStationIds}
            onSelectStation={(id) => setSelectedStationId(id)}
            onToggleCompare={handleToggleCompare}
            onOpenCompare={() => setIsCompareModalOpen(true)}
            candidateCount={candidate_count}
            feasibleCount={feasible_count}
          />
        </div>

        {/* Right Column: Interactive Map */}
        <div className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-6">
          <div className="h-[420px] lg:h-[calc(100vh-120px)] min-h-[420px] w-full">
            <ChargingMap
              origin={request.current_location}
              destination={request.destination}
              stations={recommendations}
              selectedStationId={selectedStationId}
              onSelectStation={(id) => setSelectedStationId(id)}
            />
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      {isCompareModalOpen && (
        <StationComparison
          stations={comparedStations}
          onRemoveStation={(id) =>
            setComparedStationIds((prev) => prev.filter((sId) => sId !== id))
          }
          onClearAll={() => {
            setComparedStationIds([]);
            setIsCompareModalOpen(false);
          }}
          onClose={() => setIsCompareModalOpen(false)}
        />
      )}
    </div>
  );
};
