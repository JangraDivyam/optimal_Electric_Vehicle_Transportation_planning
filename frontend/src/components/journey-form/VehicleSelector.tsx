'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Car, ChevronDown, Check, Sliders, Battery, Zap } from 'lucide-react';
import { vehicles, getVehicleById } from '@/lib/vehicles';
import { Vehicle } from '@/lib/types';

interface VehicleSelectorProps {
  selectedVehicleId: string;
  batteryCapacityKwh: number;
  efficiencyKwhPerKm: number;
  onVehicleChange: (vehicle: Vehicle) => void;
  onBatteryChange: (capacity: number) => void;
  onEfficiencyChange: (efficiency: number) => void;
  error?: string;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  selectedVehicleId,
  batteryCapacityKwh,
  efficiencyKwhPerKm,
  onVehicleChange,
  onBatteryChange,
  onEfficiencyChange,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedVehicle = getVehicleById(selectedVehicleId) || vehicles[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVehicles = vehicles.filter((v) =>
    `${v.manufacturer} ${v.model}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (vehicle: Vehicle) => {
    onVehicleChange(vehicle);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
          <Car className="w-3.5 h-3.5 text-slate-500" />
          <span>Vehicle Model</span>
        </label>
        <button
          type="button"
          onClick={() => setIsEditingSpecs(!isEditingSpecs)}
          className="text-xs text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center space-x-1"
        >
          <Sliders className="w-3 h-3" />
          <span>{isEditingSpecs ? 'Done editing' : 'Edit vehicle specifications'}</span>
        </button>
      </div>

      {/* Combobox Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full px-3 py-2 bg-white border rounded-lg text-sm transition-colors text-left ${
            error
              ? 'border-rose-400 focus:ring-1 focus:ring-rose-400'
              : 'border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
          }`}
          aria-expanded={isOpen}
          aria-label="Select your vehicle"
        >
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-900">
              {selectedVehicle.manufacturer} {selectedVehicle.model}
            </span>
            {selectedVehicle.category && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                {selectedVehicle.category}
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown with search */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto divide-y divide-slate-100">
            <div className="p-2 sticky top-0 bg-white border-b border-slate-100">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vehicle model..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-emerald-600"
                autoFocus
              />
            </div>
            <div className="py-1">
              {filteredVehicles.map((v) => {
                const isSelected = v.id === selectedVehicle.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelect(v)}
                    className={`w-full px-3 py-2 text-xs hover:bg-slate-50 transition flex items-center justify-between text-left ${
                      isSelected ? 'bg-emerald-50/70 text-emerald-950 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {v.manufacturer} {v.model}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {v.batteryCapacityKwh} kWh • {v.efficiencyKwhPerKm} kWh/km
                        {v.rangeKm ? ` • ~${v.rangeKm} km est. range` : ''}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 ml-2 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      {/* Auto-populated Vehicle Specifications */}
      {isEditingSpecs ? (
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1 text-[11px]">
              Battery Capacity (kWh)
            </label>
            <input
              type="number"
              step="0.1"
              min="5"
              max="200"
              value={batteryCapacityKwh}
              onChange={(e) => onBatteryChange(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1 text-[11px]">
              Consumption (kWh/km)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.05"
              max="1.0"
              value={efficiencyKwhPerKm}
              onChange={(e) => onEfficiencyChange(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-4 text-xs text-slate-600 px-1 py-1">
          <div className="flex items-center space-x-1.5">
            <Battery className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">Capacity:</span>
            <span className="font-semibold text-slate-900">{batteryCapacityKwh} kWh</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">Consumption:</span>
            <span className="font-semibold text-slate-900">{efficiencyKwhPerKm} kWh/km</span>
          </div>
          {selectedVehicle.rangeKm && (
            <>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="hidden sm:flex items-center space-x-1.5 text-slate-500">
                <span>Est. Range:</span>
                <span className="font-medium text-slate-700">~{selectedVehicle.rangeKm} km</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
