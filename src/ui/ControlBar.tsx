// 8086 Visual Simulator - Control Transport & Presets Bar
import React from 'react';
import { Play, Pause, StepForward, RotateCcw, FastForward, ZoomIn, ZoomOut, Maximize2, Compass } from 'lucide-react';
import { CPUState } from '../simulator/types';
import { PROGRAM_PRESETS, ProgramPreset } from '../simulator/samples';
import { CameraState } from '../visualization/types';

interface ControlBarProps {
  cpuState: CPUState;
  isRunning: boolean;
  onRun: () => void;
  onPause: () => void;
  onStepInstruction: () => void;
  onMicroStep: () => void;
  onReset: () => void;
  speed: number; // in milliseconds delay per step (e.g. 50ms to 1200ms)
  onSpeedChange: (speed: number) => void;
  onSelectPreset: (preset: ProgramPreset) => void;
  camera: CameraState;
  onCameraChange: (cam: CameraState) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  cpuState,
  isRunning,
  onRun,
  onPause,
  onStepInstruction,
  onMicroStep,
  onReset,
  speed,
  onSpeedChange,
  onSelectPreset,
  camera,
  onCameraChange,
}) => {
  const isHalted = cpuState.execution.status === 'HALTED';

  const handleZoomIn = () => {
    onCameraChange({ ...camera, zoom: Math.min(camera.zoom * 1.2, 3.0) });
  };

  const handleZoomOut = () => {
    onCameraChange({ ...camera, zoom: Math.max(camera.zoom / 1.2, 0.35) });
  };

  const handleFit = () => {
    onCameraChange({ x: 0, y: 0, zoom: 0.9 });
  };

  return (
    <div className="h-12 bg-[#0c121e] border-b border-[#1e293b] flex items-center justify-between px-4 select-none shrink-0 text-xs font-mono">
      
      {/* 1. Transport Execution Buttons */}
      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold transition-colors shadow-sm shadow-amber-500/20"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>PAUSE</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            disabled={isHalted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-colors ${
              isHalted
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>RUN</span>
          </button>
        )}

        <button
          onClick={onStepInstruction}
          disabled={isRunning || isHalted}
          title="Step one full Assembly Instruction"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-200 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <StepForward className="w-3.5 h-3.5 text-cyan-400" />
          <span>STEP (Inst)</span>
        </button>

        <button
          onClick={onMicroStep}
          disabled={isRunning || isHalted}
          title="Step exactly one internal Micro-Operation stage (BIU fetch / queue / decode / ALU / write)"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-200 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FastForward className="w-3.5 h-3.5 text-amber-400" />
          <span>MICRO-STEP (Clock)</span>
        </button>

        <button
          onClick={onReset}
          title="Reset registers, flags, queue, and restart program"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-200 rounded transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>RESET</span>
        </button>
      </div>

      {/* 2. Speed Slider */}
      <div className="flex items-center gap-3 bg-[#090d16] px-3 py-1 rounded border border-[#1e293b]">
        <span className="text-slate-400 text-[11px]">SPEED:</span>
        <input
          type="range"
          min="50"
          max="1200"
          step="50"
          value={1250 - speed}
          onChange={(e) => onSpeedChange(1250 - Number(e.target.value))}
          className="w-24 accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded"
        />
        <span className="text-cyan-400 w-12 text-right text-[11px]">
          {((1250 - speed) / 120).toFixed(1)}x
        </span>
      </div>

      {/* 3. Program Presets Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-[11px]">PROGRAM:</span>
        <select
          onChange={(e) => {
            const found = PROGRAM_PRESETS.find(p => p.id === e.target.value);
            if (found) onSelectPreset(found);
          }}
          defaultValue={PROGRAM_PRESETS[0].id}
          className="bg-[#090d16] border border-[#1e293b] text-cyan-300 rounded px-2 py-1 text-xs outline-none focus:border-cyan-500 cursor-pointer"
        >
          {PROGRAM_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id} className="bg-[#0f172a] text-slate-200">
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Camera View Controls */}
      <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded border border-[#1e293b]">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1 hover:bg-[#1e293b] text-slate-300 rounded"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1 hover:bg-[#1e293b] text-slate-300 rounded"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleFit}
          title="Fit Architecture to Screen"
          className="p-1 hover:bg-[#1e293b] text-slate-300 rounded"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] text-slate-500 px-1">
          {Math.round(camera.zoom * 100)}%
        </span>
      </div>

    </div>
  );
};
