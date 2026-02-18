/**
 * ControlPanel Component
 * 
 * Glassmorphism-styled control panel for adjusting simulation parameters.
 * Features logarithmic temperature slider, chemical potential control,
 * and mode toggles.
 */

import React from 'react';
import { Thermometer, Atom, Settings, BarChart3, Beaker } from 'lucide-react';
import type { SimulationSettings } from '../types/api';

interface ControlPanelProps {
  settings: SimulationSettings;
  onSettingsChange: (settings: Partial<SimulationSettings>) => void;
  onExportCSV: () => void;
  isLoading?: boolean;
}

// Logarithmic slider helper functions
const logToLinear = (value: number, min: number, max: number): number => {
  const minLog = Math.log10(Math.max(min, 0.1));
  const maxLog = Math.log10(max);
  return (Math.log10(Math.max(value, 0.1)) - minLog) / (maxLog - minLog) * 100;
};

const linearToLog = (percent: number, min: number, max: number): number => {
  const minLog = Math.log10(Math.max(min, 0.1));
  const maxLog = Math.log10(max);
  const value = Math.pow(10, minLog + (percent / 100) * (maxLog - minLog));
  return Math.round(value);
};

// Preset temperatures
const TEMP_PRESETS = [
  { label: '0 K', value: 0, description: 'Absolute zero (step function)' },
  { label: '77 K', value: 77, description: 'Liquid nitrogen' },
  { label: '300 K', value: 300, description: 'Room temperature' },
  { label: '1000 K', value: 1000, description: 'Hot' },
  { label: '5000 K', value: 5000, description: 'Solar surface' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
  onExportCSV,
  isLoading = false,
}) => {
  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    const temp = percent === 0 ? 0 : linearToLog(percent, 1, 10000);
    
    // Update temperatures array with this single value for main slider
    const newTemps = settings.temperatures.length > 0 
      ? [temp, ...settings.temperatures.slice(1)]
      : [temp];
    onSettingsChange({ temperatures: newTemps });
  };

  const handleMuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ mu: parseFloat(e.target.value) });
  };

  const handleEnergyMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ energyMin: parseFloat(e.target.value) });
  };

  const handleEnergyMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ energyMax: parseFloat(e.target.value) });
  };

  const toggleZeroTemp = () => {
    onSettingsChange({ showZeroTemp: !settings.showZeroTemp });
  };

  const toggleMaxwellBoltzmann = () => {
    onSettingsChange({ showMaxwellBoltzmann: !settings.showMaxwellBoltzmann });
  };

  const setMode = (mode: 'conceptual' | 'research') => {
    onSettingsChange({ activeMode: mode });
  };

  const applyPreset = (temp: number) => {
    const newTemps = [temp, ...settings.temperatures.slice(1)];
    onSettingsChange({ temperatures: newTemps });
  };

  const currentTemp = settings.temperatures[0] || 300;
  const tempPercent = currentTemp === 0 ? 0 : logToLinear(currentTemp, 1, 10000);

  return (
    <div className="glass-panel p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <Settings className="w-5 h-5 text-neon-cyan" />
        <h2 className="text-lg font-semibold text-white">Parameters</h2>
        {isLoading && (
          <div className="ml-auto">
            <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400 font-medium">Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('conceptual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              settings.activeMode === 'conceptual'
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                : 'bg-midnight-600 text-gray-400 border border-transparent hover:bg-midnight-500'
            }`}
          >
            <Beaker className="w-4 h-4" />
            Conceptual
          </button>
          <button
            onClick={() => setMode('research')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              settings.activeMode === 'research'
                ? 'bg-neon-violet/20 text-neon-violet border border-neon-violet/50'
                : 'bg-midnight-600 text-gray-400 border border-transparent hover:bg-midnight-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Research
          </button>
        </div>
      </div>

      {/* Temperature Control */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-neon-amber" />
          <label className="text-sm text-gray-400 font-medium">Temperature</label>
          <span className="ml-auto text-neon-amber font-mono text-sm">
            {currentTemp === 0 ? '0' : currentTemp.toLocaleString()} K
          </span>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          step="0.5"
          value={tempPercent}
          onChange={handleTemperatureChange}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs text-gray-500 font-mono px-0.5">
          <span className="min-w-0">0 K</span>
          <span className="min-w-0 text-center">10 K</span>
          <span className="min-w-0 text-center">100 K</span>
          <span className="min-w-0 text-center">1000 K</span>
          <span className="min-w-0 text-right">10000 K</span>
        </div>

        {/* Temperature Presets */}
        <div className="flex flex-wrap gap-2 pt-2">
          {TEMP_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => applyPreset(preset.value)}
              title={preset.description}
              className={`px-3 py-1 text-xs rounded-full font-mono transition-all ${
                currentTemp === preset.value
                  ? 'bg-neon-amber/20 text-neon-amber border border-neon-amber/50'
                  : 'bg-midnight-600 text-gray-400 hover:bg-midnight-500 border border-transparent'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chemical Potential */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Atom className="w-4 h-4 text-neon-violet" />
          <label className="text-sm text-gray-400 font-medium">Chemical Potential (μ)</label>
          <span className="ml-auto text-neon-violet font-mono text-sm">
            {settings.mu.toFixed(2)} eV
          </span>
        </div>
        
        <input
          type="range"
          min="-2"
          max="3"
          step="0.01"
          value={settings.mu}
          onChange={handleMuChange}
          className="w-full"
          style={{ 
            accentColor: '#a855f7',
          }}
        />
        
        <div className="flex justify-between text-xs text-gray-500 font-mono">
          <span>-2 eV</span>
          <span>0</span>
          <span>3 eV</span>
        </div>
      </div>

      {/* Energy Range */}
      <div className="space-y-3">
        <label className="text-sm text-gray-400 font-medium">Energy Range</label>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">E_min (eV)</label>
            <input
              type="number"
              min="-10"
              max={settings.energyMax - 0.1}
              step="0.1"
              value={settings.energyMin}
              onChange={handleEnergyMinChange}
              className="w-full bg-midnight-600 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-neon-cyan/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">E_max (eV)</label>
            <input
              type="number"
              min={settings.energyMin + 0.1}
              max="10"
              step="0.1"
              value={settings.energyMax}
              onChange={handleEnergyMaxChange}
              className="w-full bg-midnight-600 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-neon-cyan/50"
            />
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2">
        <label className="text-sm text-gray-400 font-medium">Display Options</label>
        
        {/* T = 0 Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Show T → 0 K limit</span>
          <button
            onClick={toggleZeroTemp}
            className="relative inline-flex items-center w-10 h-5 flex-shrink-0"
          >
            <div className={`toggle-track ${settings.showZeroTemp ? 'active' : ''}`} />
            <div className={`toggle-thumb ${settings.showZeroTemp ? 'active' : ''}`} />
          </button>
        </div>

        {/* Maxwell-Boltzmann Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Maxwell–Boltzmann comparison</span>
          <button
            onClick={toggleMaxwellBoltzmann}
            className="relative inline-flex items-center w-10 h-5 flex-shrink-0"
          >
            <div className={`toggle-track ${settings.showMaxwellBoltzmann ? 'active' : ''}`} />
            <div className={`toggle-thumb ${settings.showMaxwellBoltzmann ? 'active' : ''}`} />
          </button>
        </div>
      </div>

      {/* Research Mode: Export */}
      {settings.activeMode === 'research' && (
        <div className="pt-3 border-t border-white/10">
          <button
            onClick={onExportCSV}
            className="w-full py-2 px-4 bg-neon-violet/20 text-neon-violet border border-neon-violet/50 rounded-lg text-sm font-medium hover:bg-neon-violet/30 transition-colors"
          >
            Export Data (CSV)
          </button>
        </div>
      )}

      {/* Equation Display */}
      <div className="pt-3 border-t border-white/10">
        <div className="text-center text-gray-400 text-xs font-mono bg-midnight-700/50 rounded-lg p-3">
          <div className="text-gray-300 mb-1">Fermi–Dirac Distribution</div>
          <div className="text-neon-cyan">
            f(E) = 1 / (e<sup>(E−μ)/k<sub>B</sub>T</sup> + 1)
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
