/**
 * Heatmap Component
 * 
 * 2D Energy-Temperature heatmap visualization of the Fermi-Dirac distribution.
 * Uses Canvas for efficient rendering of the occupation probability surface f(E, T).
 * 
 * This is the advanced visualization feature showing how the distribution
 * evolves across both energy and temperature simultaneously.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface HeatmapProps {
  energy: number[];
  temperatures: number[];
  occupation: number[][];
  mu: number;
  width?: number;
  height?: number;
}

// Color scale for occupation probability
const createColorScale = () => {
  return d3.scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateInferno);
};

export const Heatmap: React.FC<HeatmapProps> = ({
  energy,
  temperatures,
  occupation,
  mu,
  width = 700,
  height = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    energy: number;
    temperature: number;
    occupation: number;
  } | null>(null);

  const margin = { top: 40, right: 80, bottom: 60, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Render heatmap on canvas
  useEffect(() => {
    if (!canvasRef.current || !occupation.length || !energy.length || !temperatures.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Color scale
    const colorScale = createColorScale();

    // Calculate cell dimensions
    const cellWidth = innerWidth / energy.length;
    const cellHeight = innerHeight / temperatures.length;

    // Draw heatmap cells
    occupation.forEach((row, tempIdx) => {
      row.forEach((value, energyIdx) => {
        const x = margin.left + energyIdx * cellWidth;
        const y = margin.top + (temperatures.length - 1 - tempIdx) * cellHeight;
        
        ctx.fillStyle = colorScale(value);
        ctx.fillRect(x, y, cellWidth + 0.5, cellHeight + 0.5);
      });
    });

    // Draw μ line if in range
    const muIdx = energy.findIndex((_, i) => 
      i < energy.length - 1 && energy[i] <= mu && energy[i + 1] > mu
    );
    if (muIdx >= 0) {
      const muX = margin.left + (muIdx + (mu - energy[muIdx]) / (energy[muIdx + 1] - energy[muIdx])) * cellWidth;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(muX, margin.top);
      ctx.lineTo(muX, margin.top + innerHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [energy, temperatures, occupation, mu, width, height, innerWidth, innerHeight, margin.left, margin.top]);

  // Render axes and labels with SVG overlay
  useEffect(() => {
    if (!overlayRef.current || !energy.length || !temperatures.length) return;

    const svg = d3.select(overlayRef.current);
    svg.selectAll('*').remove();

    // Scales
    const xScale = d3.scaleLinear()
      .domain([energy[0], energy[energy.length - 1]])
      .range([margin.left, margin.left + innerWidth]);

    const yScale = d3.scaleLog()
      .domain([Math.max(temperatures[0], 0.1), temperatures[temperatures.length - 1]])
      .range([margin.top + innerHeight, margin.top]);

    // X-Axis
    const xAxis = d3.axisBottom(xScale).ticks(8);
    svg.append('g')
      .attr('transform', `translate(0,${margin.top + innerHeight})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', '#4b5563'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#4b5563'))
      .call(g => g.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '10px'));

    // X-Axis label
    svg.append('text')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', height - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '12px')
      .text('Energy E (eV)');

    // Y-Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5, '.0f');
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(yAxis)
      .call(g => g.select('.domain').attr('stroke', '#4b5563'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#4b5563'))
      .call(g => g.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '10px'));

    // Y-Axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(margin.top + innerHeight / 2))
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '12px')
      .text('Temperature T (K)');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '14px')
      .attr('font-weight', '500')
      .text('Energy–Temperature Surface f(E, T)');

    // Color bar
    const colorBarHeight = innerHeight;
    const colorBarWidth = 15;
    const colorBarX = width - margin.right + 25;
    const colorBarY = margin.top;

    // Create gradient for color bar
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'heatmap-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    const colorScale = createColorScale();
    for (let i = 0; i <= 10; i++) {
      gradient.append('stop')
        .attr('offset', `${i * 10}%`)
        .attr('stop-color', colorScale(i / 10));
    }

    // Color bar rect
    svg.append('rect')
      .attr('x', colorBarX)
      .attr('y', colorBarY)
      .attr('width', colorBarWidth)
      .attr('height', colorBarHeight)
      .attr('fill', 'url(#heatmap-gradient)')
      .attr('rx', 2);

    // Color bar axis
    const colorBarScale = d3.scaleLinear()
      .domain([0, 1])
      .range([colorBarY + colorBarHeight, colorBarY]);

    const colorBarAxis = d3.axisRight(colorBarScale)
      .ticks(5)
      .tickFormat(d3.format('.1f'));

    svg.append('g')
      .attr('transform', `translate(${colorBarX + colorBarWidth},0)`)
      .call(colorBarAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#4b5563').attr('x1', -colorBarWidth))
      .call(g => g.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', '9px'));

    // Color bar label
    svg.append('text')
      .attr('transform', `translate(${colorBarX + colorBarWidth + 40},${margin.top + innerHeight / 2}) rotate(90)`)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .text('f(E)');

  }, [energy, temperatures, width, height, innerWidth, innerHeight, margin.left, margin.right, margin.top]);

  // Mouse interaction handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !energy.length || !temperatures.length || !occupation.length) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if within heatmap area
    if (x < margin.left || x > margin.left + innerWidth || 
        y < margin.top || y > margin.top + innerHeight) {
      setTooltip(null);
      return;
    }

    // Calculate indices
    const energyIdx = Math.floor((x - margin.left) / innerWidth * energy.length);
    const tempIdx = temperatures.length - 1 - Math.floor((y - margin.top) / innerHeight * temperatures.length);

    if (energyIdx >= 0 && energyIdx < energy.length && 
        tempIdx >= 0 && tempIdx < temperatures.length) {
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        energy: energy[energyIdx],
        temperature: temperatures[tempIdx],
        occupation: occupation[tempIdx]?.[energyIdx] ?? 0,
      });
    }
  }, [energy, temperatures, occupation, innerWidth, innerHeight, margin.left, margin.top]);

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="heatmap-container relative w-full" style={{ maxWidth: width }}>
      {/* Canvas for heatmap pixels */}
      <canvas
        ref={canvasRef}
        className="heatmap-canvas rounded-lg w-full h-auto"
        style={{ width, height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* SVG overlay for axes and labels */}
      <svg
        ref={overlayRef}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Tooltip */}
      {tooltip?.visible && (
        <div
          className="tooltip pointer-events-none"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y - 10,
            transform: 'none',
          }}
        >
          <div className="text-neon-cyan font-mono">E = {tooltip.energy.toFixed(3)} eV</div>
          <div className="text-neon-amber font-mono">T = {tooltip.temperature.toFixed(0)} K</div>
          <div className="text-neon-violet font-mono">f(E) = {tooltip.occupation.toFixed(4)}</div>
        </div>
      )}
    </div>
  );
};

export default Heatmap;
