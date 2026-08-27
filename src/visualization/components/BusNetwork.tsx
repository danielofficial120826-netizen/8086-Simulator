// 8086 Visual Simulator - Interactive Bus & Wire Network
import React, { useState } from 'react';
import { WIRES } from '../layout';
import { WireDefinition, SelectedItem, ActiveSignalPacket } from '../types';

interface BusNetworkProps {
  activeWireId?: string;
  activeValue?: number;
  activeWidth?: 8 | 16 | 20;
  selectedWireId?: string;
  onSelect: (item: SelectedItem) => void;
  showLabels?: boolean;
  showBusValues?: boolean;
  pulseProgress?: number; // 0 to 1 for travelling photon
}

export const BusNetwork: React.FC<BusNetworkProps> = ({
  activeWireId,
  activeValue,
  activeWidth = 16,
  selectedWireId,
  onSelect,
  showLabels = true,
  showBusValues = true,
  pulseProgress = 0.5,
}) => {
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);

  const getWireColor = (wire: WireDefinition, isActive: boolean, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) return '#00f0ff';
    if (isActive) {
      switch (wire.type) {
        case 'data': return '#00f0ff';
        case 'address': return '#f59e0b';
        case 'control': return '#e040fb';
        case 'instruction': return '#ffd600';
      }
    }
    if (isHovered) return '#ffffff';
    switch (wire.type) {
      case 'data': return '#1e3a5f';
      case 'address': return '#452a0a';
      case 'control': return '#3d164d';
      case 'instruction': return '#453a0a';
    }
  };

  const getWireWidth = (wire: WireDefinition, isActive: boolean) => {
    const base = wire.busWidth === 20 ? 8 : wire.busWidth === 16 ? 6 : wire.busWidth === 8 ? 4 : 2;
    return isActive ? base + 2 : base;
  };

  const handleWireClick = (e: React.MouseEvent, wire: WireDefinition) => {
    e.stopPropagation();
    const val = (activeWireId === wire.id && activeValue !== undefined) ? activeValue : 0;
    const hex = val.toString(16).padStart(wire.busWidth / 4, '0').toUpperCase() + 'H';
    const bin = val.toString(2).padStart(wire.busWidth, '0');

    onSelect({
      type: 'WIRE',
      id: wire.id,
      name: wire.name,
      category: 'BUS',
      details: {
        busName: wire.name,
        type: wire.type.toUpperCase(),
        width: `${wire.busWidth}-bit`,
        source: wire.source,
        target: wire.target,
        currentValue: `${hex} (${val})`,
        binarySignal: bin,
        status: activeWireId === wire.id ? 'ACTIVE TRANSMISSION' : 'IDLE',
      },
    });
  };

  return (
    <g className="bus-network">
      {WIRES.map((wire) => {
        const isActive = activeWireId === wire.id;
        const isSelected = selectedWireId === wire.id;
        const isHovered = hoveredWireId === wire.id;
        const strokeColor = getWireColor(wire, isActive, isSelected, isHovered);
        const strokeWidth = getWireWidth(wire, isActive);

        return (
          <g
            key={wire.id}
            onClick={(e) => handleWireClick(e, wire)}
            onMouseEnter={() => setHoveredWireId(wire.id)}
            onMouseLeave={() => setHoveredWireId(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Invisible thicker hit-box for easy clicking */}
            <path
              d={wire.path}
              fill="none"
              stroke="transparent"
              strokeWidth={18}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Base Wire Track */}
            <path
              d={wire.path}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={isActive ? 'url(#glow-cyan)' : undefined}
              className="transition-colors duration-150"
            />

            {/* Active Signal Travelling Pulse */}
            {isActive && (
              <path
                d={wire.path}
                fill="none"
                stroke="#ffffff"
                strokeWidth={strokeWidth + 2}
                strokeLinecap="round"
                strokeDasharray="16 32"
                strokeDashoffset={-pulseProgress * 100}
                opacity={0.9}
              />
            )}

            {/* Wire Label / Value Tag */}
            {showLabels && wire.labelPosition && (
              <g transform={`translate(${wire.labelPosition.x}, ${wire.labelPosition.y})`}>
                <rect
                  x={-4}
                  y={-10}
                  width={wire.name.length * 6 + 12}
                  height={15}
                  rx={3}
                  fill="rgba(15, 23, 42, 0.85)"
                  stroke={isActive ? strokeColor : '#334155'}
                  strokeWidth={0.8}
                />
                <text
                  x={2}
                  y={1}
                  fill={isActive ? strokeColor : '#94a3b8'}
                  fontSize={8}
                  fontWeight={isActive ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  {wire.name}
                </text>
              </g>
            )}

            {/* Active Value Badge on Bus */}
            {showBusValues && isActive && activeValue !== undefined && wire.labelPosition && (
              <g transform={`translate(${wire.labelPosition.x}, ${wire.labelPosition.y + 16})`}>
                <rect
                  x={-6}
                  y={-10}
                  width={64}
                  height={18}
                  rx={4}
                  fill="#000000"
                  stroke="#00f0ff"
                  strokeWidth={1.2}
                  filter="url(#glow-cyan)"
                />
                <text
                  x={26}
                  y={3}
                  textAnchor="middle"
                  fill="#00f0ff"
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {activeValue.toString(16).toUpperCase()}H
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};
