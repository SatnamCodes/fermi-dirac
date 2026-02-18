/**
 * EducationalPanel Component
 * 
 * Collapsible panel explaining the physics of the Fermi-Dirac distribution.
 * Provides context for students and researchers about quantum statistics
 * and their applications.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Atom, Thermometer, Sparkles, Globe } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const EducationalPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('thermal');

  const sections: Section[] = [
    {
      id: 'thermal',
      title: 'Thermal Smearing',
      icon: <Thermometer className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <p>
            At absolute zero (T = 0 K), the Fermi-Dirac distribution is a perfect 
            <strong className="text-neon-cyan"> step function</strong>: all states below the Fermi 
            energy μ are completely occupied (f = 1), and all states above are empty (f = 0).
          </p>
          <p>
            As temperature increases, thermal energy <code>k<sub>B</sub>T</code> allows electrons 
            to transition to higher energy states. This creates a 
            <strong className="text-neon-amber"> smooth transition</strong> around E = μ with a 
            characteristic width of approximately 4k<sub>B</sub>T.
          </p>
          <div className="bg-midnight-700/50 rounded-lg p-3 font-mono text-sm">
            <div className="text-gray-400">Thermal width:</div>
            <div className="text-neon-cyan">ΔE ≈ 4k<sub>B</sub>T</div>
            <div className="text-gray-500 text-xs mt-1">
              At T = 300 K: ΔE ≈ 0.103 eV
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'mu',
      title: 'Chemical Potential',
      icon: <Atom className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <p>
            The <strong className="text-neon-violet">chemical potential μ</strong> is the energy 
            at which the occupation probability equals exactly 0.5. It represents the energy 
            required to add one particle to the system.
          </p>
          <p>
            At T = 0 K, μ equals the <strong>Fermi energy E<sub>F</sub></strong>—the highest 
            occupied energy level. As temperature increases, μ typically decreases for metals 
            due to the asymmetry of the density of states.
          </p>
          <div className="bg-midnight-700/50 rounded-lg p-3 font-mono text-sm">
            <div className="text-gray-400">Key relationship:</div>
            <div className="text-neon-violet">f(μ, T) = 0.5</div>
            <div className="text-gray-500 text-xs mt-1">
              for all temperatures T &gt; 0
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'pauli',
      title: 'Pauli Exclusion',
      icon: <Sparkles className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <p>
            The Fermi-Dirac distribution arises from the 
            <strong className="text-neon-rose"> Pauli exclusion principle</strong>: no two 
            identical fermions (particles with half-integer spin) can occupy the same 
            quantum state simultaneously.
          </p>
          <p>
            This quantum mechanical constraint is why the occupation probability 
            <strong> cannot exceed 1</strong>. Fermions include electrons, protons, neutrons, 
            and quarks—the building blocks of ordinary matter.
          </p>
          <div className="bg-midnight-700/50 rounded-lg p-3">
            <div className="text-gray-400 text-sm mb-2">Contrast with bosons:</div>
            <div className="flex gap-4 text-sm">
              <div>
                <div className="text-neon-cyan font-medium">Fermions (F-D)</div>
                <div className="text-gray-500">f ≤ 1</div>
              </div>
              <div>
                <div className="text-neon-emerald font-medium">Bosons (B-E)</div>
                <div className="text-gray-500">f can be &gt; 1</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'applications',
      title: 'Applications',
      icon: <Globe className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          <p>
            Fermi-Dirac statistics are essential for understanding systems where quantum 
            effects dominate electron behavior:
          </p>
          <div className="grid gap-2">
            <div className="bg-midnight-700/50 rounded-lg p-3">
              <div className="text-neon-cyan font-medium text-sm">Metals</div>
              <p className="text-gray-400 text-xs mt-1">
                Electronic specific heat, electrical conductivity, thermoelectric effects. 
                Electrons in metals are highly degenerate (T &lt;&lt; T<sub>F</sub>).
              </p>
            </div>
            <div className="bg-midnight-700/50 rounded-lg p-3">
              <div className="text-neon-violet font-medium text-sm">Semiconductors</div>
              <p className="text-gray-400 text-xs mt-1">
                Band structure, carrier concentrations, doping effects. The position of μ 
                relative to band gaps determines conduction.
              </p>
            </div>
            <div className="bg-midnight-700/50 rounded-lg p-3">
              <div className="text-neon-amber font-medium text-sm">Astrophysics</div>
              <p className="text-gray-400 text-xs mt-1">
                White dwarf stars (electron degeneracy pressure), neutron stars 
                (neutron degeneracy), stellar cores.
              </p>
            </div>
            <div className="bg-midnight-700/50 rounded-lg p-3">
              <div className="text-neon-emerald font-medium text-sm">Nuclear Physics</div>
              <p className="text-gray-400 text-xs mt-1">
                Nuclear shell model, heavy-ion collisions, quark-gluon plasma.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="glass-panel overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-neon-cyan" />
          <span className="font-semibold text-white">Physics Background</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-t border-white/10 animate-in">
          {/* Section tabs */}
          <div className="flex border-b border-white/10 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'text-neon-cyan border-b-2 border-neon-cyan bg-white/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {section.icon}
                {section.title}
              </button>
            ))}
          </div>

          {/* Section content */}
          <div className="p-5 edu-panel">
            {sections.find(s => s.id === activeSection)?.content}
          </div>

          {/* Formula reference */}
          <div className="px-5 pb-5">
            <div className="bg-midnight-700/50 rounded-lg p-4 text-center">
              <div className="text-gray-400 text-xs mb-2">The Fermi–Dirac Distribution</div>
              <div className="text-xl font-mono text-white">
                f(E, T) = <span className="text-neon-cyan">1</span> / (e<sup className="text-neon-amber">(E−μ)/k<sub>B</sub>T</sup> + <span className="text-neon-cyan">1</span>)
              </div>
              <div className="text-gray-500 text-xs mt-3 space-x-4">
                <span>E: energy</span>
                <span>T: temperature</span>
                <span>μ: chemical potential</span>
                <span>k<sub>B</sub>: Boltzmann constant</span>
              </div>
            </div>
          </div>

          {/* Regimes summary */}
          <div className="px-5 pb-5">
            <div className="text-sm font-medium text-gray-300 mb-3">Physical Regimes</div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-3">
                <div className="text-neon-cyan font-medium">Degenerate</div>
                <div className="text-gray-400 mt-1">T &lt;&lt; T<sub>F</sub></div>
                <div className="text-gray-500 mt-1">Quantum regime</div>
              </div>
              <div className="bg-neon-violet/10 border border-neon-violet/30 rounded-lg p-3">
                <div className="text-neon-violet font-medium">Intermediate</div>
                <div className="text-gray-400 mt-1">T ~ T<sub>F</sub></div>
                <div className="text-gray-500 mt-1">Mixed statistics</div>
              </div>
              <div className="bg-neon-amber/10 border border-neon-amber/30 rounded-lg p-3">
                <div className="text-neon-amber font-medium">Classical</div>
                <div className="text-gray-400 mt-1">T &gt;&gt; T<sub>F</sub></div>
                <div className="text-gray-500 mt-1">Maxwell-Boltzmann</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationalPanel;
