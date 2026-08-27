// 8086 Visual Simulator - 1MB Segmented Memory Viewer
import React, { useState } from 'react';
import { Memory } from '../simulator/memory';
import { CPUState } from '../simulator/types';
import { Database, Search } from 'lucide-react';

interface MemoryPanelProps {
  memory: Memory;
  cpuState: CPUState;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  memory,
  cpuState,
}) => {
  const [startAddrInput, setStartAddrInput] = useState('10000'); // 0x10000 (CS default)
  const [currentBaseAddr, setCurrentBaseAddr] = useState(0x10000);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = startAddrInput.replace(/H$/i, '').trim();
    const parsed = parseInt(clean, 16);
    if (!isNaN(parsed)) {
      setCurrentBaseAddr(parsed & 0xFFFFF);
    }
  };

  const rows = 12;
  const cols = 16;
  const totalBytes = rows * cols;
  const byteSlice = memory.getByteSlice(currentBaseAddr, totalBytes);

  // Physical pointer addresses
  const csPhys = Memory.calculatePhysicalAddress(cpuState.registers.CS, cpuState.registers.IP);
  const dsPhys = Memory.calculatePhysicalAddress(cpuState.registers.DS, cpuState.registers.SI);
  const ssPhys = Memory.calculatePhysicalAddress(cpuState.registers.SS, cpuState.registers.SP);

  return (
    <div className="flex flex-col h-full bg-[#090d16] select-none text-xs font-mono">
      {/* Header & Address Search */}
      <div className="h-9 px-3 bg-[#0d1424] border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>1MB SYSTEM MEMORY (00000H - FFFFFH)</span>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">PHYS ADDR:</span>
          <input
            type="text"
            value={startAddrInput}
            onChange={(e) => setStartAddrInput(e.target.value)}
            className="w-20 bg-[#060911] border border-[#1e293b] rounded px-1.5 py-0.5 text-cyan-300 text-xs outline-none focus:border-cyan-500 font-mono"
            placeholder="10000"
          />
          <button type="submit" className="p-1 bg-[#1e293b] hover:bg-[#334155] text-slate-300 rounded">
            <Search className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Segment Shortcut Buttons */}
      <div className="px-3 py-1.5 bg-[#0b101c] border-b border-[#1e293b] flex items-center gap-2 text-[10px]">
        <span className="text-slate-500">POINTERS:</span>
        <button
          onClick={() => { setCurrentBaseAddr(csPhys & ~0x0F); setStartAddrInput(csPhys.toString(16).toUpperCase()); }}
          className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold"
        >
          CS:IP ({csPhys.toString(16).padStart(5, '0').toUpperCase()}H)
        </button>
        <button
          onClick={() => { setCurrentBaseAddr(dsPhys & ~0x0F); setStartAddrInput(dsPhys.toString(16).toUpperCase()); }}
          className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold"
        >
          DS:SI ({dsPhys.toString(16).padStart(5, '0').toUpperCase()}H)
        </button>
        <button
          onClick={() => { setCurrentBaseAddr(ssPhys & ~0x0F); setStartAddrInput(ssPhys.toString(16).toUpperCase()); }}
          className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold"
        >
          SS:SP ({ssPhys.toString(16).padStart(5, '0').toUpperCase()}H)
        </button>
      </div>

      {/* Hex Grid Area */}
      <div className="flex-1 overflow-auto p-3">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 text-[10px] border-b border-[#1e293b]">
              <th className="pb-1 pr-3">OFFSET</th>
              {Array.from({ length: 16 }).map((_, i) => (
                <th key={i} className="pb-1 text-center font-bold">
                  {i.toString(16).toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => {
              const rowAddr = (currentBaseAddr + r * cols) & 0xFFFFF;
              const rowHex = rowAddr.toString(16).padStart(5, '0').toUpperCase();

              return (
                <tr key={r} className="hover:bg-[#0f172a] transition-colors">
                  <td className="py-1 pr-3 text-cyan-400 font-bold font-mono text-[11px]">{rowHex}</td>
                  {Array.from({ length: cols }).map((_, c) => {
                    const byteIdx = r * cols + c;
                    const byteVal = byteSlice[byteIdx] ?? 0;
                    const bytePhys = (rowAddr + c) & 0xFFFFF;
                    const isCSIP = bytePhys === csPhys;

                    return (
                      <td
                        key={c}
                        className={`py-1 text-center font-mono text-[11px] ${
                          isCSIP
                            ? 'bg-amber-950 text-amber-300 font-bold border border-amber-500 rounded'
                            : byteVal !== 0
                            ? 'text-white font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        {byteVal.toString(16).padStart(2, '0').toUpperCase()}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
