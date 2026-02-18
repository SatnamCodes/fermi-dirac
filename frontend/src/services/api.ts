/**
 * API Service for Fermi-Dirac Distribution Backend
 * 
 * Handles all HTTP requests to the FastAPI backend with proper
 * error handling and TypeScript types.
 */

import type {
  FermiDiracRequest,
  FermiDiracResponse,
  MultiTemperatureRequest,
  MultiTemperatureResponse,
  SurfaceRequest,
  SurfaceResponse,
  PhysicsInfo
} from '../types/api';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper for API requests
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Compute Fermi-Dirac distribution for a single temperature
 */
export async function computeFermiDirac(
  params: FermiDiracRequest
): Promise<FermiDiracResponse> {
  return fetchAPI<FermiDiracResponse>('/fermi-dirac', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Compute Fermi-Dirac distribution for multiple temperatures
 */
export async function computeMultiTemperature(
  params: MultiTemperatureRequest
): Promise<MultiTemperatureResponse> {
  return fetchAPI<MultiTemperatureResponse>('/multi-temperature', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get T=0 Heaviside step function
 */
export async function getZeroTemperature(
  mu: number = 0.5,
  energyMin: number = -1,
  energyMax: number = 2,
  points: number = 500
): Promise<FermiDiracResponse> {
  const params = new URLSearchParams({
    mu: mu.toString(),
    energy_min: energyMin.toString(),
    energy_max: energyMax.toString(),
    points: points.toString(),
  });
  
  return fetchAPI<FermiDiracResponse>(`/zero-temperature?${params}`);
}

/**
 * Compute 2D surface for heatmap
 */
export async function computeSurface(
  params: SurfaceRequest
): Promise<SurfaceResponse> {
  return fetchAPI<SurfaceResponse>('/surface', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get physics information and constants
 */
export async function getPhysicsInfo(): Promise<PhysicsInfo> {
  return fetchAPI<PhysicsInfo>('/physics-info');
}

/**
 * Export data as CSV
 */
export async function exportCSV(
  temperature: number,
  mu: number,
  energyMin: number,
  energyMax: number,
  points: number
): Promise<{ csv: string; filename: string }> {
  const params = new URLSearchParams({
    temperature: temperature.toString(),
    mu: mu.toString(),
    energy_min: energyMin.toString(),
    energy_max: energyMax.toString(),
    points: points.toString(),
  });
  
  return fetchAPI(`/export/csv?${params}`);
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    await fetchAPI('/');
    return true;
  } catch {
    return false;
  }
}
