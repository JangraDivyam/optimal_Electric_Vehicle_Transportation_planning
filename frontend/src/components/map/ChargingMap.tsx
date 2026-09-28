'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Location, StationRecommendation } from '@/lib/types';
import { Loader2, MapPin } from 'lucide-react';

interface ChargingMapProps {
  origin: Location;
  destination: Location;
  stations: StationRecommendation[];
  selectedStationId?: string;
  onSelectStation: (stationId: string) => void;
}

// Client-only dynamic Leaflet map to prevent SSR window reference error
const MapInner = dynamic(
  () => import('./MapInner').then((mod) => mod.MapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] lg:min-h-[580px] rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
        <MapPin className="w-8 h-8 mb-2 animate-bounce text-emerald-600" />
        <div className="flex items-center space-x-2 text-sm font-medium text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading interactive charging map...</span>
        </div>
      </div>
    ),
  }
);

export const ChargingMap: React.FC<ChargingMapProps> = (props) => {
  return <MapInner {...props} />;
};
