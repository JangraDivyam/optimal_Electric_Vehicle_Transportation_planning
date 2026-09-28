'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import { EVRequest, RecommendationResponse } from '@/lib/types';
import { getRecommendations, checkHealth, ApiError } from '@/lib/api';
import { AppHeader } from '@/components/navigation/AppHeader';
import { JourneyForm } from '@/components/journey-form/JourneyForm';
import { ResultsPage } from '@/components/results/ResultsPage';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export default function Home() {
  const [currentRequest, setCurrentRequest] = useState<EVRequest | null>(null);
  const [journeyMeta, setJourneyMeta] = useState<{
    vehicleName: string;
    originName: string;
    destName: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | undefined>(undefined);
  const [backendHealth, setBackendHealth] = useState<'checking' | 'online' | 'offline'>('checking');
  const [stationsCount, setStationsCount] = useState<number | null>(null);

  // Check backend health on initial mount
  useEffect(() => {
    checkHealth()
      .then((data) => {
        setBackendHealth('online');
        setStationsCount(data.stations_loaded);
      })
      .catch(() => {
        setBackendHealth('offline');
      });
  }, []);

  const handleResetToForm = useCallback(() => {
    setResults(null);
    setErrorMessage(null);
    setErrorStatus(undefined);
    setIsLoading(false);
  }, []);

  // Listen to browser forward/back buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!event.state || event.state.view !== 'results') {
        handleResetToForm();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleResetToForm]);

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.state?.view === 'results') {
      window.history.back();
    } else {
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.pushState(null, '', window.location.pathname);
      }
      handleResetToForm();
    }
  }, [handleResetToForm]);

  const handleHome = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.pathname);
    }
    handleResetToForm();
  }, [handleResetToForm]);

  const handleFormSubmit = async (
    request: EVRequest,
    meta: { vehicleName: string; originName: string; destName: string }
  ) => {
    setCurrentRequest(request);
    setJourneyMeta(meta);
    setIsLoading(true);
    setErrorMessage(null);
    setErrorStatus(undefined);

    try {
      const response = await getRecommendations(request);
      setResults(response);
      if (typeof window !== 'undefined') {
        window.history.pushState({ view: 'results' }, '', '?view=results');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.userMessage);
        setErrorStatus(err.statusCode);
      } else {
        setErrorMessage('Unable to connect to the recommendation service.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (currentRequest && journeyMeta) {
      handleFormSubmit(currentRequest, journeyMeta);
    }
  };

  const isHomePage = !isLoading && !errorMessage && !results;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navigation Bar with persistent Back / Home controls on subviews */}
      <AppHeader
        isHomePage={isHomePage}
        onBack={handleBack}
        onHome={handleHome}
        backendHealth={backendHealth}
        stationsCount={stationsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Loading State */}
        {isLoading && (
          <LoadingScreen
            vehicleModel={journeyMeta?.vehicleName}
            originName={journeyMeta?.originName}
            destName={journeyMeta?.destName}
            onBack={handleBack}
          />
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <ErrorState
            message={errorMessage}
            statusCode={errorStatus}
            onRetry={handleRetry}
            onBack={handleBack}
            onHome={handleHome}
          />
        )}

        {/* Empty State: feasible_count === 0 */}
        {!isLoading && !errorMessage && results && results.feasible_count === 0 && (
          <EmptyState
            candidateCount={results.candidate_count}
            onReset={handleBack}
            onHome={handleHome}
          />
        )}

        {/* Results Page */}
        {!isLoading &&
          !errorMessage &&
          results &&
          results.feasible_count > 0 &&
          currentRequest &&
          journeyMeta && (
            <ResultsPage
              request={currentRequest}
              response={results}
              vehicleName={journeyMeta.vehicleName}
              originName={journeyMeta.originName}
              destName={journeyMeta.destName}
              onModifyJourney={handleBack}
              onHome={handleHome}
            />
          )}

        {/* Form View (Initial / Planning) */}
        {!isLoading && !errorMessage && !results && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-8 shadow-xs">
              <JourneyForm onSubmit={handleFormSubmit} isLoading={isLoading} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            EV Route & Charging Station Recommendation Engine • Powered by FastAPI & H3 Spatial Indexing
          </div>
          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict Client-Server Architecture: Zero recommendation math on client</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
