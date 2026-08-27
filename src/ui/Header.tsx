// 8086 Visual Simulator - Application Header
import React from 'react';
import { CPUState } from '../simulator/types';
import { ViewOptions } from '../visualization/types';
import { Cpu, HelpCircle, Eye, Sliders, Layers, Sparkles } from 'lucide-react';

interface HeaderProps {
  cpuState: CPUState;
  viewOptions: ViewOptions;
  onToggleOption: (key: keyof ViewOptions) => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cpuState,
  viewOptions,
  onToggleOption,
  onOpenHelp,
}) => {
  const { status, cycleCount, instructionsExecuted } = cpuState.execution;

  const getStatusBadge = () => {
    switch (status) {
      case 'RUNNING':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500 animate-pulse">RUNNING</span>;
      case 'PAUSED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-950 text-amber-400 border border-amber-500">PAUSED</span>;
      case 'HALTED':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-950 text-red-400 border border-red-500">HALTED (HLT)</span>;
      case 'ERROR':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-950 text-rose-400 border border-rose-500">ERROR</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-sky-950 text-sky-400 border border-sky-500">READY</span>;
    }
  };

  return (
    <header className="h-14 bg-[#090d16] border-b border-[#1e293b] flex items-center justify-between px-4 select-none shrink-0 z-30">
      {/* Title & Silicon Badge */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-wide font-mono">
              INTEL 8086 MICROPROCESSOR
            </h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1e293b] text-cyan-400 border border-cyan-500/30">
              16-BIT HMOS ARCHITECTURE
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Interactive Internal Datapath & Micro-Op Visual Simulator
          </p>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 bg-[#0d1526] px-3 py-1.5 rounded-md border border-[#1e293b]">
          <span className="text-slate-400">STATUS:</span>
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-2 bg-[#0d1526] px-3 py-1.5 rounded-md border border-[#1e293b]">
          <span className="text-slate-400">CYCLES:</span>
          <span className="text-cyan-400 font-bold">{cycleCount}</span>
        </div>

        <div className="flex items-center gap-2 bg-[#0d1526] px-3 py-1.5 rounded-md border border-[#1e293b]">
          <span className="text-slate-400">INST EXECUTED:</span>
          <span className="text-emerald-400 font-bold">{instructionsExecuted}</span>
        </div>

        <div className="flex items-center gap-2 bg-[#0d1526] px-3 py-1.5 rounded-md border border-[#1e293b]">
          <span className="text-slate-400">QUEUE:</span>
          <span className="text-yellow-400 font-bold">{cpuState.queue.length}/6 B</span>
        </div>
      </div>

      {/* View & Educational Toggles */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleOption('focusMode')}
          title="Focus Mode: Dims everything except the currently active datapath"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
            viewOptions.focusMode
              ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm shadow-cyan-500/30'
              : 'bg-[#111827] text-slate-400 border-[#1e293b] hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Focus Mode</span>
        </button>

        <button
          onClick={() => onToggleOption('showBinary')}
          title="Toggle 16-bit binary display on registers and ALU"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
            viewOptions.showBinary
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/30'
              : 'bg-[#111827] text-slate-400 border-[#1e293b] hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Binary</span>
        </button>

        <button
          onClick={() => onToggleOption('showLabels')}
          title="Toggle wire and bus labels"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
            viewOptions.showLabels
              ? 'bg-blue-950 text-blue-300 border-blue-500'
              : 'bg-[#111827] text-slate-400 border-[#1e293b] hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Labels</span>
        </button>

        <button
          onClick={onOpenHelp}
          title="Architecture Guide & Documentation"
          className="p-1.5 bg-[#111827] hover:bg-[#1e293b] text-slate-300 rounded border border-[#1e293b] transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
