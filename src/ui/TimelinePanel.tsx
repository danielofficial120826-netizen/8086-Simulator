// 8086 Visual Simulator - Micro-Operation Execution Timeline
import React, { useRef, useEffect } from 'react';
import { MicroOp } from '../simulator/types';
import { ListFilter, Clock, CheckCircle, ArrowRight } from 'lucide-react';

interface TimelinePanelProps {
  timeline: MicroOp[];
  activeMicroOpIndex: number;
  onSelectMicroOp: (op: MicroOp) => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  timeline,
  activeMicroOpIndex,
  onSelectMicroOp,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new event
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [timeline.length, activeMicroOpIndex]);

  const getBadgeColor = (type: MicroOp['type']) => {
    switch (type) {
      case 'BIU_ADDR_CALC':
      case 'BUS_FETCH_REQ':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'QUEUE_PUSH':
      case 'QUEUE_POP':
      case 'QUEUE_FLUSH':
        return 'bg-yellow-950 text-yellow-400 border-yellow-800';
      case 'DECODE_START':
      case 'DECODE_COMPLETE':
        return 'bg-purple-950 text-purple-400 border-purple-800';
      case 'REG_READ':
      case 'REG_WRITE':
        return 'bg-cyan-950 text-cyan-400 border-cyan-800';
      case 'ALU_INPUT_A':
      case 'ALU_INPUT_B':
      case 'ALU_EXEC':
      case 'ALU_RESULT':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'FLAG_UPDATE':
        return 'bg-pink-950 text-pink-400 border-pink-800';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#090d16] border-r border-[#1e293b] select-none text-xs font-mono">
      {/* Header */}
      <div className="h-9 px-3 bg-[#0d1424] border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>MICRO-OPERATION TIMELINE</span>
        </div>
        <span className="text-[10px] text-slate-500">{timeline.length} Events</span>
      </div>

      {/* Timeline Event List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {timeline.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-4">
            <Clock className="w-8 h-8 mb-2 opacity-30" />
            <p>No micro-operations recorded yet.</p>
            <p className="text-[10px] text-slate-500 mt-1">Press RUN or MICRO-STEP to begin.</p>
          </div>
        ) : (
          timeline.map((op, idx) => {
            const isCurrent = idx === timeline.length - 1;

            return (
              <div
                key={op.id || idx}
                onClick={() => onSelectMicroOp(op)}
                className={`p-2 rounded-md border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#111c30] border-cyan-500/70 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#0c121e] border-[#1e293b] hover:border-slate-600'
                }`}
              >
                {/* Top Row: MicroOp Type + Step Index */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border ${getBadgeColor(op.type)}`}>
                    {op.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                </div>

                {/* Description */}
                <p className="text-slate-200 text-[11px] leading-snug">{op.description}</p>

                {/* Datapath: Source -> Target */}
                {op.sourceComponent && op.targetComponent && (
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="text-cyan-300 font-semibold">{op.sourceComponent}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-emerald-300 font-semibold">{op.targetComponent}</span>
                    {op.value !== undefined && (
                      <span className="ml-auto font-mono text-amber-300 font-bold">
                        [{op.value.toString(16).toUpperCase()}H]
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
