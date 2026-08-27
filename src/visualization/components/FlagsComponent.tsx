// 8086 Visual Simulator - FLAGS Register Component
import React from 'react';
import { FlagsState, FlagName } from '../../simulator/types';
import { SelectedItem } from '../types';

interface FlagsComponentProps {
  flags: FlagsState;
  modifiedFlags?: FlagName[];
  isSelected?: boolean;
  onSelect: (item: SelectedItem) => void;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface FlagBitInfo {
  name: FlagName;
  bit: number;
  label: string;
  desc: string;
}

const FLAG_BITS: FlagBitInfo[] = [
  { name: 'OF', bit: 11, label: 'OF', desc: 'Overflow Flag: 1 if signed arithmetic overflow occurred' },
  { name: 'DF', bit: 10, label: 'DF', desc: 'Direction Flag: 0=up/increment, 1=down/decrement' },
  { name: 'IF', bit: 9,  label: 'IF', desc: 'Interrupt Enable: 1=enabled, 0=disabled' },
  { name: 'TF', bit: 8,  label: 'TF', desc: 'Trap Flag: 1=single-step debug mode enabled' },
  { name: 'SF', bit: 7,  label: 'SF', desc: 'Sign Flag: 1 if MSB of result is 1 (negative)' },
  { name: 'ZF', bit: 6,  label: 'ZF', desc: 'Zero Flag: 1 if result is zero' },
  { name: 'AF', bit: 4,  label: 'AF', desc: 'Auxiliary Carry: Half-carry from bit 3 to 4 for BCD' },
  { name: 'PF', bit: 2,  label: 'PF', desc: 'Parity Flag: 1 if low 8 bits have even number of 1s' },
  { name: 'CF', bit: 0,  label: 'CF', desc: 'Carry Flag: 1 if arithmetic carry/borrow out of MSB' },
];

export const FlagsComponent: React.FC<FlagsComponentProps> = ({
  flags,
  modifiedFlags = [],
  isSelected = false,
  onSelect,
  x,
  y,
  width = 310,
  height = 110,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({
      type: 'FLAGS',
      id: 'FLAGS',
      name: 'FLAGS (Status & Control)',
      category: 'EU',
      details: {
        flags,
        wordHex: Object.entries(flags)
          .reduce((acc, [k, v], i) => acc | (v ? 1 << i : 0), 0)
          .toString(16)
          .padStart(4, '0')
          .toUpperCase() + 'H',
      },
    });
  };

  const handleBitClick = (e: React.MouseEvent, info: FlagBitInfo) => {
    e.stopPropagation();
    onSelect({
      type: 'FLAG_BIT',
      id: info.name,
      name: `Flag [${info.name}] - ${info.label}`,
      category: 'EU',
      details: {
        name: info.name,
        bitPosition: info.bit,
        value: flags[info.name] ? 1 : 0,
        description: info.desc,
      },
    });
  };

  const bitWidth = (width - 24) / FLAG_BITS.length;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Container */}
      <rect
        width={width}
        height={height}
        rx={8}
        fill="#0f172a"
        stroke={isSelected ? '#00f0ff' : '#334155'}
        strokeWidth={isSelected ? 2 : 1.2}
      />

      {/* Header */}
      <rect x={0} y={0} width={width} height={26} rx={8} fill="#1e293b" />
      <rect x={0} y={18} width={width} height={8} fill="#1e293b" />
      <text x={12} y={17} fill="#e2e8f0" fontSize={11} fontWeight="bold" fontFamily="monospace">
        FLAGS REGISTER (16-bit Status / Control)
      </text>

      {/* 9 Bit Flip-Flops */}
      <g transform="translate(12, 36)">
        {FLAG_BITS.map((info, idx) => {
          const isActive = flags[info.name];
          const isModified = modifiedFlags.includes(info.name);
          const bx = idx * bitWidth;

          return (
            <g
              key={info.name}
              transform={`translate(${bx}, 0)`}
              onClick={(e) => handleBitClick(e, info)}
            >
              {/* Bit box */}
              <rect
                x={1}
                y={0}
                width={bitWidth - 3}
                height={60}
                rx={4}
                fill={isActive ? 'rgba(0, 230, 118, 0.15)' : '#090d16'}
                stroke={isModified ? '#ffd600' : isActive ? '#00e676' : '#223046'}
                strokeWidth={isModified ? 1.8 : 1}
                filter={isActive ? 'url(#glow-green)' : undefined}
              />

              {/* Bit Name */}
              <text
                x={(bitWidth - 3) / 2}
                y={16}
                textAnchor="middle"
                fill={isActive ? '#00e676' : '#64748b'}
                fontSize={10}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {info.name}
              </text>

              {/* Bit Value (0 or 1) */}
              <text
                x={(bitWidth - 3) / 2}
                y={38}
                textAnchor="middle"
                fill={isActive ? '#ffffff' : '#475569'}
                fontSize={14}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {isActive ? '1' : '0'}
              </text>

              {/* LED Dot */}
              <circle
                cx={(bitWidth - 3) / 2}
                cy={50}
                r={2.5}
                fill={isActive ? '#00e676' : '#1e293b'}
              />
            </g>
          );
        })}
      </g>
    </g>
  );
};
