// 8086 Visual Simulator - Deep Component Inspector & State Explorer
import React, { useState } from 'react';
import { CPUState } from '../simulator/types';
import { SelectedItem } from '../visualization/types';
import { Info, Activity, Radio, Cpu, CheckSquare } from 'lucide-react';

interface InspectorPanelProps {
  selectedItem: SelectedItem;
  cpuState: CPUState;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedItem,
  cpuState,
}) => {
  const [activeTab, setActiveTab] = useState<'component' | 'registers' | 'probe'>('component');

  return (
    <div className="flex flex-col h-full bg-[#090d16] select-none text-xs font-mono">
      {/* Tab Navigation */}
      <div className="h-9 px-2 bg-[#0d1424] border-b border-[#1e293b] flex items-center gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('component')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
            activeTab === 'component'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>INSPECTOR</span>
        </button>

        <button
          onClick={() => setActiveTab('registers')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
            activeTab === 'registers'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>REGISTERS</span>
        </button>

        <button
          onClick={() => setActiveTab('probe')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
            activeTab === 'probe'
              ? 'bg-purple-950 text-purple-300 border border-purple-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>LOGIC PROBE</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        
        {/* TAB 1: COMPONENT INSPECTION */}
        {activeTab === 'component' && (
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-3">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  {selectedItem.category || '8086 ARCHITECTURE'}
                </span>
                <h2 className="text-sm font-bold text-white mt-0.5">{selectedItem.name}</h2>
              </div>
              <span className="px-2 py-0.5 bg-[#1e293b] text-slate-300 rounded text-[10px] uppercase font-bold">
                {selectedItem.type}
              </span>
            </div>

            {selectedItem.details ? (
              <div className="space-y-2.5">
                {Object.entries(selectedItem.details).map(([key, val]) => {
                  if (typeof val === 'object' && val !== null) {
                    return (
                      <div key={key} className="p-2 bg-[#0c121e] rounded border border-[#1e293b]">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">{key}:</span>
                        <pre className="text-[10px] text-cyan-300 mt-1 overflow-x-auto">
                          {JSON.stringify(val, null, 2)}
                        </pre>
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="flex flex-col bg-[#0c121e] p-2 rounded border border-[#1e293b]">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">{key}</span>
                      <span className="text-cyan-300 font-bold text-xs mt-0.5 break-all">{String(val)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Click any register, wire, ALU, Queue, or Adder on the visualizer to inspect.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CPU ALL REGISTERS TABLE */}
        {activeTab === 'registers' && (
          <div className="space-y-3">
            {/* General Purpose */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                General Purpose Registers (16-bit / 8-bit split)
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {(['AX', 'BX', 'CX', 'DX'] as const).map(reg => {
                  const val = cpuState.registers[reg];
                  const hex = val.toString(16).padStart(4, '0').toUpperCase();
                  const high = ((val >> 8) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
                  const low = (val & 0xFF).toString(16).padStart(2, '0').toUpperCase();
                  return (
                    <div key={reg} className="p-2 bg-[#0c121e] rounded border border-[#1e293b] flex items-center justify-between">
                      <span className="font-bold text-cyan-400">{reg}</span>
                      <div className="text-right">
                        <span className="font-bold text-white">{hex}H</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          H:{high} L:{low}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pointer & Index */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Pointer & Index Registers
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {(['SP', 'BP', 'SI', 'DI'] as const).map(reg => (
                  <div key={reg} className="p-2 bg-[#0c121e] rounded border border-[#1e293b] flex items-center justify-between">
                    <span className="font-bold text-emerald-400">{reg}</span>
                    <span className="font-bold text-white">{cpuState.registers[reg].toString(16).padStart(4, '0').toUpperCase()}H</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Segment Registers */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Segment Registers & IP
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {(['CS', 'DS', 'SS', 'ES', 'IP'] as const).map(reg => (
                  <div key={reg} className="p-2 bg-[#0c121e] rounded border border-[#1e293b] flex items-center justify-between">
                    <span className="font-bold text-amber-400">{reg}</span>
                    <span className="font-bold text-white">{cpuState.registers[reg].toString(16).padStart(4, '0').toUpperCase()}H</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 16-BIT LOGIC ANALYZER PROBE */}
        {activeTab === 'probe' && (
          <div className="space-y-3">
            <div className="p-2 bg-[#0c121e] rounded border border-[#1e293b]">
              <span className="text-[10px] text-slate-400 font-bold uppercase">INTERNAL BUS VOLTAGE / LOGIC STATE</span>
              <div className="mt-2 space-y-1">
                {Array.from({ length: 16 }).map((_, idx) => {
                  const bitPos = 15 - idx;
                  const bitVal = (cpuState.alu.result & (1 << bitPos)) !== 0 ? 1 : 0;
                  return (
                    <div key={bitPos} className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-slate-500">D{bitPos.toString().padStart(2, '0')}:</span>
                      <div className="flex-1 h-3 bg-[#070a10] rounded relative overflow-hidden flex items-center">
                        <div
                          className={`h-full transition-all duration-150 ${
                            bitVal ? 'w-full bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'w-0'
                          }`}
                        />
                      </div>
                      <span className={`w-4 text-center font-bold text-[10px] ${bitVal ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {bitVal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
