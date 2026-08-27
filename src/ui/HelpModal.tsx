// 8086 Visual Simulator - Architecture Guide & Help Modal
import React from 'react';
import { X, BookOpen, Layers, Cpu, Compass, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-3xl bg-[#090d16] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs font-mono">
        
        {/* Header */}
        <div className="h-12 px-4 bg-[#0d1424] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>INTEL 8086 ARCHITECTURE GUIDE & SIMULATOR REFERENCE</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1e293b] text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-300">
          
          {/* Section 1: The Two Functional Units */}
          <div>
            <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              1. BIU vs. EU (Two-Stage Pipeline)
            </h2>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="p-3 bg-[#0c121e] rounded-lg border border-[#1e3a8a]">
                <h3 className="text-xs font-bold text-blue-400 mb-1">Bus Interface Unit (BIU)</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Handles all external data and address bus transactions. Contains Segment Registers (CS, DS, SS, ES), Instruction Pointer (IP), the 20-bit dedicated address adder (Σ), and the 6-byte instruction prefetch queue.
                </p>
              </div>
              <div className="p-3 bg-[#0c121e] rounded-lg border border-[#065f46]">
                <h3 className="text-xs font-bold text-emerald-400 mb-1">Execution Unit (EU)</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Executes instructions consumed from the prefetch queue. Contains the 16-bit ALU, FLAGS register, General Purpose Registers (AX, BX, CX, DX), Pointer/Index Registers (SP, BP, SI, DI), and Control Logic.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Physical Address Calculation */}
          <div className="p-3 bg-[#0c121e] rounded-lg border border-[#1e293b]">
            <h2 className="text-sm font-bold text-amber-400 mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              2. 20-Bit Physical Address Generation
            </h2>
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              The 8086 addresses 1 Megabyte (2²⁰ = 1,048,576 bytes) using 16-bit registers through the formula:
            </p>
            <div className="p-2 bg-[#060911] rounded border border-amber-500/30 text-amber-300 font-bold text-center">
              Physical Address = (Segment Register × 16) + Offset = (Segment &lt;&lt; 4) + Offset
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Example: If CS = 1234H and IP = 0100H: (1234H × 10H) + 0100H = 12340H + 0100H = 12440H.
            </p>
          </div>

          {/* Section 3: Keyboard Shortcuts & Controls */}
          <div>
            <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              3. Interactive Navigation & Controls
            </h2>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-[#0c121e] rounded border border-[#1e293b] flex justify-between">
                <span className="text-slate-400">Pan Architecture:</span>
                <span className="text-cyan-300 font-bold">Click & Drag Canvas</span>
              </div>
              <div className="p-2 bg-[#0c121e] rounded border border-[#1e293b] flex justify-between">
                <span className="text-slate-400">Zoom In / Out:</span>
                <span className="text-cyan-300 font-bold">Scroll Wheel / Buttons</span>
              </div>
              <div className="p-2 bg-[#0c121e] rounded border border-[#1e293b] flex justify-between">
                <span className="text-slate-400">Inspect Component:</span>
                <span className="text-cyan-300 font-bold">Click Register/Wire/ALU</span>
              </div>
              <div className="p-2 bg-[#0c121e] rounded border border-[#1e293b] flex justify-between">
                <span className="text-slate-400">Reset View:</span>
                <span className="text-cyan-300 font-bold">Double-Click Canvas</span>
              </div>
              <div className="p-2 bg-[#0c121e] rounded border border-[#1e293b] flex justify-between">
                <span className="text-slate-400">Micro-Step:</span>
                <span className="text-amber-300 font-bold">Advance 1 Clock Stage</span>
              </div>
              <div className="p-2 bg-[#0c121e] rounded border border-[#1e293b] flex justify-between">
                <span className="text-slate-400">Toggle Breakpoint:</span>
                <span className="text-rose-300 font-bold">Click Line Gutter</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="h-10 px-4 bg-[#0d1424] border-t border-[#1e293b] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
