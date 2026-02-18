/**
 * Fermi-Dirac Distribution Interactive Simulation
 * 
 * A research-grade visualization tool for exploring quantum statistics
 * of fermions across different temperature regimes.
 * 
 * Features:
 * - Real-time Fermi-Dirac distribution curves
 * - Multi-temperature overlay
 * - Energy-Temperature heatmap
 * - Educational content
 * - Data export capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import FermiDiracChart, { TEMP_COLORS } from './components/FermiDiracChart';
import ControlPanel from './components/ControlPanel';
import Heatmap from './components/Heatmap';
import EducationalPanel from './components/EducationalPanel';
import { computeMultiTemperature, computeSurface, exportCSV, checkHealth } from './services/api';
import type { SimulationSettings, CurveData, MultiTemperatureResponse, SurfaceResponse } from './types/api';

// Default simulation settings
const DEFAULT_SETTINGS: SimulationSettings = {
  energyMin: -1,
  energyMax: 2,
  mu: 0.5,
  points: 500,
  temperatures: [300, 0, 100, 1000, 3000],
  showZeroTemp: true,
  showMaxwellBoltzmann: false,
  activeMode: 'conceptual',
};

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

type ViewMode = 'curves' | 'heatmap';

const App: React.FC = () => {
  // State
  const [settings, setSettings] = useState<SimulationSettings>(DEFAULT_SETTINGS);
  const [curveData, setCurveData] = useState<CurveData[]>([]);
  const [surfaceData, setSurfaceData] = useState<SurfaceResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('curves');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Debounced settings for API calls
  const debouncedSettings = useDebounce(settings, 150);

  // Check API connection on mount
  useEffect(() => {
    checkHealth().then(setApiConnected);
  }, []);

  // Fetch curve data when settings change
  const fetchCurveData = useCallback(async () => {
    if (!apiConnected) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Build temperature list based on settings
      const temps = settings.showZeroTemp 
        ? [...new Set([0, ...settings.temperatures])]
        : settings.temperatures.filter(t => t > 0);

      const response: MultiTemperatureResponse = await computeMultiTemperature({
        temperatures: temps.sort((a, b) => a - b),
        mu: settings.mu,
        energy_min: settings.energyMin,
        energy_max: settings.energyMax,
        points: settings.points,
        include_maxwell_boltzmann: settings.showMaxwellBoltzmann,
      });

      // Transform response to chart data format
      const curves: CurveData[] = response.curves.map((curve, idx) => ({
        temperature: curve.temperature,
        data: response.energy.map((e, i) => ({
          energy: e,
          occupation: curve.occupation[i],
        })),
        color: TEMP_COLORS[idx % TEMP_COLORS.length],
        maxwellBoltzmann: curve.maxwell_boltzmann
          ? response.energy.map((e, i) => ({
              energy: e,
              occupation: curve.maxwell_boltzmann![i],
            }))
          : undefined,
      }));

      setCurveData(curves);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [settings, apiConnected]);

  // Fetch surface data for heatmap
  const fetchSurfaceData = useCallback(async () => {
    if (!apiConnected) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await computeSurface({
        mu: settings.mu,
        energy_min: settings.energyMin,
        energy_max: settings.energyMax,
        energy_points: 200,
        temp_min: 1,
        temp_max: 5000,
        temp_points: 100,
        temp_scale: 'log',
      });

      setSurfaceData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch surface data');
    } finally {
      setIsLoading(false);
    }
  }, [settings.mu, settings.energyMin, settings.energyMax, apiConnected]);

  // Effect to fetch data when debounced settings change
  useEffect(() => {
    if (viewMode === 'curves') {
      fetchCurveData();
    } else {
      fetchSurfaceData();
    }
  }, [debouncedSettings, viewMode, fetchCurveData, fetchSurfaceData]);

  // Handle settings changes
  const handleSettingsChange = useCallback((newSettings: Partial<SimulationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Handle CSV export
  const handleExportCSV = useCallback(async () => {
    try {
      const result = await exportCSV(
        settings.temperatures[0] || 300,
        settings.mu,
        settings.energyMin,
        settings.energyMax,
        settings.points
      );

      // Download CSV
      const blob = new Blob([result.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export CSV');
    }
  }, [settings]);

  // Responsive chart dimensions that track container size
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 700, height: 500 });

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const padding = 48; // p-6 = 24px * 2
      const w = container.clientWidth - padding;
      setChartDimensions({ width: Math.max(300, w), height: 500 });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Retry connection
  const retryConnection = () => {
    setApiConnected(null);
    checkHealth().then(setApiConnected);
  };

  return (
    <div className="min-h-screen bg-midnight-900 p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="w-7 h-7 text-neon-cyan" />
              Fermi–Dirac Distribution
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Interactive quantum statistics visualization
            </p>
          </div>
          
          {/* API Status */}
          <div className="flex items-center gap-3">
            {apiConnected === null && (
              <span className="text-gray-400 text-sm">Connecting...</span>
            )}
            {apiConnected === true && (
              <span className="flex items-center gap-2 text-neon-emerald text-sm">
                <span className="w-2 h-2 bg-neon-emerald rounded-full animate-pulse"></span>
                API Connected
              </span>
            )}
            {apiConnected === false && (
              <button
                onClick={retryConnection}
                className="flex items-center gap-2 text-neon-rose text-sm hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-neon-rose/10 border border-neon-rose/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-neon-rose flex-shrink-0" />
            <span className="text-neon-rose">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Visualization Area */}
          <div className="space-y-6">
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('curves')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'curves'
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                    : 'bg-midnight-700 text-gray-400 hover:bg-midnight-600'
                }`}
              >
                <Activity className="w-4 h-4" />
                Distribution Curves
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'heatmap'
                    ? 'bg-neon-violet/20 text-neon-violet border border-neon-violet/50'
                    : 'bg-midnight-700 text-gray-400 hover:bg-midnight-600'
                }`}
              >
                <Layers className="w-4 h-4" />
                E–T Heatmap
              </button>
            </div>

            {/* Chart Container */}
            <div ref={chartContainerRef} className="glass-panel p-6 overflow-hidden">
              {apiConnected === false ? (
                <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
                  <AlertCircle className="w-12 h-12 mb-4 text-neon-rose/50" />
                  <p className="text-lg mb-2">Backend Not Connected</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Start the FastAPI server to enable the visualization.
                  </p>
                  <code className="bg-midnight-700 px-4 py-2 rounded-lg text-neon-cyan text-sm font-mono">
                    uvicorn main:app --reload --port 8000
                  </code>
                </div>
              ) : viewMode === 'curves' ? (
                <div className="flex justify-center w-full">
                  <FermiDiracChart
                    curves={curveData}
                    mu={settings.mu}
                    width={chartDimensions.width}
                    height={chartDimensions.height}
                    showGrid={true}
                    showLegend={true}
                    showMuLine={true}
                  />
                </div>
              ) : surfaceData ? (
                <div className="flex justify-center w-full">
                  <Heatmap
                    energy={surfaceData.energy}
                    temperatures={surfaceData.temperatures}
                    occupation={surfaceData.occupation}
                    mu={settings.mu}
                    width={chartDimensions.width}
                    height={chartDimensions.height}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[500px]">
                  <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Research Mode Info */}
            {settings.activeMode === 'research' && curveData.length > 0 && (
              <div className="glass-panel p-4">
                <div className="text-sm font-medium text-gray-300 mb-3">Numerical Data</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
                  <div>
                    <div className="text-gray-500">Energy range</div>
                    <div className="text-neon-cyan">
                      [{settings.energyMin}, {settings.energyMax}] eV
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Chemical potential</div>
                    <div className="text-neon-violet">{settings.mu.toFixed(3)} eV</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Data points</div>
                    <div className="text-neon-amber">{settings.points}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Curves</div>
                    <div className="text-neon-emerald">{curveData.length}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Educational Panel */}
            <EducationalPanel />
          </div>

          {/* Control Panel (Sidebar) */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ControlPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onExportCSV={handleExportCSV}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <div className="text-center sm:text-left">
            Fermi–Dirac Distribution Simulator
            <span className="text-gray-600 mx-2">|</span>
            <span className="text-gray-400">k<sub>B</sub> = 8.617333262 × 10⁻⁵ eV/K</span>
          </div>
          <div className="flex items-center gap-4">
            <span>React + D3.js + FastAPI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
