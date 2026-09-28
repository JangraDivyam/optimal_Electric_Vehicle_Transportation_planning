'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2, AlertCircle, Compass } from 'lucide-react';
import { JourneyFormSchema, JourneyFormData } from '@/lib/validation';
import { DEFAULT_ORIGIN, DEFAULT_DESTINATION } from '@/lib/locations';
import { vehicles, getDefaultVehicle, getVehicleById } from '@/lib/vehicles';
import { EVRequest } from '@/lib/types';
import { LocationInput } from './LocationInput';
import { VehicleSelector } from './VehicleSelector';
import { SocSlider } from './SocSlider';
import { VehicleSummary } from './VehicleSummary';

interface JourneyFormProps {
  onSubmit: (request: EVRequest, meta: { vehicleName: string; originName: string; destName: string }) => void;
  isLoading?: boolean;
}

export const JourneyForm: React.FC<JourneyFormProps> = ({ onSubmit, isLoading = false }) => {
  const defaultVehicle = getDefaultVehicle();
  const [originName, setOriginName] = useState(DEFAULT_ORIGIN.name);
  const [destName, setDestName] = useState(DEFAULT_DESTINATION.name);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<JourneyFormData>({
    resolver: zodResolver(JourneyFormSchema),
    mode: 'onChange',
    defaultValues: {
      current_location: DEFAULT_ORIGIN.location,
      destination: DEFAULT_DESTINATION.location,
      vehicle_id: defaultVehicle.id,
      battery_capacity_kwh: defaultVehicle.batteryCapacityKwh,
      energy_consumption_kwh_per_km: defaultVehicle.efficiencyKwhPerKm,
      current_soc: 35,
      target_destination_soc: 80,
    },
  });

  // Validate on mount so pre-populated default values enable the CTA immediately
  React.useEffect(() => {
    trigger();
  }, [trigger]);

  const selectedVehicleId = watch('vehicle_id');
  const batteryCapacity = watch('battery_capacity_kwh');
  const energyConsumption = watch('energy_consumption_kwh_per_km');
  const currentSoc = watch('current_soc');
  const targetSoc = watch('target_destination_soc');

  const selectedVehicle = getVehicleById(selectedVehicleId) || defaultVehicle;

  const isFormReady =
    isValid ||
    (Boolean(watch('current_location')?.latitude) &&
      Boolean(watch('destination')?.latitude) &&
      Boolean(selectedVehicleId) &&
      currentSoc >= 0 &&
      currentSoc <= 100 &&
      targetSoc >= 0 &&
      targetSoc <= 100 &&
      Object.keys(errors).length === 0);

  const handleFormSubmit = (data: JourneyFormData) => {
    // Convert percentage SOC (0-100) to decimal (0.0 - 1.0) expected by backend
    const request: EVRequest = {
      current_location: {
        latitude: Number(data.current_location.latitude),
        longitude: Number(data.current_location.longitude),
      },
      destination: {
        latitude: Number(data.destination.latitude),
        longitude: Number(data.destination.longitude),
      },
      current_soc: Number((data.current_soc / 100).toFixed(4)),
      target_destination_soc: Number((data.target_destination_soc / 100).toFixed(4)),
      battery_capacity_kwh: Number(data.battery_capacity_kwh),
      energy_consumption_kwh_per_km: Number(data.energy_consumption_kwh_per_km),
    };

    onSubmit(request, {
      vehicleName: `${selectedVehicle.manufacturer} ${selectedVehicle.model}`,
      originName: originName || 'Origin',
      destName: destName || 'Destination',
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Title & Subtitle */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
          Route & Charging Recommendation
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Plan Your EV Journey
        </h1>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          Find the best charging stations for your route based on your battery, energy needs, travel time, waiting time, and charging cost.
        </p>
      </div>

      {/* Origin & Destination Inputs */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="current_location"
            control={control}
            render={({ field }) => (
              <LocationInput
                label="Current Location"
                placeholder="Enter starting location"
                value={field.value}
                locationName={originName}
                onChange={(loc, name) => {
                  field.onChange(loc);
                  if (name) setOriginName(name);
                }}
                error={
                  errors.current_location?.latitude?.message ||
                  errors.current_location?.longitude?.message
                }
                showUseMyLocation={true}
              />
            )}
          />

          <Controller
            name="destination"
            control={control}
            render={({ field }) => (
              <LocationInput
                label="Destination"
                placeholder="Enter destination"
                value={field.value}
                locationName={destName}
                onChange={(loc, name) => {
                  field.onChange(loc);
                  if (name) setDestName(name);
                }}
                error={
                  errors.destination?.latitude?.message ||
                  errors.destination?.longitude?.message
                }
              />
            )}
          />
        </div>
      </div>

      {/* Vehicle Selection & Specs */}
      <Controller
        name="vehicle_id"
        control={control}
        render={({ field }) => (
          <VehicleSelector
            selectedVehicleId={field.value}
            batteryCapacityKwh={batteryCapacity}
            efficiencyKwhPerKm={energyConsumption}
            onVehicleChange={(vehicle) => {
              field.onChange(vehicle.id);
              setValue('battery_capacity_kwh', vehicle.batteryCapacityKwh, {
                shouldValidate: true,
              });
              setValue('energy_consumption_kwh_per_km', vehicle.efficiencyKwhPerKm, {
                shouldValidate: true,
              });
            }}
            onBatteryChange={(cap) =>
              setValue('battery_capacity_kwh', cap, { shouldValidate: true })
            }
            onEfficiencyChange={(eff) =>
              setValue('energy_consumption_kwh_per_km', eff, { shouldValidate: true })
            }
            error={errors.vehicle_id?.message}
          />
        )}
      />

      {/* Battery Status (Current SOC & Desired Destination SOC) */}
      <SocSlider
        currentSoc={currentSoc}
        targetDestinationSoc={targetSoc}
        onCurrentSocChange={(val) => setValue('current_soc', val, { shouldValidate: true })}
        onTargetSocChange={(val) =>
          setValue('target_destination_soc', val, { shouldValidate: true })
        }
        currentSocError={errors.current_soc?.message}
        targetSocError={errors.target_destination_soc?.message}
      />

      {/* Vehicle Summary Card */}
      <VehicleSummary
        vehicle={selectedVehicle}
        batteryCapacityKwh={batteryCapacity}
        efficiencyKwhPerKm={energyConsumption}
        currentSoc={currentSoc}
        targetDestinationSoc={targetSoc}
      />

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={!isFormReady || isLoading}
          className={`w-full py-3 px-5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center space-x-2 shadow-xs ${
            isFormReady && !isLoading
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Finding best charging stations...</span>
            </>
          ) : (
            <>
              <span>Find Charging Stations</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {!isFormReady && (
          <p className="text-center text-xs text-slate-500 mt-2 flex items-center justify-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Please provide valid locations, vehicle, and battery parameters to find stations</span>
          </p>
        )}
      </div>
    </form>
  );
};
