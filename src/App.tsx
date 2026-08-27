// 8086 Internal Architecture Interactive Visual Simulator - Main App
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CPU8086 } from './simulator/cpu8086';
import { CPUState, MicroOp, Instruction } from './simulator/types';
import { PROGRAM_PRESETS, ProgramPreset } from './simulator/samples';
import { CameraState, SelectedItem, ViewOptions } from './visualization/types';

import { Header } from './ui/Header';
import { ControlBar } from './ui/ControlBar';
import { ArchitectureView } from './visualization/components/ArchitectureView';
import { EditorPanel } from './ui/EditorPanel';
import { TimelinePanel } from './ui/TimelinePanel';
import { InspectorPanel } from './ui/InspectorPanel';
import { MemoryPanel } from './ui/MemoryPanel';
import { HelpModal } from './ui/HelpModal';
import { Code, Clock, Info, Database, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // Initialize CPU instance in ref to prevent recreating on re-renders
  const cpuRef = useRef<CPU8086>(new CPU8086());

  // UI States
  const [code, setCode] = useState<string>(PROGRAM_PRESETS[0].code);
  const [cpuState, setCpuState] = useState<CPUState>(() => cpuRef.current.getState());
  const [timeline, setTimeline] = useState<MicroOp[]>([]);
  const [currentMicroOp, setCurrentMicroOp] = useState<MicroOp | undefined>(undefined);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(400); // 400ms delay per micro-op
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Left & Right tab selectors
  const [leftTab, setLeftTab] = useState<'editor' | 'timeline'>('editor');
  const [rightTab, setRightTab] = useState<'inspector' | 'memory'>('inspector');

  // Camera Pan/Zoom State
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, zoom: 0.85 });

  // Selected Architecture Component / Wire
  const [selectedItem, setSelectedItem] = useState<SelectedItem>({
    type: 'NONE',
    id: '8086_OVERVIEW',
    name: 'Intel 8086 Architecture Overview',
    category: 'BIU',
    details: {
      architecture: '16-bit Microprocessor with 20-bit Address Space (1MB)',
      units: 'Bus Interface Unit (BIU) + Execution Unit (EU)',
      queue: '6-Byte Instruction Prefetch Queue',
      alu: '16-bit ALU with 9-bit Status/Control FLAGS',
      clockFrequency: '5 MHz to 10 MHz (Historical 8086/8088)',
      technology: 'HMOS 3.2μm Silicon Gate Technology (29,000 transistors)',
    },
  });

  // View Options
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    showLabels: true,
    showBusValues: true,
    showBinary: true,
    showHex: true,
    showSignalNames: true,
    showInternalEvents: true,
    focusMode: false,
    showGrid: true,
  });

  // Event listener setup on CPU engine
  useEffect(() => {
    const cpu = cpuRef.current;
    const unsub = cpu.onEvent((event, state) => {
      setCurrentMicroOp(event);
      setTimeline(prev => [...prev.slice(-150), event]); // keep last 150 events
      setCpuState(state);
    });

    // Assemble and load initial program
    cpu.loadAssembly(code);
    setCpuState(cpu.getState());

    return () => unsub();
  }, []);

  const handleToggleOption = (key: keyof ViewOptions) => {
    setViewOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAssembleAndLoad = useCallback(() => {
    setIsRunning(false);
    const cpu = cpuRef.current;
    const res = cpu.loadAssembly(code);
    setTimeline([]);
    setCurrentMicroOp(undefined);
    setCpuState(cpu.getState());
  }, [code]);

  const handleSelectPreset = useCallback((preset: ProgramPreset) => {
    setIsRunning(false);
    setCode(preset.code);
    const cpu = cpuRef.current;
    cpu.loadAssembly(preset.code);
    setTimeline([]);
    setCurrentMicroOp(undefined);
    setCpuState(cpu.getState());
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    const cpu = cpuRef.current;
    cpu.loadAssembly(code);
    setTimeline([]);
    setCurrentMicroOp(undefined);
    setCpuState(cpu.getState());
  }, [code]);

  const handleMicroStep = useCallback(() => {
    const cpu = cpuRef.current;
    const res = cpu.microStep();
    setCpuState(cpu.getState());
    if (res.completedInstruction) {
      // Check if hit breakpoint
      const state = cpu.getState();
      const nextInst = state.execution.currentInstruction;
      if (nextInst && breakpoints.has(nextInst.line)) {
        setIsRunning(false);
      }
    }
  }, [breakpoints]);

  const handleStepInstruction = useCallback(() => {
    const cpu = cpuRef.current;
    cpu.stepInstruction();
    setCpuState(cpu.getState());
  }, []);

  const handleToggleBreakpoint = (line: number) => {
    setBreakpoints(prev => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  };

  // Execution Timer Loop when isRunning is true
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      const cpu = cpuRef.current;
      const state = cpu.getState();

      if (state.execution.status === 'HALTED' || state.execution.status === 'ERROR') {
        setIsRunning(false);
        return;
      }

      const res = cpu.microStep();
      setCpuState(cpu.getState());

      // If instruction just finished, check breakpoints
      if (res.completedInstruction) {
        const nextState = cpu.getState();
        const nextInst = nextState.execution.currentInstruction;
        if (nextInst && breakpoints.has(nextInst.line)) {
          setIsRunning(false);
        }
      }
    }, speed);

    return () => clearInterval(timer);
  }, [isRunning, speed, breakpoints]);

  const handleSelectMicroOp = (op: MicroOp) => {
    setCurrentMicroOp(op);
    if (op.sourceComponent || op.targetComponent) {
      setSelectedItem({
        type: 'WIRE',
        id: op.id,
        name: `Micro-Op: ${op.type}`,
        category: 'BUS',
        details: {
          description: op.description,
          source: op.sourceComponent,
          target: op.targetComponent,
          bus: op.activeBus,
          value: op.value !== undefined ? `${op.value.toString(16).toUpperCase()}H (${op.value})` : undefined,
          timestamp: new Date(op.timestamp || Date.now()).toLocaleTimeString(),
        },
      });
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#070a10] text-slate-200 overflow-hidden select-none">
      
      {/* 1. Top Header */}
      <Header
        cpuState={cpuState}
        viewOptions={viewOptions}
        onToggleOption={handleToggleOption}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Control Bar (Oscilloscope Transport & Presets) */}
      <ControlBar
        cpuState={cpuState}
        isRunning={isRunning}
        onRun={() => setIsRunning(true)}
        onPause={() => setIsRunning(false)}
        onStepInstruction={handleStepInstruction}
        onMicroStep={handleMicroStep}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={setSpeed}
        onSelectPreset={handleSelectPreset}
        camera={camera}
        onCameraChange={setCamera}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side Panel (Editor & Timeline) */}
        <div className="w-84 shrink-0 flex flex-col bg-[#090d16] border-r border-[#1e293b] z-10 shadow-xl">
          {/* Tabs */}
          <div className="h-8 bg-[#0b101c] border-b border-[#1e293b] flex items-center px-2 gap-1 text-[11px] font-mono">
            <button
              onClick={() => setLeftTab('editor')}
              className={`flex items-center gap-1 px-3 py-1 rounded font-bold transition-colors ${
                leftTab === 'editor' ? 'bg-[#1e293b] text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>CODE EDITOR</span>
            </button>
            <button
              onClick={() => setLeftTab('timeline')}
              className={`flex items-center gap-1 px-3 py-1 rounded font-bold transition-colors ${
                leftTab === 'timeline' ? 'bg-[#1e293b] text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>TIMELINE</span>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {leftTab === 'editor' ? (
              <EditorPanel
                code={code}
                onChangeCode={setCode}
                onAssembleAndLoad={handleAssembleAndLoad}
                currentInstruction={cpuState.execution.currentInstruction}
                errors={cpuRef.current.getParsedProgram().errors}
                breakpoints={breakpoints}
                onToggleBreakpoint={handleToggleBreakpoint}
              />
            ) : (
              <TimelinePanel
                timeline={timeline}
                activeMicroOpIndex={timeline.length - 1}
                onSelectMicroOp={handleSelectMicroOp}
              />
            )}
          </div>
        </div>

        {/* Center Stage: Interactive Architecture SVG Viewport */}
        <div className="flex-1 relative overflow-hidden">
          <ArchitectureView
            cpuState={cpuState}
            currentMicroOp={currentMicroOp}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            viewOptions={viewOptions}
            camera={camera}
            onCameraChange={setCamera}
          />

          {/* Active Datapath Status Overlay Pill */}
          {currentMicroOp && (
            <div className="absolute top-3 left-4 max-w-xl px-3 py-2 bg-[#090d16]/90 backdrop-blur-md border border-cyan-500/50 rounded-lg shadow-xl text-xs font-mono flex items-center gap-2 pointer-events-none animate-pulse">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-cyan-400 font-bold uppercase text-[10px] block">
                  ACTIVE STAGE: {currentMicroOp.type}
                </span>
                <p className="text-white text-xs truncate">{currentMicroOp.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Panel (Inspector & 1MB Memory) */}
        <div className="w-88 shrink-0 flex flex-col bg-[#090d16] border-l border-[#1e293b] z-10 shadow-xl">
          {/* Tabs */}
          <div className="h-8 bg-[#0b101c] border-b border-[#1e293b] flex items-center px-2 gap-1 text-[11px] font-mono">
            <button
              onClick={() => setRightTab('inspector')}
              className={`flex items-center gap-1 px-3 py-1 rounded font-bold transition-colors ${
                rightTab === 'inspector' ? 'bg-[#1e293b] text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>INSPECTOR</span>
            </button>
            <button
              onClick={() => setRightTab('memory')}
              className={`flex items-center gap-1 px-3 py-1 rounded font-bold transition-colors ${
                rightTab === 'memory' ? 'bg-[#1e293b] text-blue-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>1MB MEMORY</span>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {rightTab === 'inspector' ? (
              <InspectorPanel
                selectedItem={selectedItem}
                cpuState={cpuState}
              />
            ) : (
              <MemoryPanel
                memory={cpuRef.current.memory}
                cpuState={cpuState}
              />
            )}
          </div>
        </div>

      </div>

      {/* Architecture Guide Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

    </div>
  );
};

export default App;
