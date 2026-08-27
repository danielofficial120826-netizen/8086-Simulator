// 8086 Visual Simulator - Interactive Architecture SVG Viewport
import React, { useRef, useState, useEffect } from 'react';
import { CPUState, MicroOp, Register16, Register8 } from '../../simulator/types';
import { CameraState, SelectedItem, ViewOptions } from '../types';
import { LAYOUT, CANVAS_DIMENSIONS } from '../layout';
import { RegisterBox } from './RegisterBox';
import { FlagsComponent } from './FlagsComponent';
import { AddressSummer } from './AddressSummer';
import { PrefetchQueue } from './PrefetchQueue';
import { ALUComponent } from './ALUComponent';
import { BusNetwork } from './BusNetwork';

interface ArchitectureViewProps {
  cpuState: CPUState;
  currentMicroOp?: MicroOp;
  selectedItem: SelectedItem;
  onSelectItem: (item: SelectedItem) => void;
  viewOptions: ViewOptions;
  camera: CameraState;
  onCameraChange: (cam: CameraState) => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  cpuState,
  currentMicroOp,
  selectedItem,
  onSelectItem,
  viewOptions,
  camera,
  onCameraChange,
}) => {
  const containerRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pulseProgress, setPulseProgress] = useState(0);

  // Smooth signal pulse animation loop
  useEffect(() => {
    let animId: number;
    const updatePulse = () => {
      setPulseProgress(p => (p + 0.03) % 1);
      animId = requestAnimationFrame(updatePulse);
    };
    animId = requestAnimationFrame(updatePulse);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Pan & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) { // Left or middle click
      setIsDragging(true);
      setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onCameraChange({
        ...camera,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(camera.zoom * zoomFactor, 0.35), 3.0);

    // Zoom toward mouse pointer
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const newX = mouseX - (mouseX - camera.x) * (newZoom / camera.zoom);
      const newY = mouseY - (mouseY - camera.y) * (newZoom / camera.zoom);

      onCameraChange({
        x: newX,
        y: newY,
        zoom: newZoom,
      });
    }
  };

  // Double Click: Zoom to component
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Reset to center fit
    onCameraChange({ x: 0, y: 0, zoom: 0.9 });
  };

  // Determine active wire based on micro-op
  const getActiveWireId = (): string | undefined => {
    if (!currentMicroOp) return undefined;
    switch (currentMicroOp.type) {
      case 'BIU_ADDR_CALC': return 'wire_summer_to_bus';
      case 'BUS_FETCH_REQ': return 'wire_summer_to_bus';
      case 'QUEUE_PUSH': return 'wire_mem_to_queue';
      case 'QUEUE_POP': return 'wire_queue_to_decoder';
      case 'DECODE_START': return 'wire_decoder_to_control';
      case 'REG_READ': return 'wire_gp_to_bus';
      case 'REG_WRITE': return 'wire_internal_bus_spine';
      case 'ALU_INPUT_A': return 'wire_bus_to_alu_a';
      case 'ALU_INPUT_B': return 'wire_bus_to_alu_b';
      case 'ALU_RESULT': return 'wire_alu_out_to_bus';
      case 'FLAG_UPDATE': return 'wire_alu_to_flags';
      default: return undefined;
    }
  };

  // Highlighting active components
  const isComponentHighlighted = (compName: string) => {
    if (!currentMicroOp) return false;
    return (
      currentMicroOp.sourceComponent?.includes(compName) ||
      currentMicroOp.targetComponent?.includes(compName)
    );
  };

  const activeWireId = getActiveWireId();

  return (
    <div className="relative w-full h-full bg-[#070a10] overflow-hidden select-none cursor-grab active:cursor-grabbing">
      <svg
        ref={containerRef}
        className="w-full h-full block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        <defs>
          {/* Engineering Background Grid */}
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#111827" strokeWidth="1" />
            <circle cx="0" cy="0" r="1" fill="#1e293b" />
          </pattern>

          {/* Glow Filters */}
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="#070a10" />
        {viewOptions.showGrid && (
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        )}

        {/* Main Camera Transform Group */}
        <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
          
          {/* 1. BIU (Bus Interface Unit) Boundary Container */}
          <g
            className="biu-container transition-opacity duration-200"
            opacity={viewOptions.focusMode && !currentMicroOp?.description.includes('BIU') && !currentMicroOp?.description.includes('Queue') ? 0.3 : 1}
          >
            <rect
              x={LAYOUT.BIU_CONTAINER.x}
              y={LAYOUT.BIU_CONTAINER.y}
              width={LAYOUT.BIU_CONTAINER.width}
              height={LAYOUT.BIU_CONTAINER.height}
              rx={12}
              fill="rgba(15, 23, 42, 0.6)"
              stroke="#1e3a8a"
              strokeWidth={1.8}
              strokeDasharray="6 4"
            />
            {/* BIU Header Tab */}
            <rect
              x={LAYOUT.BIU_CONTAINER.x + 20}
              y={LAYOUT.BIU_CONTAINER.y - 14}
              width={260}
              height={28}
              rx={6}
              fill="#1e3a8a"
            />
            <text
              x={LAYOUT.BIU_CONTAINER.x + 150}
              y={LAYOUT.BIU_CONTAINER.y + 5}
              textAnchor="middle"
              fill="#93c5fd"
              fontSize={12}
              fontWeight="bold"
              fontFamily="monospace"
            >
              BUS INTERFACE UNIT (BIU)
            </text>

            {/* Segment Registers (CS, DS, SS, ES) */}
            <g transform={`translate(${LAYOUT.SEGMENT_REGISTERS.x}, ${LAYOUT.SEGMENT_REGISTERS.y})`}>
              <rect width={LAYOUT.SEGMENT_REGISTERS.width} height={LAYOUT.SEGMENT_REGISTERS.height} rx={8} fill="#0b1120" stroke="#1e293b" />
              <text x={12} y={20} fill="#94a3b8" fontSize={10} fontWeight="bold" fontFamily="monospace">SEGMENT REGISTERS (16-bit)</text>
              <RegisterBox
                name="CS"
                value={cpuState.registers.CS}
                isSelected={selectedItem.id === 'CS'}
                isHighlighted={isComponentHighlighted('CS')}
                onSelect={onSelectItem}
                x={10}
                y={28}
                width={210}
                height={38}
                showBinary={false}
              />
              <RegisterBox
                name="DS"
                value={cpuState.registers.DS}
                isSelected={selectedItem.id === 'DS'}
                isHighlighted={isComponentHighlighted('DS')}
                onSelect={onSelectItem}
                x={10}
                y={70}
                width={210}
                height={38}
                showBinary={false}
              />
              <RegisterBox
                name="SS"
                value={cpuState.registers.SS}
                isSelected={selectedItem.id === 'SS'}
                isHighlighted={isComponentHighlighted('SS')}
                onSelect={onSelectItem}
                x={10}
                y={112}
                width={210}
                height={38}
                showBinary={false}
              />
              <RegisterBox
                name="ES"
                value={cpuState.registers.ES}
                isSelected={selectedItem.id === 'ES'}
                isHighlighted={isComponentHighlighted('ES')}
                onSelect={onSelectItem}
                x={10}
                y={154}
                width={210}
                height={38}
                showBinary={false}
              />
            </g>

            {/* Instruction Pointer (IP) */}
            <g transform={`translate(${LAYOUT.IP_REGISTER.x}, ${LAYOUT.IP_REGISTER.y})`}>
              <RegisterBox
                name="IP"
                value={cpuState.registers.IP}
                isSelected={selectedItem.id === 'IP'}
                isHighlighted={isComponentHighlighted('IP')}
                onSelect={onSelectItem}
                x={0}
                y={0}
                width={230}
                height={52}
                showBinary={viewOptions.showBinary}
              />
            </g>

            {/* 20-bit Dedicated Address Adder (Seg*16 + Offset) */}
            <AddressSummer
              segmentReg={cpuState.biu.segmentReg}
              segmentValue={cpuState.biu.segmentValue}
              offsetReg={cpuState.biu.offsetReg}
              offsetValue={cpuState.biu.offsetValue}
              shiftResult={cpuState.biu.shiftResult}
              physicalAddress={cpuState.biu.physicalAddress}
              isActive={isComponentHighlighted('Address Summer') || currentMicroOp?.type === 'BIU_ADDR_CALC'}
              isSelected={selectedItem.id === 'ADDRESS_SUMMER'}
              onSelect={onSelectItem}
              x={LAYOUT.ADDRESS_SUMMER.x}
              y={LAYOUT.ADDRESS_SUMMER.y}
              width={LAYOUT.ADDRESS_SUMMER.width}
              height={LAYOUT.ADDRESS_SUMMER.height}
            />

            {/* 6-Byte Prefetch Queue */}
            <PrefetchQueue
              bytes={cpuState.queue}
              isActive={isComponentHighlighted('Prefetch Queue') || currentMicroOp?.type === 'QUEUE_PUSH' || currentMicroOp?.type === 'QUEUE_POP'}
              isSelected={selectedItem.id === 'PREFETCH_QUEUE'}
              onSelect={onSelectItem}
              x={LAYOUT.PREFETCH_QUEUE.x}
              y={LAYOUT.PREFETCH_QUEUE.y}
              width={LAYOUT.PREFETCH_QUEUE.width}
              height={LAYOUT.PREFETCH_QUEUE.height}
            />

            {/* Bus Control Logic Box */}
            <g
              transform={`translate(${LAYOUT.BUS_CONTROL.x}, ${LAYOUT.BUS_CONTROL.y})`}
              onClick={() => onSelectItem({
                type: 'BUS_INTERFACE',
                id: 'BUS_CONTROL',
                name: 'Bus Control & 20-bit Interface',
                category: 'BIU',
                details: {
                  addressLines: 'A0 - A19 (20-bit Physical Address Bus)',
                  dataLines: 'AD0 - AD15 (16-bit Multiplexed Data/Address Bus)',
                  controlSignals: ['ALE', 'DEN', 'DT/R', 'M/IO', 'RD', 'WR'],
                  status: 'READY FOR BUS CYCLE',
                },
              })}
              style={{ cursor: 'pointer' }}
            >
              <rect width={LAYOUT.BUS_CONTROL.width} height={LAYOUT.BUS_CONTROL.height} rx={8} fill="#0f172a" stroke="#334155" strokeWidth={1.2} />
              <rect x={0} y={0} width={LAYOUT.BUS_CONTROL.width} height={26} rx={8} fill="#1e293b" />
              <text x={12} y={17} fill="#94a3b8" fontSize={11} fontWeight="bold" fontFamily="monospace">
                BUS CONTROL & 20-BIT INTERFACE
              </text>
              <text x={20} y={55} fill="#38bdf8" fontSize={11} fontFamily="monospace">Address Lines: A0 - A19</text>
              <text x={20} y={75} fill="#00e676" fontSize={11} fontFamily="monospace">Data Lines: AD0 - AD15</text>
              <text x={20} y={95} fill="#e040fb" fontSize={11} fontFamily="monospace">Controls: ALE, M/IO, RD, WR</text>
              <rect x={20} y={110} width={LAYOUT.BUS_CONTROL.width - 40} height={24} rx={4} fill="#1e293b" />
              <text x={LAYOUT.BUS_CONTROL.width / 2} y={126} textAnchor="middle" fill="#f59e0b" fontSize={11} fontWeight="bold" fontFamily="monospace">
                PHYS BUS: {cpuState.biu.physicalAddress.toString(16).padStart(5, '0').toUpperCase()}H
              </text>
            </g>

            {/* External Memory Interface Port */}
            <g
              transform={`translate(${LAYOUT.MEMORY_INTERFACE.x}, ${LAYOUT.MEMORY_INTERFACE.y})`}
              onClick={() => onSelectItem({
                type: 'MEMORY',
                id: 'MEM_PORT',
                name: '1MB System Memory Interface',
                category: 'MEMORY',
                details: {
                  capacity: '1,048,576 Bytes (1MB)',
                  activeSegment: `${cpuState.biu.segmentReg}:${cpuState.biu.offsetValue.toString(16).toUpperCase()}H`,
                  physicalBus: `${cpuState.biu.physicalAddress.toString(16).toUpperCase()}H`,
                },
              })}
              style={{ cursor: 'pointer' }}
            >
              <rect width={LAYOUT.MEMORY_INTERFACE.width} height={LAYOUT.MEMORY_INTERFACE.height} rx={8} fill="#0b1120" stroke="#1e3a8a" strokeWidth={1.2} />
              <text x={12} y={24} fill="#60a5fa" fontSize={11} fontWeight="bold" fontFamily="monospace">1MB SYSTEM MEMORY</text>
              <text x={12} y={50} fill="#94a3b8" fontSize={10} fontFamily="monospace">00000H - FFFFFH</text>
              <rect x={12} y={65} width={LAYOUT.MEMORY_INTERFACE.width - 24} height={60} rx={4} fill="#070a10" stroke="#1e293b" />
              <text x={20} y={85} fill="#38bdf8" fontSize={10} fontFamily="monospace">Last Access:</text>
              <text x={20} y={105} fill="#00e676" fontSize={11} fontWeight="bold" fontFamily="monospace">
                @{cpuState.biu.physicalAddress.toString(16).toUpperCase()}H
              </text>
            </g>
          </g>


          {/* 2. EU (Execution Unit) Boundary Container */}
          <g
            className="eu-container transition-opacity duration-200"
            opacity={viewOptions.focusMode && !currentMicroOp?.description.includes('ALU') && !currentMicroOp?.description.includes('Reg') && !currentMicroOp?.description.includes('Decoder') ? 0.3 : 1}
          >
            <rect
              x={LAYOUT.EU_CONTAINER.x}
              y={LAYOUT.EU_CONTAINER.y}
              width={LAYOUT.EU_CONTAINER.width}
              height={LAYOUT.EU_CONTAINER.height}
              rx={12}
              fill="rgba(15, 23, 42, 0.6)"
              stroke="#065f46"
              strokeWidth={1.8}
              strokeDasharray="6 4"
            />
            {/* EU Header Tab */}
            <rect
              x={LAYOUT.EU_CONTAINER.x + 20}
              y={LAYOUT.EU_CONTAINER.y - 14}
              width={240}
              height={28}
              rx={6}
              fill="#065f46"
            />
            <text
              x={LAYOUT.EU_CONTAINER.x + 140}
              y={LAYOUT.EU_CONTAINER.y + 5}
              textAnchor="middle"
              fill="#6ee7b7"
              fontSize={12}
              fontWeight="bold"
              fontFamily="monospace"
            >
              EXECUTION UNIT (EU)
            </text>

            {/* General Purpose Registers (AX, BX, CX, DX) */}
            <g transform={`translate(${LAYOUT.GP_REGISTERS.x}, ${LAYOUT.GP_REGISTERS.y})`}>
              <rect width={LAYOUT.GP_REGISTERS.width} height={LAYOUT.GP_REGISTERS.height} rx={8} fill="#0b1120" stroke="#1e293b" />
              <text x={12} y={20} fill="#94a3b8" fontSize={10} fontWeight="bold" fontFamily="monospace">GENERAL REGISTERS (16/8-bit)</text>
              <RegisterBox
                name="AX"
                value={cpuState.registers.AX}
                subHigh="AH"
                subLow="AL"
                isSelected={selectedItem.id === 'AX'}
                isHighlighted={isComponentHighlighted('AX')}
                onSelect={onSelectItem}
                x={10}
                y={28}
                width={290}
                height={46}
                showBinary={viewOptions.showBinary}
              />
              <RegisterBox
                name="BX"
                value={cpuState.registers.BX}
                subHigh="BH"
                subLow="BL"
                isSelected={selectedItem.id === 'BX'}
                isHighlighted={isComponentHighlighted('BX')}
                onSelect={onSelectItem}
                x={10}
                y={80}
                width={290}
                height={46}
                showBinary={viewOptions.showBinary}
              />
              <RegisterBox
                name="CX"
                value={cpuState.registers.CX}
                subHigh="CH"
                subLow="CL"
                isSelected={selectedItem.id === 'CX'}
                isHighlighted={isComponentHighlighted('CX')}
                onSelect={onSelectItem}
                x={10}
                y={132}
                width={290}
                height={46}
                showBinary={viewOptions.showBinary}
              />
              <RegisterBox
                name="DX"
                value={cpuState.registers.DX}
                subHigh="DH"
                subLow="DL"
                isSelected={selectedItem.id === 'DX'}
                isHighlighted={isComponentHighlighted('DX')}
                onSelect={onSelectItem}
                x={10}
                y={184}
                width={290}
                height={46}
                showBinary={viewOptions.showBinary}
              />
            </g>

            {/* Pointer & Index Registers (SP, BP, SI, DI) */}
            <g transform={`translate(${LAYOUT.POINTER_REGISTERS.x}, ${LAYOUT.POINTER_REGISTERS.y})`}>
              <rect width={LAYOUT.POINTER_REGISTERS.width} height={LAYOUT.POINTER_REGISTERS.height} rx={8} fill="#0b1120" stroke="#1e293b" />
              <text x={12} y={20} fill="#94a3b8" fontSize={10} fontWeight="bold" fontFamily="monospace">POINTER & INDEX REGISTERS</text>
              <RegisterBox
                name="SP"
                value={cpuState.registers.SP}
                isSelected={selectedItem.id === 'SP'}
                isHighlighted={isComponentHighlighted('SP')}
                onSelect={onSelectItem}
                x={10}
                y={28}
                width={290}
                height={46}
                showBinary={false}
              />
              <RegisterBox
                name="BP"
                value={cpuState.registers.BP}
                isSelected={selectedItem.id === 'BP'}
                isHighlighted={isComponentHighlighted('BP')}
                onSelect={onSelectItem}
                x={10}
                y={80}
                width={290}
                height={46}
                showBinary={false}
              />
              <RegisterBox
                name="SI"
                value={cpuState.registers.SI}
                isSelected={selectedItem.id === 'SI'}
                isHighlighted={isComponentHighlighted('SI')}
                onSelect={onSelectItem}
                x={10}
                y={132}
                width={290}
                height={46}
                showBinary={false}
              />
              <RegisterBox
                name="DI"
                value={cpuState.registers.DI}
                isSelected={selectedItem.id === 'DI'}
                isHighlighted={isComponentHighlighted('DI')}
                onSelect={onSelectItem}
                x={10}
                y={184}
                width={290}
                height={46}
                showBinary={false}
              />
            </g>

            {/* Instruction Decoder & Control Logic */}
            <g
              transform={`translate(${LAYOUT.DECODER.x}, ${LAYOUT.DECODER.y})`}
              onClick={() => onSelectItem({
                type: 'DECODER',
                id: 'DECODER',
                name: 'Instruction Decoder & Microcode Control ROM',
                category: 'EU',
                details: {
                  currentInstruction: cpuState.execution.currentInstruction?.rawText || '(idle)',
                  mnemonic: cpuState.execution.currentInstruction?.mnemonic || 'NOP',
                  operands: cpuState.execution.currentInstruction?.operands.map(o => o.rawText).join(', ') || 'none',
                  controlPhase: cpuState.controlUnit.currentPhase,
                  activeSignals: cpuState.controlUnit.activeSignals.join('; ') || 'NORMAL_EXEC',
                },
              })}
              style={{ cursor: 'pointer' }}
            >
              <rect
                width={LAYOUT.DECODER.width}
                height={LAYOUT.DECODER.height}
                rx={8}
                fill="#0f172a"
                stroke={selectedItem.id === 'DECODER' ? '#00f0ff' : isComponentHighlighted('Decoder') ? '#e040fb' : '#334155'}
                strokeWidth={isComponentHighlighted('Decoder') ? 2 : 1.2}
                filter={isComponentHighlighted('Decoder') ? 'url(#glow-cyan)' : undefined}
              />
              <rect x={0} y={0} width={LAYOUT.DECODER.width} height={26} rx={8} fill="#1e293b" />
              <text x={12} y={17} fill="#e040fb" fontSize={11} fontWeight="bold" fontFamily="monospace">
                INSTRUCTION DECODER & CONTROL LOGIC
              </text>
              <text x={14} y={52} fill="#94a3b8" fontSize={10} fontFamily="monospace">Current Opcode:</text>
              <text x={14} y={72} fill="#ffffff" fontSize={15} fontWeight="bold" fontFamily="monospace">
                {cpuState.execution.currentInstruction?.rawText || 'IDLE'}
              </text>
              <text x={14} y={94} fill="#e040fb" fontSize={10} fontFamily="monospace">
                Phase: {cpuState.controlUnit.currentPhase}
              </text>
            </g>

            {/* FLAGS Register */}
            <FlagsComponent
              flags={cpuState.flags}
              isSelected={selectedItem.id === 'FLAGS'}
              onSelect={onSelectItem}
              x={LAYOUT.FLAGS.x}
              y={LAYOUT.FLAGS.y}
              width={LAYOUT.FLAGS.width}
              height={LAYOUT.FLAGS.height}
            />

            {/* 16-bit ALU (Arithmetic Logic Unit) */}
            <ALUComponent
              inputA={cpuState.alu.inputA}
              inputB={cpuState.alu.inputB}
              operation={cpuState.alu.operation}
              result={cpuState.alu.result}
              width={cpuState.alu.width}
              isActive={isComponentHighlighted('ALU') || currentMicroOp?.type === 'ALU_EXEC' || currentMicroOp?.type === 'ALU_RESULT'}
              isSelected={selectedItem.id === 'ALU'}
              onSelect={onSelectItem}
              x={LAYOUT.ALU.x}
              y={LAYOUT.ALU.y}
              cWidth={LAYOUT.ALU.width}
              cHeight={LAYOUT.ALU.height}
            />
          </g>

          {/* 3. Interconnecting Bus Network & Pulse Flow */}
          <BusNetwork
            activeWireId={activeWireId}
            activeValue={currentMicroOp?.value}
            activeWidth={currentMicroOp?.width}
            selectedWireId={selectedItem.id}
            onSelect={onSelectItem}
            showLabels={viewOptions.showLabels}
            showBusValues={viewOptions.showBusValues}
            pulseProgress={pulseProgress}
          />

        </g>
      </svg>
    </div>
  );
};
