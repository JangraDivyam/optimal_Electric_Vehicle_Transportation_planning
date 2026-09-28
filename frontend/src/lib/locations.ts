import { Location, LocationPreset } from './types';

export const POPULAR_LOCATIONS: LocationPreset[] = [
  {
    id: 'connaught-place',
    name: 'Connaught Place, Central Delhi',
    description: 'Rajiv Chowk, New Delhi',
    location: { latitude: 28.6315, longitude: 77.2167 },
  },
  {
    id: 'india-gate',
    name: 'India Gate, New Delhi',
    description: 'Kartavya Path, New Delhi',
    location: { latitude: 28.6129, longitude: 77.2295 },
  },
  {
    id: 'noida-sector-62',
    name: 'Sector 62, Noida',
    description: 'Electronic City, Gautam Buddha Nagar',
    location: { latitude: 28.6258, longitude: 77.3653 },
  },
  {
    id: 'cyber-hub-gurugram',
    name: 'DLF Cyber Hub, Gurugram',
    description: 'Cyber City, Phase 2, Gurugram',
    location: { latitude: 28.4952, longitude: 77.0894 },
  },
  {
    id: 'aerocity-delhi',
    name: 'Aerocity, IGI Airport',
    description: 'Hospitality District, New Delhi',
    location: { latitude: 28.5494, longitude: 77.1212 },
  },
  {
    id: 'dwarka-sec-21',
    name: 'Dwarka Sector 21, Delhi',
    description: 'South West Delhi Hub',
    location: { latitude: 28.5524, longitude: 77.0581 },
  },
  {
    id: 'faridabad-bata-chowk',
    name: 'Bata Chowk, Faridabad',
    description: 'Faridabad Central, Haryana',
    location: { latitude: 28.3846, longitude: 77.3168 },
  },
  {
    id: 'noida-sector-18',
    name: 'Sector 18 (Atta Market), Noida',
    description: 'Commercial Center, Noida',
    location: { latitude: 28.5708, longitude: 77.3260 },
  },
  {
    id: 'south-extension',
    name: 'South Extension, New Delhi',
    description: 'Ring Road, South Delhi',
    location: { latitude: 28.5684, longitude: 77.2215 },
  },
];

export const DEFAULT_ORIGIN: LocationPreset = {
  id: 'delhi-origin',
  name: 'Central Secretariat, New Delhi',
  description: 'Rajpath Area, New Delhi',
  location: { latitude: 28.6139, longitude: 77.2090 },
};

export const DEFAULT_DESTINATION: LocationPreset = {
  id: 'noida-destination',
  name: 'Noida City Centre, Sector 39',
  description: 'Gautam Buddha Nagar, UP',
  location: { latitude: 28.5355, longitude: 77.3910 },
};

export function searchPresetLocations(query: string): LocationPreset[] {
  if (!query || query.trim() === '') return POPULAR_LOCATIONS;
  const q = query.toLowerCase().trim();
  return POPULAR_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      loc.description.toLowerCase().includes(q)
  );
}
