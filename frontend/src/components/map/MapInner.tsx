'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Location, StationRecommendation } from '@/lib/types';
import {
  formatDistance,
  formatTime,
  formatPower,
  formatCost,
  getStationDisplayName,
  getStationLocationDetails,
} from '@/lib/formatters';

interface MapInnerProps {
  origin: Location;
  destination: Location;
  stations: StationRecommendation[];
  selectedStationId?: string;
  onSelectStation: (stationId: string) => void;
}

// Controller component to auto-fit bounds and center on selected station
function MapController({
  origin,
  destination,
  stations,
  selectedStationId,
}: {
  origin: Location;
  destination: Location;
  stations: StationRecommendation[];
  selectedStationId?: string;
}) {
  const map = useMap();
  const prevSelectedId = useRef<string | undefined>(selectedStationId);

  // Initial bounds fit
  useEffect(() => {
    const points: [number, number][] = [
      [origin.latitude, origin.longitude],
      [destination.latitude, destination.longitude],
      ...stations.map((s) => [s.location.latitude, s.location.longitude] as [number, number]),
    ];

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [origin, destination, stations, map]);

  // Center when station card is clicked
  useEffect(() => {
    if (selectedStationId && selectedStationId !== prevSelectedId.current) {
      const station = stations.find((s) => s.station_id === selectedStationId);
      if (station) {
        map.flyTo([station.location.latitude, station.location.longitude], 14, {
          duration: 0.8,
        });
      }
      prevSelectedId.current = selectedStationId;
    }
  }, [selectedStationId, stations, map]);

  return null;
}

export const MapInner: React.FC<MapInnerProps> = ({
  origin,
  destination,
  stations,
  selectedStationId,
  onSelectStation,
}) => {
  // Origin Custom Icon
  const originIcon = L.divIcon({
    className: 'custom-origin-pin',
    html: `
      <div style="width:34px; height:34px; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; border:2.5px solid #fff; box-shadow:0 4px 10px rgba(37,99,235,0.4);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/>
          <path d="M12 20v2"/>
          <path d="M2 12h2"/>
          <path d="M20 12h2"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });

  // Destination Custom Icon
  const destIcon = L.divIcon({
    className: 'custom-destination-pin',
    html: `
      <div style="width:34px; height:34px; border-radius:50%; background:#dc2626; color:#fff; display:flex; align-items:center; justify-content:center; border:2.5px solid #fff; box-shadow:0 4px 10px rgba(220,38,38,0.4);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });

  // Helper to create Station Rank Pin Icon
  const createStationIcon = (rank: number, isSelected: boolean) => {
    const size = isSelected ? 42 : 36;
    const bg = isSelected ? '#047857' : '#059669';
    const border = isSelected ? '#fef08a' : '#ffffff';
    const borderWidth = isSelected ? '3px' : '2px';
    const shadow = isSelected
      ? '0 0 0 4px rgba(16,185,129,0.4), 0 8px 16px rgba(0,0,0,0.3)'
      : '0 4px 10px rgba(0,0,0,0.2)';

    return L.divIcon({
      className: `custom-station-pin ${isSelected ? 'active' : ''}`,
      html: `
        <div style="width:${size}px; height:${size}px; border-radius:50%; background:${bg}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:${isSelected ? '14px' : '12px'}; border:${borderWidth} solid ${border}; box-shadow:${shadow}; transition:all 0.2s ease;">
          #${rank}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  };

  return (
    <div className="w-full h-full min-h-[400px] lg:min-h-[580px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm relative">
      <MapContainer
        center={[origin.latitude, origin.longitude]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ minHeight: '100%', height: '100%' }}
      >
        <TileLayer
          attribution={
            process.env.NEXT_PUBLIC_CARTO_API_KEY
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
          url={
            process.env.NEXT_PUBLIC_CARTO_API_KEY
              ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`
              : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
          maxZoom={19}
        />

        <MapController
          origin={origin}
          destination={destination}
          stations={stations}
          selectedStationId={selectedStationId}
        />

        {/* Origin Marker */}
        <Marker position={[origin.latitude, origin.longitude]} icon={originIcon}>
          <Popup>
            <div className="p-3">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Journey Starting Point
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Current Location</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">
                {origin.latitude.toFixed(4)}, {origin.longitude.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={[destination.latitude, destination.longitude]} icon={destIcon}>
          <Popup>
            <div className="p-3">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                Journey End Point
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Destination</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">
                {destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Top 10 Station Markers */}
        {stations.map((station) => {
          const isSelected = selectedStationId === station.station_id;
          const icon = createStationIcon(station.optimization.rank, isSelected);
          const displayName = getStationDisplayName(station);
          const locationDetails = getStationLocationDetails(station);

          return (
            <Marker
              key={station.station_id}
              position={[station.location.latitude, station.location.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectStation(station.station_id),
              }}
            >
              <Popup>
                <div className="p-3.5 min-w-[240px] max-w-[280px]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                      Rank #{station.optimization.rank}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {station.station_id}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                    {displayName}
                  </h4>

                  <div className="text-[11px] text-slate-500 mb-2 flex items-start space-x-1">
                    <span>📍</span>
                    <span className="font-medium text-slate-700">{locationDetails.area}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] mb-2.5">
                    <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                      {formatPower(station.charging.charger_power_kw)} Charger
                    </span>
                    {station.charger_type && (
                      <span className="bg-slate-100 text-slate-700 font-medium px-1.5 py-0.5 rounded">
                        {station.charger_type}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2 mb-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Distance</span>
                      <span className="font-semibold text-slate-800">
                        {formatDistance(station.source_to_station.distance_km)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Drive Time</span>
                      <span className="font-semibold text-slate-800">
                        {formatTime(station.source_to_station.travel_time_min)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Waiting</span>
                      <span className="font-semibold text-amber-700">
                        {formatTime(station.waiting_time_min)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Charging Cost</span>
                      <span className="font-semibold text-emerald-700">
                        {formatCost(station.charging_cost)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectStation(station.station_id)}
                    className="w-full py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition"
                  >
                    View in recommendations list
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl p-2.5 shadow-md text-xs space-y-1 z-[400] pointer-events-auto">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block border border-white" />
          <span className="text-slate-700 text-[11px] font-medium">Start Location</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-600 inline-block border border-white" />
          <span className="text-slate-700 text-[11px] font-medium">Destination</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block text-[9px] font-bold text-white text-center leading-[14px]">
            #1
          </span>
          <span className="text-slate-700 text-[11px] font-medium">Recommended Stations</span>
        </div>
      </div>
    </div>
  );
};
