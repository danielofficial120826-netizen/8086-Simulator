// 8086 Visual Simulator - Detailed 16-bit Arithmetic Logic Unit (ALU)
import React from 'react';
import { ALUOperation } from '../../simulator/types';
import { SelectedItem } from '../types';

interface ALUComponentProps {
  inputA: number;
  inputB: number;
  operation: ALUOperation;
  result: number;
  width?: 8 | 16;
  isActive?: boolean;
  isSelected?: boolean;
  onSelect: (item: SelectedItem) => void;
  x: number;
  y: number;
  cWidth?: number;
  cHeight?: number;
}

export const ALUComponent: React.FC<ALUComponentProps> = ({
  inputA,
  inputB,
  operation,
  result,
  width = 16,
  isActive = false,
  isSelected = false,
  onSelect,
  x,
  y,
  cWidth = 650,
  cHeight = 270,
}) => {
  const hexA = inputA.toString(16).padStart(4, '0').toUpperCase();
  const hexB = inputB.toString(16).padStart(4, '0').toUpperCase();
  const hexRes = result.toString(16).padStart(4, '0').toUpperCase();
  const binA = inputA.toString(2).padStart(16, '0');
  const binB = inputB.toString(2).padStart(16, '0');
  const binRes = result.toString(2).padStart(16, '0');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({
      type: 'ALU',
      id: 'ALU',
      name: '16-bit Arithmetic Logic Unit (ALU)',
      category: 'EU',
      details: {
        operation,
        inputA: `${hexA}H (${inputA}) [${binA}]`,
        inputB: `${hexB}H (${inputB}) [${binB}]`,
        result: `${hexRes}H (${result}) [${binRes}]`,
        width: `${width}-bit`,
        status: isActive ? 'COMPUTING' : 'IDLE',
      },
    });
  };

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer Card Enclosure */}
      <rect
        width={cWidth}
        height={cHeight}
        rx={8}
        fill="#0f172a"
        stroke={isSelected ? '#00f0ff' : isActive ? '#00e676' : '#334155'}
        strokeWidth={isSelected ? 2 : 1.2}
        filter={isActive ? 'url(#glow-green)' : undefined}
      />

      {/* Header */}
      <rect x={0} y={0} width={cWidth} height={26} rx={8} fill="#1e293b" />
      <rect x={0} y={18} width={cWidth} height={8} fill="#1e293b" />
      <text x={12} y={17} fill="#38bdf8" fontSize={11} fontWeight="bold" fontFamily="monospace">
        16-BIT ARITHMETIC LOGIC UNIT (ALU) & INTERNAL SHIFTER
      </text>

      {/* Input A Register Box */}
      <g transform="translate(30, 45)">
        <rect x={0} y={0} width={180} height={50} rx={6} fill="#111c2e" stroke="#2563eb" strokeWidth={1.2} />
        <text x={10} y={18} fill="#94a3b8" fontSize={10} fontFamily="monospace">OPERAND A (Input)</text>
        <text x={90} y={38} textAnchor="middle" fill="#38bdf8" fontSize={15} fontWeight="bold" fontFamily="monospace">
          {hexA}H <tspan fill="#64748b" fontSize={11}>({inputA})</tspan>
        </text>
      </g>

      {/* Input B Register Box */}
      <g transform="translate(30, 115)">
        <rect x={0} y={0} width={180} height={50} rx={6} fill="#111c2e" stroke="#2563eb" strokeWidth={1.2} />
        <text x={10} y={18} fill="#94a3b8" fontSize={10} fontFamily="monospace">OPERAND B (Input)</text>
        <text x={90} y={38} textAnchor="middle" fill="#38bdf8" fontSize={15} fontWeight="bold" fontFamily="monospace">
          {hexB}H <tspan fill="#64748b" fontSize={11}>({inputB})</tspan>
        </text>
      </g>

      {/* Classic ALU V-Shaped Core Polygon */}
      <g transform="translate(240, 45)">
        {/* Polygon path for ALU standard symbol */}
        <polygon
          points="0,0 160,0 200,80 160,160 0,160 40,80"
          fill={isActive ? 'rgba(0, 230, 118, 0.12)' : '#162238'}
          stroke={isActive ? '#00e676' : '#38bdf8'}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Operation Label in ALU center */}
        <text
          x={105}
          y={75}
          textAnchor="middle"
          fill={isActive ? '#00e676' : '#ffffff'}
          fontSize={20}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {operation}
        </text>
        <text
          x={105}
          y={98}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={11}
          fontFamily="monospace"
        >
          16-bit ALU Core
        </text>
      </g>

      {/* Output / Result Register Box */}
      <g transform="translate(470, 75)">
        <rect
          x={0}
          y={0}
          width={150}
          height={80}
          rx={6}
          fill="rgba(0, 230, 118, 0.08)"
          stroke="#00e676"
          strokeWidth={1.5}
        />
        <text x={10} y={20} fill="#00e676" fontSize={10} fontWeight="bold" fontFamily="monospace">ALU RESULT BUFFER</text>
        <text x={75} y={48} textAnchor="middle" fill="#ffffff" fontSize={18} fontWeight="bold" fontFamily="monospace">
          {hexRes}H
        </text>
        <text x={75} y={68} textAnchor="middle" fill="#94a3b8" fontSize={11} fontFamily="monospace">
          Dec: {result}
        </text>
      </g>

      {/* 16-bit Binary Signal Lane at bottom of ALU */}
      <g transform="translate(30, 195)">
        <rect x={0} y={0} width={cWidth - 60} height={55} rx={6} fill="#090d16" stroke="#1e293b" />
        <text x={12} y={18} fill="#64748b" fontSize={10} fontFamily="monospace">
          16-BIT RESULT SIGNAL LANES (Bit 15 .. Bit 0):
        </text>
        <g transform="translate(12, 28)">
          {binRes.split('').map((bit, idx) => {
            const isHigh = bit === '1';
            const laneWidth = (cWidth - 84) / 16;
            return (
              <g key={idx} transform={`translate(${idx * laneWidth}, 0)`}>
                <rect
                  x={1}
                  y={0}
                  width={laneWidth - 2}
                  height={18}
                  rx={2}
                  fill={isHigh ? '#00e676' : '#1e293b'}
                />
                <text
                  x={(laneWidth - 2) / 2}
                  y={13}
                  textAnchor="middle"
                  fill={isHigh ? '#000000' : '#475569'}
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {bit}
                </text>
              </g>
            );
          })}
        </g>
      </g>
    </g>
  );
};
