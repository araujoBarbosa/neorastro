import { Vehicle, VehicleStatus } from './types';

export const APP_NAME = "NeoRastro";

// Generating some mock history data for charts
const generateHistory = (baseSpeed: number) => {
  return Array.from({ length: 10 }, (_, i) => ({
    lat: -23.5505 + (Math.random() * 0.01),
    lng: -46.6333 + (Math.random() * 0.01),
    speed: Math.max(0, baseSpeed + (Math.random() * 20 - 10)),
    ignition: baseSpeed > 0,
    voltage: baseSpeed > 0 ? 13.8 : 12.4,
    timestamp: new Date(Date.now() - (9 - i) * 60000).toISOString()
  }));
};

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    name: 'Caminhão 01 - Entrega',
    plate: 'ABC-1234',
    status: VehicleStatus.MOVING,
    model: 'Volvo FH16',
    driver: 'Carlos Silva',
    lastPosition: { 
      lat: -23.5505, 
      lng: -46.6333, 
      speed: 65, 
      ignition: true,
      voltage: 24.5,
      timestamp: new Date().toISOString() 
    },
    history: generateHistory(60)
  },
  {
    id: 'v2',
    name: 'Fiorino SP',
    plate: 'XYZ-9876',
    status: VehicleStatus.IDLE,
    model: 'Fiat Fiorino',
    driver: 'Ana Souza',
    lastPosition: { 
      lat: -23.5615, 
      lng: -46.6550, 
      speed: 0, 
      ignition: true,
      voltage: 13.2,
      timestamp: new Date().toISOString() 
    },
    history: generateHistory(0)
  },
  {
    id: 'v3',
    name: 'Moto Express',
    plate: 'MOTO-555',
    status: VehicleStatus.ONLINE,
    model: 'Honda CG 160',
    driver: 'Roberto Dias',
    lastPosition: { 
      lat: -23.5400, 
      lng: -46.6200, 
      speed: 45, 
      ignition: true,
      voltage: 12.8,
      timestamp: new Date().toISOString() 
    },
    history: generateHistory(40)
  },
  {
    id: 'v4',
    name: 'Van Escolar',
    plate: 'VAN-2024',
    status: VehicleStatus.OFFLINE,
    model: 'Mercedes Sprinter',
    driver: 'Paulo Mendes',
    lastPosition: { 
      lat: -23.5800, 
      lng: -46.6000, 
      speed: 0, 
      ignition: false,
      voltage: 11.9,
      timestamp: new Date(Date.now() - 3600000).toISOString() 
    },
    history: generateHistory(0)
  }
];

export const MAP_CENTER = { lat: -23.5505, lng: -46.6333 }; // Sao Paulo