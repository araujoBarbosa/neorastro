/**
 * NEO RASTRO UNIFIED DATA CONTRACT
 * Shared definitions between Frontend (React), Backend (FastAPI), and Database (Supabase)
 */

// Enums for strict status control
export enum VehicleStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MOVING = 'moving',
  IDLE = 'idle',
  MAINTENANCE = 'maintenance'
}

export type UserRole = 'ADMIN' | 'CLIENT';
export type PaymentStatus = 'ok' | 'due' | 'overdue';
export type PaymentMethod = 'PIX' | 'STRIPE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  whatsapp?: string;
  createdAt: string;
  // Financial & Access Control
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  isBlocked?: boolean;
  
  // Stripe Integration
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Telemetry Data (GPS + Sensors)
export interface Position {
  id?: string;               // UUID (Optional on input, required from DB)
  vehicleId?: string;        // Foreign Key
  lat: number;              // Decimal degrees
  lng: number;              // Decimal degrees
  speed: number;            // km/h
  course?: number;          // 0-360 degrees
  altitude?: number;        // meters
  satellites?: number;      // count
  ignition: boolean;        // true = ON, false = OFF
  voltage: number;          // Battery voltage (e.g., 12.5)
  timestamp: string;        // ISO 8601 (UTC)
}

// Core Entity
export interface Vehicle {
  id: string;               // UUID
  organizationId?: string;   // Tenant ID (for RLS)
  ownerId?: string;         // Link to User
  name: string;             // Friendly name
  plate: string;            // License plate
  vin?: string;             // Chassis number
  model: string;
  driver: string;
  status: VehicleStatus;
  
  // Relations
  lastPosition: Position;
  history: Position[];      // For charts/replay
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  ARCHITECTURE = 'ARCHITECTURE',
  AI_INSIGHTS = 'AI_INSIGHTS',
  ADMIN_OVERVIEW = 'ADMIN_OVERVIEW', // Visão Global (Mapa + Frota)
  ADMIN_CLIENTS = 'ADMIN_CLIENTS'    // Nova visão: Gestão de Clientes
}

export interface StatMetric {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}