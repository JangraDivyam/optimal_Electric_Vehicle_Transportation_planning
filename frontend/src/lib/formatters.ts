/**
 * Formatters for display metrics
 */

export function formatDistance(km: number | undefined | null): string {
  if (km === undefined || km === null || isNaN(km)) return 'N/A';
  return `${Number(km.toFixed(1))} km`;
}

export function formatTime(minutes: number | undefined | null): string {
  if (minutes === undefined || minutes === null || isNaN(minutes)) return 'N/A';
  const totalMins = Math.round(minutes);
  if (totalMins < 60) {
    return `${totalMins} min`;
  }
  const hours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

export function formatCost(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatEnergy(kwh: number | undefined | null): string {
  if (kwh === undefined || kwh === null || isNaN(kwh)) return 'N/A';
  return `${Number(kwh.toFixed(1))} kWh`;
}

export function formatPower(kw: number | undefined | null): string {
  if (kw === undefined || kw === null || isNaN(kw)) return 'N/A';
  return `${Number(kw.toFixed(1))} kW`;
}

export function formatSocPercent(decimalOrPercent: number | undefined | null): string {
  if (decimalOrPercent === undefined || decimalOrPercent === null || isNaN(decimalOrPercent)) return '0%';
  // If value is between 0 and 1 (inclusive), convert to percentage
  if (decimalOrPercent <= 1 && decimalOrPercent > 0) {
    return `${Math.round(decimalOrPercent * 100)}%`;
  }
  return `${Math.round(decimalOrPercent)}%`;
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

export function getStationDisplayName(station: {
  station_id: string;
  station_name?: string;
  vendor?: string;
}): string {
  if (station.station_name && station.station_name.trim()) {
    return station.station_name;
  }
  const vendor = station.vendor || 'EV Charging Network';
  return `${vendor} Station (${station.station_id})`;
}

export function getStationLocationDetails(station: {
  station_id: string;
  location: { latitude: number; longitude: number };
  city?: string;
  address?: string;
}): {
  city: string;
  area: string;
  formattedCoords: string;
  mapsUrl: string;
} {
  const lat = station.location.latitude;
  const lng = station.location.longitude;
  const city = station.city || (station.address?.split(',')[0]) || 'Delhi NCR';

  let area = `${city} Region`;
  if (lat >= 28.58 && lat <= 28.66 && lng >= 77.18 && lng <= 77.26) {
    area = 'Central Delhi (Rajpath / Connaught Place Area)';
  } else if (lat >= 28.50 && lat <= 28.58 && lng >= 77.15 && lng <= 77.26) {
    area = 'South Delhi (AIIMS / Ring Road Corridor)';
  } else if (lat >= 28.50 && lat <= 28.68 && lng >= 77.28 && lng <= 77.45) {
    area = 'Noida / Greater Noida Expressway Region';
  } else if (lat >= 28.40 && lat <= 28.52 && lng >= 77.00 && lng <= 77.12) {
    area = 'Gurugram / DLF Cyber City Corridor';
  } else if (lat >= 28.35 && lat <= 28.43 && lng >= 77.25 && lng <= 77.35) {
    area = 'Faridabad Metro Corridor';
  }

  const formattedCoords = formatCoordinates(lat, lng);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return {
    city,
    area,
    formattedCoords,
    mapsUrl,
  };
}
