// 8086 Visual Simulator - Graphical Register Component
import React from 'react';
import { Register16, Register8 } from '../../simulator/types';
import { SelectedItem } from '../types';

interface RegisterBoxProps {
  name: Register16;
  value: number;
  subHigh?: Register8;
  subLow?: Register8;
  changedBits?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onSelect: (item: SelectedItem) => void;
  x: number;
  y: number;
  width?: number;
  height?: number;
  showBinary?: boolean;
  showHex?: boolean;
}

export const RegisterBox: React.FC<RegisterBoxProps> = ({
  name,
  value,
  subHigh,
  subLow,
  changedBits = 0,
  isSelected = false,
  isHighlighted = false,
  onSelect,
  x,
  y,
  width = 210,
  height = 52,
  showBinary = true,
  showHex = true,
}) => {
  const hex16 = value.toString(16).padStart(4, '0').toUpperCase();
  const binary16 = value.toString(2).padStart(16, '0');
  const binHigh = binary16.slice(0, 8);
  const binLow = binary16.slice(8, 16);

  const valHigh = (value >> 8) & 0xFF;
  const valLow = value & 0xFF;
  const hexHigh = valHigh.toString(16).padStart(2, '0').toUpperCase();
  const hexLow = valLow.toString(2).padStart(2, '0').toUpperCase();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({
      type: 'REGISTER',
      id: name,
      name: `Register ${name}`,
      category: 'EU',
      details: {
        name,
        value,
        hex: `${hex16}H`,
        decimal: value,
        signedDecimal: value > 0x7FFF ? value - 0x10000 : value,
        binary: binary16,
        subHigh: subHigh ? { name: subHigh, value: valHigh, hex: `${hexHigh}H` } : undefined,
        subLow: subLow ? { name: subLow, value: valLow, hex: `${valLow.toString(16).padStart(2, '0').toUpperCase()}H` } : undefined,
      },
    });
  };

  const strokeColor = isSelected ? '#00f0ff' : isHighlighted ? '#00e676' : '#2a3b53';
  const fillColor = isSelected ? 'rgba(0, 240, 255, 0.12)' : isHighlighted ? 'rgba(0, 230, 118, 0.12)' : '#111827';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      className="transition-all duration-200"
    >
      {/* Outer Card */}
      <rect
        width={width}
        height={height}
        rx={6}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected || isHighlighted ? 2 : 1.2}
        filter={isHighlighted ? 'url(#glow-green)' : isSelected ? 'url(#glow-cyan)' : undefined}
      />

      {/* Register Name Badge */}
      <rect
        x={0}
        y={0}
        width={42}
        height={height}
        rx={6}
        fill={isSelected ? '#00f0ff22' : '#1e293b'}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <text
        x={21}
        y={height / 2 + 5}
        textAnchor="middle"
        fill={isSelected ? '#00f0ff' : '#94a3b8'}
        fontSize={13}
        fontWeight="bold"
        fontFamily="monospace"
      >
        {name}
      </text>

      {/* Hex and Sub-register view */}
      {subHigh && subLow ? (
        <g transform="translate(50, 0)">
          {/* High Byte Box */}
          <rect x={0} y={6} width={(width - 60) / 2 - 4} height={height - 12} rx={4} fill="#0f172a" stroke="#334155" strokeWidth={1} />
          <text x={8} y={20} fill="#64748b" fontSize={10} fontFamily="monospace">{subHigh}</text>
          <text x={(width - 60) / 4} y={32} textAnchor="middle" fill="#38bdf8" fontSize={13} fontWeight="bold" fontFamily="monospace">
            {hexHigh}H
          </text>

          {/* Low Byte Box */}
          <rect x={(width - 60) / 2 + 2} y={6} width={(width - 60) / 2 - 4} height={height - 12} rx={4} fill="#0f172a" stroke="#334155" strokeWidth={1} />
          <text x={(width - 60) / 2 + 8} y={20} fill="#64748b" fontSize={10} fontFamily="monospace">{subLow}</text>
          <text x={(width - 60) * 3 / 4} y={32} textAnchor="middle" fill="#38bdf8" fontSize={13} fontWeight="bold" fontFamily="monospace">
            {valLow.toString(16).padStart(2, '0').toUpperCase()}H
          </text>
        </g>
      ) : (
        <g transform="translate(50, 0)">
          <rect x={0} y={6} width={width - 58} height={height - 12} rx={4} fill="#0f172a" stroke="#334155" strokeWidth={1} />
          <text x={(width - 58) / 2} y={height / 2 + 5} textAnchor="middle" fill="#38bdf8" fontSize={14} fontWeight="bold" fontFamily="monospace">
            {hex16}H <tspan fill="#64748b" fontSize={11}>({value})</tspan>
          </text>
        </g>
      )}

      {/* Bit Lane Indicators (at bottom if height permits) */}
      {showBinary && (
        <g transform={`translate(52, ${height - 4})`}>
          {binary16.split('').map((bit, idx) => {
            const isBitChanged = (changedBits & (1 << (15 - idx))) !== 0;
            return (
              <circle
                key={idx}
                cx={idx * ((width - 64) / 16) + 4}
                cy={0}
                r={bit === '1' ? 2 : 1.2}
                fill={bit === '1' ? (isBitChanged ? '#ffd600' : '#00e676') : '#334155'}
              />
            );
          })}
        </g>
      )}
    </g>
  );
};
