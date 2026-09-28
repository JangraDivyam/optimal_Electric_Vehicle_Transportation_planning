'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Search, Check, ChevronDown } from 'lucide-react';
import { Location, LocationPreset } from '@/lib/types';
import { POPULAR_LOCATIONS, searchPresetLocations } from '@/lib/locations';

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: Location;
  locationName?: string;
  onChange: (loc: Location, name?: string) => void;
  error?: string;
  showUseMyLocation?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  label,
  placeholder,
  value,
  locationName,
  onChange,
  error,
  showUseMyLocation = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(locationName || '');
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showCustomCoords, setShowCustomCoords] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (locationName) {
      setSearchQuery(locationName);
    }
  }, [locationName]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLocations = searchPresetLocations(searchQuery);

  const handleSelectPreset = (preset: LocationPreset) => {
    onChange(preset.location, preset.name);
    setSearchQuery(preset.name);
    setIsOpen(false);
    setGeoError(null);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const loc: Location = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        };
        const name = 'Current Device Location';
        onChange(loc, name);
        setSearchQuery(name);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission was denied. Please select a preset or enter coordinates.');
        } else {
          setGeoError('Unable to retrieve location. Please select a location manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>{label}</span>
        </label>
        {showUseMyLocation && (
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center space-x-1 transition disabled:opacity-50"
            title="Detect location via browser"
          >
            <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Use my location'}</span>
          </button>
        )}
      </div>

      {/* Input container */}
      <div className="relative">
        <div
          onClick={() => setIsOpen(true)}
          className={`flex items-center w-full px-3 py-2 bg-white border rounded-lg text-sm transition-colors cursor-text ${
            error
              ? 'border-rose-400 focus-within:ring-1 focus-within:ring-rose-400'
              : 'border-slate-300 hover:border-slate-400 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="text-slate-400 hover:text-slate-600 p-0.5 ml-1"
            aria-label="Toggle location options"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
            <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Suggested Locations (Delhi-NCR)</span>
              <button
                type="button"
                onClick={() => {
                  setShowCustomCoords(!showCustomCoords);
                  setIsOpen(false);
                }}
                className="text-emerald-700 hover:underline normal-case font-medium"
              >
                Custom Lat/Lng
              </button>
            </div>

            {filteredLocations.length > 0 ? (
              filteredLocations.map((preset) => {
                const isSelected =
                  Math.abs(preset.location.latitude - value.latitude) < 0.0001 &&
                  Math.abs(preset.location.longitude - value.longitude) < 0.0001;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition flex items-center justify-between ${
                      isSelected ? 'bg-emerald-50/70 text-emerald-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{preset.name}</div>
                      <div className="text-[11px] text-slate-500">{preset.description}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-500">
                No matching preset locations.
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomCoords(true);
                    setIsOpen(false);
                  }}
                  className="block mx-auto mt-1.5 text-emerald-700 font-medium hover:underline"
                >
                  Enter custom coordinates
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Geolocation feedback error */}
      {geoError && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
          {geoError}
        </p>
      )}

      {/* Validation error */}
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      {/* Selected Coordinates Chip & Toggle for Manual Coordinates */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
        <span className="font-mono text-[10px] text-slate-500">
          Lat: {value.latitude.toFixed(4)}, Lng: {value.longitude.toFixed(4)}
        </span>
        <button
          type="button"
          onClick={() => setShowCustomCoords(!showCustomCoords)}
          className="text-slate-500 hover:text-slate-800 text-[11px] underline"
        >
          {showCustomCoords ? 'Hide coordinates' : 'Edit coordinates'}
        </button>
      </div>

      {/* Collapsible custom coordinate inputs */}
      {showCustomCoords && (
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1 text-[11px]">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={value.latitude}
              onChange={(e) => {
                const lat = parseFloat(e.target.value) || 0;
                onChange({ ...value, latitude: lat }, 'Custom Coordinate');
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1 text-[11px]">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={value.longitude}
              onChange={(e) => {
                const lng = parseFloat(e.target.value) || 0;
                onChange({ ...value, longitude: lng }, 'Custom Coordinate');
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};
