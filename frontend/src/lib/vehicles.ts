import { Vehicle } from './types';

export const vehicles: Vehicle[] = [
  {
    id: 'tata-nexon-ev',
    manufacturer: 'Tata',
    model: 'Nexon EV',
    batteryCapacityKwh: 40.5,
    efficiencyKwhPerKm: 0.15,
    rangeKm: 270,
    category: 'SUV',
  },
  {
    id: 'tata-punch-ev',
    manufacturer: 'Tata',
    model: 'Punch EV',
    batteryCapacityKwh: 35.0,
    efficiencyKwhPerKm: 0.13,
    rangeKm: 260,
    category: 'SUV',
  },
  {
    id: 'mg-zs-ev',
    manufacturer: 'MG',
    model: 'ZS EV',
    batteryCapacityKwh: 50.3,
    efficiencyKwhPerKm: 0.17,
    rangeKm: 320,
    category: 'SUV',
  },
  {
    id: 'mg-comet-ev',
    manufacturer: 'MG',
    model: 'Comet EV',
    batteryCapacityKwh: 17.3,
    efficiencyKwhPerKm: 0.10,
    rangeKm: 180,
    category: 'Hatchback',
  },
  {
    id: 'hyundai-ioniq-5',
    manufacturer: 'Hyundai',
    model: 'Ioniq 5',
    batteryCapacityKwh: 72.6,
    efficiencyKwhPerKm: 0.16,
    rangeKm: 450,
    category: 'SUV',
  },
  {
    id: 'hyundai-kona-electric',
    manufacturer: 'Hyundai',
    model: 'Kona Electric',
    batteryCapacityKwh: 39.2,
    efficiencyKwhPerKm: 0.14,
    rangeKm: 280,
    category: 'SUV',
  },
  {
    id: 'mahindra-xuv400',
    manufacturer: 'Mahindra',
    model: 'XUV400',
    batteryCapacityKwh: 39.4,
    efficiencyKwhPerKm: 0.16,
    rangeKm: 250,
    category: 'SUV',
  },
  {
    id: 'mahindra-be-6',
    manufacturer: 'Mahindra',
    model: 'BE 6',
    batteryCapacityKwh: 59.0,
    efficiencyKwhPerKm: 0.15,
    rangeKm: 380,
    category: 'SUV',
  },
  {
    id: 'byd-atto-3',
    manufacturer: 'BYD',
    model: 'Atto 3',
    batteryCapacityKwh: 60.48,
    efficiencyKwhPerKm: 0.16,
    rangeKm: 420,
    category: 'SUV',
  },
  {
    id: 'byd-seal',
    manufacturer: 'BYD',
    model: 'Seal',
    batteryCapacityKwh: 82.56,
    efficiencyKwhPerKm: 0.18,
    rangeKm: 510,
    category: 'Sedan',
  },
  {
    id: 'citroen-ec3',
    manufacturer: 'Citroen',
    model: 'eC3',
    batteryCapacityKwh: 29.2,
    efficiencyKwhPerKm: 0.13,
    rangeKm: 220,
    category: 'Hatchback',
  },
  {
    id: 'kia-ev6',
    manufacturer: 'Kia',
    model: 'EV6',
    batteryCapacityKwh: 77.4,
    efficiencyKwhPerKm: 0.17,
    rangeKm: 480,
    category: 'SUV',
  },
];

export function getVehicleById(id: string): Vehicle | undefined {
  return vehicles.find((v) => v.id === id);
}

export function getDefaultVehicle(): Vehicle {
  return vehicles[0]; // Tata Nexon EV
}
