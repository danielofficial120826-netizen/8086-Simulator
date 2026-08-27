// Automated Unit Tests for 8086 CPU Simulator
import { describe, it, expect, beforeEach } from 'vitest';
import { CPU8086 } from '../simulator/cpu8086';
import { Registers } from '../simulator/registers';
import { Flags } from '../simulator/flags';
import { ALU } from '../simulator/alu';
import { Memory } from '../simulator/memory';
import { BIU, PrefetchQueue } from '../simulator/biu';
import { AssemblyParser } from '../simulator/parser';

describe('8086 Registers & Aliasing', () => {
  let regs: Registers;

  beforeEach(() => {
    regs = new Registers();
  });

  it('should get and set 16-bit registers properly', () => {
    regs.set16('AX', 0x1234);
    expect(regs.get16('AX')).toBe(0x1234);
    expect(regs.get8('AH')).toBe(0x12);
    expect(regs.get8('AL')).toBe(0x34);
  });

  it('should update 16-bit register when setting 8-bit high or low sub-registers', () => {
    regs.set16('BX', 0x0000);
    regs.set8('BH', 0xFE);
    regs.set8('BL', 0xCA);
    expect(regs.get16('BX')).toBe(0xFECA);

    regs.set8('BL', 0x00);
    expect(regs.get16('BX')).toBe(0xFE00);
  });
});

describe('8086 Flags Calculation', () => {
  let flags: Flags;

  beforeEach(() => {
    flags = new Flags();
  });

  it('should correctly set Zero, Sign, and Parity flags on addition', () => {
    const res = flags.updateAdd(0x0005, 0x0005, false, 16);
    expect(res).toBe(0x000A);
    expect(flags.get('ZF')).toBe(false);
    expect(flags.get('SF')).toBe(false);
    expect(flags.get('CF')).toBe(false);

    // Test zero flag
    const resZero = flags.updateSub(0x0010, 0x0010, false, 16);
    expect(resZero).toBe(0);
    expect(flags.get('ZF')).toBe(true);
    expect(flags.get('CF')).toBe(false);

    // Test carry / borrow
    const resBorrow = flags.updateSub(0x0005, 0x000A, false, 16);
    expect(flags.get('CF')).toBe(true);
    expect(flags.get('SF')).toBe(true);
  });

  it('should calculate correct Parity Flag for low 8-bits', () => {
    expect(Flags.calculateParity(0x0003)).toBe(true); // 2 ones -> even -> PF=1
    expect(Flags.calculateParity(0x0007)).toBe(false); // 3 ones -> odd -> PF=0
  });
});

describe('8086 ALU Operations', () => {
  let flags: Flags;
  let alu: ALU;

  beforeEach(() => {
    flags = new Flags();
    alu = new ALU(flags);
  });

  it('should perform ADD with correct carry and flags', () => {
    const res = alu.execute('ADD', 0xFFFF, 0x0001, 16);
    expect(res.result).toBe(0x0000);
    expect(res.flags.CF).toBe(true);
    expect(res.flags.ZF).toBe(true);
  });

  it('should perform bitwise AND / OR / XOR', () => {
    expect(alu.execute('AND', 0xFF00, 0x0FF0, 16).result).toBe(0x0F00);
    expect(alu.execute('OR', 0xAA00, 0x0055, 16).result).toBe(0xAA55);
    expect(alu.execute('XOR', 0xFFFF, 0x00FF, 16).result).toBe(0xFF00);
  });

  it('should perform SHL and SHR shifts', () => {
    const shlRes = alu.execute('SHL', 0x0001, 4, 16);
    expect(shlRes.result).toBe(0x0010);

    const shrRes = alu.execute('SHR', 0x0080, 3, 16);
    expect(shrRes.result).toBe(0x0010);
  });
});

describe('8086 Physical Address Generation & Memory', () => {
  it('should generate Segment * 16 + Offset correctly', () => {
    const phys = Memory.calculatePhysicalAddress(0x1234, 0x0100);
    expect(phys).toBe(0x12440);

    const phys2 = Memory.calculatePhysicalAddress(0x2000, 0x0124);
    expect(phys2).toBe(0x20124);
  });

  it('should read and write 8-bit and 16-bit values', () => {
    const mem = new Memory();
    mem.write16(0x20100, 0xBEEF);
    expect(mem.read16(0x20100)).toBe(0xBEEF);
    expect(mem.read8(0x20100)).toBe(0xEF); // little endian low byte
    expect(mem.read8(0x20101)).toBe(0xBE); // high byte
  });
});

describe('8086 Prefetch Queue', () => {
  it('should push, pop, and flush up to 6 bytes in FIFO order', () => {
    const q = new PrefetchQueue();
    expect(q.push(0xAA)).toBe(true);
    expect(q.push(0xBB)).toBe(true);
    expect(q.push(0xCC)).toBe(true);
    expect(q.count).toBe(3);

    expect(q.pop()).toBe(0xAA);
    expect(q.pop()).toBe(0xBB);
    expect(q.count).toBe(1);

    q.push(0xDD);
    q.push(0xEE);
    q.push(0xFF);
    q.push(0x11);
    q.push(0x22);
    expect(q.isFull).toBe(true);
    expect(q.push(0x33)).toBe(false); // Max capacity reached

    const dumped = q.flush();
    expect(dumped.length).toBe(6);
    expect(q.isEmpty).toBe(true);
  });
});

describe('8086 End-to-End Program Execution', () => {
  it('should execute MOV and ADD correctly', () => {
    const cpu = new CPU8086();
    const prog = `
      MOV AX, 1000H
      MOV BX, 0234H
      ADD AX, BX
    `;
    cpu.loadAssembly(prog);
    
    // Step first instruction (MOV AX, 1000H)
    cpu.stepInstruction();
    expect(cpu.registers.get16('AX')).toBe(0x1000);

    // Step second instruction (MOV BX, 0234H)
    cpu.stepInstruction();
    expect(cpu.registers.get16('BX')).toBe(0x0234);

    // Step third instruction (ADD AX, BX)
    cpu.stepInstruction();
    expect(cpu.registers.get16('AX')).toBe(0x1234);
  });

  it('should execute LOOP instruction correctly', () => {
    const cpu = new CPU8086();
    const prog = `
      MOV AX, 0000H
      MOV CX, 0003H
      MY_LOOP:
      ADD AX, 0005H
      LOOP MY_LOOP
    `;
    cpu.loadAssembly(prog);

    // Run until completion / HLT / finished
    let count = 0;
    while (cpu.getState().execution.status !== 'HALTED' && count < 50) {
      cpu.stepInstruction();
      count++;
    }

    expect(cpu.registers.get16('AX')).toBe(15); // 0 + 5 + 5 + 5
    expect(cpu.registers.get16('CX')).toBe(0);
  });
});
