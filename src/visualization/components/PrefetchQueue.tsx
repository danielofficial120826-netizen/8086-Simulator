// 8086 Visual Simulator - 6-Byte Instruction Prefetch Queue (BIU)
import React from 'react';
import { SelectedItem } from '../types';

interface PrefetchQueueProps {
  bytes: number[];
  isActive?: boolean;
  isSelected?: boolean;
  onSelect: (item: SelectedItem) => void;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export const PrefetchQueue: React.FC<PrefetchQueueProps> = ({
  bytes,
  isActive = false,
  isSelected = false,
  onSelect,
  x,
  y,
  width = 550,
  height = 120,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({
      type: 'PREFETCH_QUEUE',
      id: 'PREFETCH_QUEUE',
      name: '6-Byte Instruction Prefetch Queue',
      category: 'BIU',
      details: {
        capacity: 6,
        currentOccupancy: `${bytes.length} / 6 bytes`,
        bytesHex: bytes.map(b => `${b.toString(16).padStart(2, '0').toUpperCase()}H`).join(', ') || '(empty)',
        status: bytes.length === 6 ? 'FULL' : bytes.length === 0 ? 'EMPTY' : 'ACTIVE',
        description: 'Pipelining mechanism that prefetches opcode bytes from memory during EU execution cycles.',
      },
    });
  };

  const slotCount = 6;
  const slotWidth = (width - 48) / slotCount;
  const slotHeight = 56;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer Enclosure */}
      <rect
        width={width}
        height={height}
        rx={8}
        fill="#0f172a"
        stroke={isSelected ? '#00f0ff' : isActive ? '#ffd600' : '#334155'}
        strokeWidth={isSelected ? 2 : 1.4}
        filter={isActive ? 'url(#glow-yellow)' : undefined}
      />

      {/* Header */}
      <rect x={0} y={0} width={width} height={26} rx={8} fill="#1e293b" />
      <rect x={0} y={18} width={width} height={8} fill="#1e293b" />
      <text x={12} y={17} fill="#ffd600" fontSize={11} fontWeight="bold" fontFamily="monospace">
        6-BYTE INSTRUCTION PREFETCH QUEUE (FIFO)
      </text>

      {/* Occupancy Badge */}
      <rect x={width - 110} y={4} width={98} height={18} rx={4} fill="#090d16" stroke="#475569" />
      <text x={width - 61} y={17} textAnchor="middle" fill="#e2e8f0" fontSize={10} fontWeight="bold" fontFamily="monospace">
        QUEUE: {bytes.length} / 6
      </text>

      {/* 6 FIFO Slots */}
      <g transform="translate(24, 40)">
        {Array.from({ length: slotCount }).map((_, idx) => {
          const byteVal = bytes[idx];
          const hasByte = byteVal !== undefined;
          const sx = idx * slotWidth;

          return (
            <g key={idx} transform={`translate(${sx}, 0)`}>
              {/* Slot Rectangle */}
              <rect
                x={2}
                y={0}
                width={slotWidth - 4}
                height={slotHeight}
                rx={4}
                fill={hasByte ? 'rgba(255, 214, 0, 0.12)' : '#090d16'}
                stroke={hasByte ? '#ffd600' : '#223046'}
                strokeWidth={hasByte ? 1.5 : 1}
              />

              {/* Slot Label (B0, B1, ...) */}
              <text
                x={(slotWidth - 4) / 2}
                y={14}
                textAnchor="middle"
                fill="#64748b"
                fontSize={9}
                fontFamily="monospace"
              >
                Slot {idx} (B{idx})
              </text>

              {/* Byte value */}
              <text
                x={(slotWidth - 4) / 2}
                y={36}
                textAnchor="middle"
                fill={hasByte ? '#ffffff' : '#334155'}
                fontSize={15}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {hasByte ? `${byteVal.toString(16).padStart(2, '0').toUpperCase()}H` : '--'}
              </text>

              {/* Status Dot */}
              <circle
                cx={(slotWidth - 4) / 2}
                cy={47}
                r={2}
                fill={hasByte ? '#ffd600' : '#1e293b'}
              />
            </g>
          );
        })}
      </g>

      {/* FIFO Flow Arrows */}
      <g transform={`translate(24, ${height - 12})`}>
        <text x={8} y={0} fill="#64748b" fontSize={9} fontFamily="monospace">← BIU In (Push)</text>
        <text x={width - 56} y={0} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">EU Out (Pop) →</text>
      </g>
    </g>
  );
};
