import { z } from 'zod';

export const LocationSchema = z.object({
  latitude: z
    .number({ invalid_type_error: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number({ invalid_type_error: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  address: z.string().optional(),
});

export const JourneyFormSchema = z.object({
  current_location: LocationSchema,
  destination: LocationSchema,
  vehicle_id: z.string().min(1, 'Please select a vehicle model'),
  battery_capacity_kwh: z
    .number({ invalid_type_error: 'Battery capacity is required' })
    .positive('Battery capacity must be greater than 0'),
  energy_consumption_kwh_per_km: z
    .number({ invalid_type_error: 'Energy consumption is required' })
    .positive('Energy consumption must be greater than 0'),
  current_soc: z
    .number({ invalid_type_error: 'Current SOC is required' })
    .min(0, 'Current SOC cannot be less than 0%')
    .max(100, 'Current SOC cannot exceed 100%'),
  target_destination_soc: z
    .number({ invalid_type_error: 'Desired destination SOC is required' })
    .min(0, 'Desired SOC cannot be less than 0%')
    .max(100, 'Desired SOC cannot exceed 100%'),
});

export type JourneyFormData = z.infer<typeof JourneyFormSchema>;
