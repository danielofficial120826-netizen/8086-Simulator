// 8086 Visual Simulator - Assembly Code Editor & Line Indicator
import React from 'react';
import { Instruction } from '../simulator/types';
import { Code, PlayCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface EditorPanelProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  onAssembleAndLoad: () => void;
  currentInstruction?: Instruction;
  errors: Array<{ line: number; message: string }>;
  breakpoints: Set<number>;
  onToggleBreakpoint: (line: number) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  code,
  onChangeCode,
  onAssembleAndLoad,
  currentInstruction,
  errors,
  breakpoints,
  onToggleBreakpoint,
}) => {
  const lines = code.split('\n');

  return (
    <div className="flex flex-col h-full bg-[#090d16] border-r border-[#1e293b] select-none text-xs font-mono">
      {/* Editor Header */}
      <div className="h-9 px-3 bg-[#0d1424] border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Code className="w-4 h-4 text-cyan-400" />
          <span>8086 ASSEMBLY SOURCE</span>
        </div>
        <button
          onClick={onAssembleAndLoad}
          className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-bold transition-colors shadow-sm shadow-cyan-500/20"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>ASSEMBLE & LOAD</span>
        </button>
      </div>

      {/* Editor Code Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers & Breakpoint Gutter */}
        <div className="w-12 bg-[#080b12] border-r border-[#1e293b] py-2 flex flex-col items-center shrink-0">
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const isCurrent = currentInstruction?.line === lineNum;
            const hasBreakpoint = breakpoints.has(lineNum);
            const hasError = errors.some(e => e.line === lineNum);

            return (
              <div
                key={lineNum}
                onClick={() => onToggleBreakpoint(lineNum)}
                className="w-full h-5 flex items-center justify-between px-1 cursor-pointer hover:bg-[#1e293b] group"
              >
                {/* Pointer / Breakpoint Marker */}
                <div className="w-3 flex items-center justify-center">
                  {isCurrent ? (
                    <span className="text-cyan-400 font-bold text-[10px] animate-pulse">▶</span>
                  ) : hasBreakpoint ? (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/30 opacity-0 group-hover:opacity-100" />
                  )}
                </div>

                {/* Line number */}
                <span className={`text-[10px] ${hasError ? 'text-rose-400 font-bold' : isCurrent ? 'text-cyan-400 font-bold' : 'text-slate-600'}`}>
                  {lineNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Text Area */}
        <div className="flex-1 relative overflow-auto">
          <textarea
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            spellCheck={false}
            className="w-full h-full p-2 bg-transparent text-slate-200 outline-none resize-none font-mono text-xs leading-5 whitespace-pre focus:ring-0 selection:bg-cyan-900 selection:text-cyan-200"
          />
        </div>
      </div>

      {/* Footer / Error Callout */}
      {errors.length > 0 ? (
        <div className="p-2 bg-rose-950/60 border-t border-rose-800 text-rose-300 text-[11px] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="truncate">Line {errors[0].line}: {errors[0].message}</span>
        </div>
      ) : (
        <div className="px-3 py-1.5 bg-[#0b101c] border-t border-[#1e293b] text-slate-500 text-[10px] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Assembled Successfully</span>
          </div>
          <span>{lines.length} Lines</span>
        </div>
      )}
    </div>
  );
};
