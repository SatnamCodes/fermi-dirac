/**
 * FermiDiracChart Component
 * 
 * D3.js-based visualization of the Fermi-Dirac distribution
 * with smooth animations, multiple temperature curves, and
 * interactive tooltips.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { CurveData, DataPoint } from '../types/api';

interface FermiDiracChartProps {
  curves: CurveData[];
  mu: number;
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showMuLine?: boolean;
  animationDuration?: number;
}

// Temperature colors - neon palette
const TEMP_COLORS = [
  '#00f5ff', // Cyan (coldest)
  '#3b82f6', // Blue
  '#a855f7', // Violet
  '#f43f5e', // Rose
  '#fbbf24', // Amber (hottest)
  '#10b981', // Emerald
];

export const FermiDiracChart: React.FC<FermiDiracChartProps> = ({
  curves,
  mu,
  width = 800,
  height = 500,
  showGrid = true,
  showLegend = true,
  showMuLine = true,
  animationDuration = 300,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    energy: number;
    occupation: number;
    temperature: number;
  } | null>(null);

  // Chart margins
  const margin = { top: 40, right: 120, bottom: 60, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  useEffect(() => {
    if (!svgRef.current || curves.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Get data bounds
    const allData = curves.flatMap(c => c.data);
    const energyExtent = d3.extent(allData, d => d.energy) as [number, number];
    
    // Scales
    const xScale = d3.scaleLinear()
      .domain(energyExtent)
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 1.05])
      .range([innerHeight, 0]);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradient definitions for glow effects
    const defs = svg.append('defs');
    
    curves.forEach((curve, i) => {
      const gradientId = `glow-gradient-${i}`;
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0)
        .attr('y1', yScale(1))
        .attr('x2', 0)
        .attr('y2', yScale(0));
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', curve.color)
        .attr('stop-opacity', 0.3);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', curve.color)
        .attr('stop-opacity', 0.05);
    });

    // Grid lines
    if (showGrid) {
      // Horizontal grid
      g.append('g')
        .attr('class', 'grid-lines')
        .selectAll('line.h-grid')
        .data(yScale.ticks(10))
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', '#1c1f2e')
        .attr('stroke-width', 0.5);

      // Vertical grid
      g.append('g')
        .attr('class', 'grid-lines')
        .selectAll('line.v-grid')
        .data(xScale.ticks(10))
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#1c1f2e')
        .attr('stroke-width', 0.5);
    }

    // Chemical potential line (E = μ)
    if (showMuLine && mu >= energyExtent[0] && mu <= energyExtent[1]) {
      g.append('line')
        .attr('class', 'mu-line')
        .attr('x1', xScale(mu))
        .attr('x2', xScale(mu))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,4')
        .attr('opacity', 0.7);

      // μ label
      g.append('text')
        .attr('x', xScale(mu))
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fbbf24')
        .attr('font-size', '12px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text('E = μ');
    }

    // f(E) = 0.5 reference line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0.5))
      .attr('y2', yScale(0.5))
      .attr('stroke', '#374151')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.5);

    // Line generator
    const lineGenerator = d3.line<DataPoint>()
      .x(d => xScale(d.energy))
      .y(d => yScale(d.occupation))
      .curve(d3.curveMonotoneX);

    // Area generator for fill under curve
    const areaGenerator = d3.area<DataPoint>()
      .x(d => xScale(d.energy))
      .y0(innerHeight)
      .y1(d => yScale(d.occupation))
      .curve(d3.curveMonotoneX);

    // Draw curves
    curves.forEach((curve, i) => {
      // Glow effect (underneath)
      g.append('path')
        .datum(curve.data)
        .attr('class', 'curve-glow')
        .attr('d', lineGenerator)
        .attr('stroke', curve.color)
        .attr('stroke-width', 8)
        .attr('fill', 'none')
        .attr('opacity', 0.2)
        .style('filter', 'blur(4px)');

      // Area fill
      g.append('path')
        .datum(curve.data)
        .attr('class', 'curve-area')
        .attr('d', areaGenerator)
        .attr('fill', `url(#glow-gradient-${i})`)
        .attr('opacity', 0);

      // Main curve
      const path = g.append('path')
        .datum(curve.data)
        .attr('class', 'curve')
        .attr('d', lineGenerator)
        .attr('stroke', curve.color)
        .attr('stroke-width', 2.5)
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');

      // Animate path drawing
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(animationDuration)
        .delay(i * 100)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);

      // Maxwell-Boltzmann comparison (dashed)
      if (curve.maxwellBoltzmann && curve.maxwellBoltzmann.length > 0) {
        g.append('path')
          .datum(curve.maxwellBoltzmann)
          .attr('class', 'curve-mb')
          .attr('d', lineGenerator)
          .attr('stroke', curve.color)
          .attr('stroke-width', 1.5)
          .attr('fill', 'none')
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.5);
      }
    });

    // X-Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(10)
      .tickSize(-5);
    
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', '#374151'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#374151'))
      .call(g => g.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '11px'));

    // X-Axis label
    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '13px')
      .text('Energy E (eV)');

    // Y-Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(10)
      .tickSize(-5);
    
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .call(g => g.select('.domain').attr('stroke', '#374151'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#374151'))
      .call(g => g.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '11px'));

    // Y-Axis label
    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '13px')
      .text('Occupation f(E)');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '16px')
      .attr('font-weight', '500')
      .text('Fermi–Dirac Distribution');

    // Interactive overlay for tooltips
    const bisect = d3.bisector<DataPoint, number>(d => d.energy).left;
    
    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const energy = xScale.invert(mx);
        
        // Find closest curve point
        if (curves.length > 0) {
          const curve = curves[0];
          const idx = bisect(curve.data, energy);
          const d = curve.data[Math.min(idx, curve.data.length - 1)];
          
          if (d) {
            setTooltipData({
              visible: true,
              x: xScale(d.energy) + margin.left,
              y: yScale(d.occupation) + margin.top,
              energy: d.energy,
              occupation: d.occupation,
              temperature: curve.temperature,
            });
          }
        }
      })
      .on('mouseleave', () => {
        setTooltipData(null);
      });

    // Legend
    if (showLegend && curves.length > 1) {
      const legend = g.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${innerWidth + 15}, 20)`);

      curves.forEach((curve, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);

        legendItem.append('line')
          .attr('x1', 0)
          .attr('x2', 25)
          .attr('y1', 0)
          .attr('y2', 0)
          .attr('stroke', curve.color)
          .attr('stroke-width', 2.5);

        const tempLabel = curve.temperature === 0 
          ? 'T = 0 K' 
          : `T = ${curve.temperature} K`;
        
        legendItem.append('text')
          .attr('x', 32)
          .attr('y', 4)
          .attr('fill', '#9ca3af')
          .attr('font-size', '11px')
          .attr('font-family', 'JetBrains Mono, monospace')
          .text(tempLabel);
      });
    }

  }, [curves, mu, width, height, innerWidth, innerHeight, showGrid, showLegend, showMuLine, animationDuration, margin.left, margin.top]);

  return (
    <div className="chart-container relative w-full" style={{ maxWidth: width }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="bg-midnight-800/30 rounded-lg w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      />
      
      {/* Tooltip */}
      {tooltipData?.visible && (
        <div
          ref={tooltipRef}
          className="tooltip"
          style={{
            left: tooltipData.x,
            top: tooltipData.y,
          }}
        >
          <div className="text-neon-cyan">E = {tooltipData.energy.toFixed(3)} eV</div>
          <div className="text-neon-violet">f(E) = {tooltipData.occupation.toFixed(4)}</div>
          <div className="text-gray-400 text-xs mt-1">T = {tooltipData.temperature} K</div>
        </div>
      )}
    </div>
  );
};

export { TEMP_COLORS };
export default FermiDiracChart;
