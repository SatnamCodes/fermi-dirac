/**
 * API Types for Fermi-Dirac Distribution Backend
 */

// Request types
export interface FermiDiracRequest {
  temperature: number;
  mu: number;
  energy_min: number;
  energy_max: number;
  points: number;
}

export interface MultiTemperatureRequest {
  temperatures: number[];
  mu: number;
  energy_min: number;
  energy_max: number;
  points: number;
  include_maxwell_boltzmann: boolean;
}

export interface SurfaceRequest {
  mu: number;
  energy_min: number;
  energy_max: number;
  energy_points: number;
  temp_min: number;
  temp_max: number;
  temp_points: number;
  temp_scale: 'linear' | 'log';
}

// Response types
export interface FermiDiracResponse {
  energy: number[];
  occupation: number[];
  temperature: number;
  mu: number;
  thermal_width: number;
}

export interface MultiTemperatureCurve {
  temperature: number;
  occupation: number[];
  maxwell_boltzmann?: number[];
}

export interface MultiTemperatureResponse {
  energy: number[];
  curves: MultiTemperatureCurve[];
  mu: number;
}

export interface SurfaceResponse {
  energy: number[];
  temperatures: number[];
  occupation: number[][];
  mu: number;
}

export interface PhysicsInfo {
  k_B_eV: number;
  k_B_SI: number;
  equation: string;
  regimes: {
    degenerate: { condition: string; description: string; applications: string[] };
    classical: { condition: string; description: string; applications: string[] };
    intermediate: { condition: string; description: string; applications: string[] };
  };
}

// Chart data types
export interface DataPoint {
  energy: number;
  occupation: number;
}

export interface CurveData {
  temperature: number;
  data: DataPoint[];
  color: string;
  maxwellBoltzmann?: DataPoint[];
}

// UI State types
export interface SimulationSettings {
  energyMin: number;
  energyMax: number;
  mu: number;
  points: number;
  temperatures: number[];
  showZeroTemp: boolean;
  showMaxwellBoltzmann: boolean;
  activeMode: 'conceptual' | 'research';
}
