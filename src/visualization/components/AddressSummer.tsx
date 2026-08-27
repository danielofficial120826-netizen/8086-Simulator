// 8086 Visual Simulator - 20-bit Dedicated Address Generation Adder (BIU)
import React from 'react';
import { Register16 } from '../../simulator/types';
import { SelectedItem } from '../types';

interface AddressSummerProps {
  segmentReg: Register16;
  segmentValue: number;
  offsetReg: Register16 | 'DISP' | 'IMMEDIATE';
  offsetValue: number;
  shiftResult: number;
  physicalAddress: number;
  isActive?: boolean;
  isSelected?: boolean;
  onSelect: (item: SelectedItem) => void;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export const AddressSummer: React.FC<AddressSummerProps> = ({
  segmentReg,
  segmentValue,
  offsetReg,
  offsetValue,
  shiftResult,
  physicalAddress,
  isActive = true,
  isSelected = false,
  onSelect,
  x,
  y,
  width = 280,
  height = 220,
}) => {
  const segHex = segmentValue.toString(16).padStart(4, '0').toUpperCase();
  const offHex = offsetValue.toString(16).padStart(4, '0').toUpperCase();
  const baseHex = shiftResult.toString(16).padStart(5, '0').toUpperCase();
  const physHex = physicalAddress.toString(16).padStart(5, '0').toUpperCase();
  const physBin = physicalAddress.toString(2).padStart(20, '0');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({
      type: 'ADDRESS_SUMMER',
      id: 'ADDRESS_SUMMER',
      name: '20-bit Dedicated Address Adder',
      category: 'BIU',
      details: {
        formula: `Physical Address = (${segmentReg} × 16) + ${offsetReg}`,
        segment: `${segmentReg} = ${segHex}H`,
        segmentBase: `${baseHex}H (${segHex}0H - shifted left 4 bits)`,
        offset: `${offsetReg} = ${offHex}H`,
        physicalAddress: `${physHex}H`,
        binary20: physBin,
        decimal: physicalAddress,
      },
    });
  };

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Container Box */}
      <rect
        width={width}
        height={height}
        rx={8}
        fill="#0f172a"
        stroke={isSelected ? '#00f0ff' : isActive ? '#f59e0b' : '#334155'}
        strokeWidth={isSelected ? 2 : 1.4}
        filter={isActive ? 'url(#glow-amber)' : undefined}
      />

      {/* Header */}
      <rect x={0} y={0} width={width} height={26} rx={8} fill="#1e293b" />
      <rect x={0} y={18} width={width} height={8} fill="#1e293b" />
      <text x={12} y={17} fill="#fbbf24" fontSize={11} fontWeight="bold" fontFamily="monospace">
        20-BIT ADDRESS GENERATOR (Σ)
      </text>

      {/* 1. Segment Register Input */}
      <g transform="translate(14, 38)">
        <rect x={0} y={0} width={width - 28} height={28} rx={4} fill="#111c2e" stroke="#1e293b" />
        <text x={8} y={18} fill="#94a3b8" fontSize={10} fontFamily="monospace">{segmentReg} (16b):</text>
        <text x={width - 40} y={18} textAnchor="end" fill="#38bdf8" fontSize={12} fontWeight="bold" fontFamily="monospace">
          {segHex}H
        </text>
      </g>

      {/* 2. Shift Left << 4 (Segment Base) */}
      <g transform="translate(14, 72)">
        <rect x={0} y={0} width={width - 28} height={28} rx={4} fill="#182338" stroke="#f59e0b44" />
        <text x={8} y={18} fill="#fbbf24" fontSize={10} fontFamily="monospace">{`${segmentReg} × 16 (<<4):`}</text>
        <text x={width - 40} y={18} textAnchor="end" fill="#f59e0b" fontSize={12} fontWeight="bold" fontFamily="monospace">
          {baseHex}H
        </text>
      </g>

      {/* + Plus Symbol */}
      <text x={width / 2} y={114} textAnchor="middle" fill="#fbbf24" fontSize={14} fontWeight="bold">+</text>

      {/* 3. Offset Input */}
      <g transform="translate(14, 120)">
        <rect x={0} y={0} width={width - 28} height={28} rx={4} fill="#111c2e" stroke="#1e293b" />
        <text x={8} y={18} fill="#94a3b8" fontSize={10} fontFamily="monospace">Offset {offsetReg}:</text>
        <text x={width - 40} y={18} textAnchor="end" fill="#38bdf8" fontSize={12} fontWeight="bold" fontFamily="monospace">
          {offHex}H
        </text>
      </g>

      {/* 4. Physical Address Output (20-bit) */}
      <g transform="translate(14, 160)">
        <rect
          x={0}
          y={0}
          width={width - 28}
          height={48}
          rx={6}
          fill="rgba(245, 158, 11, 0.12)"
          stroke="#f59e0b"
          strokeWidth={1.5}
        />
        <text x={8} y={18} fill="#fcd34d" fontSize={10} fontWeight="bold" fontFamily="monospace">
          PHYSICAL ADDRESS (20-bit):
        </text>
        <text x={width / 2} y={38} textAnchor="middle" fill="#ffffff" fontSize={16} fontWeight="bold" fontFamily="monospace">
          {physHex}H
        </text>
      </g>
    </g>
  );
};
