// 8086 CPU Simulator - Bus Interface Unit (BIU) & Prefetch Queue
import { Register16, MicroOp } from './types';
import { Memory } from './memory';

export interface AddressCalculationResult {
  segmentReg: Register16;
  segmentValue: number;
  offsetReg: Register16 | 'DISP' | 'IMMEDIATE';
  offsetValue: number;
  shiftResult: number; // Seg * 16
  physicalAddress: number; // (Seg * 16) + Offset
}

export class PrefetchQueue {
  private queue: number[] = [];
  public static readonly MAX_CAPACITY = 6;

  public reset(): void {
    this.queue = [];
  }

  public push(byte: number): boolean {
    if (this.queue.length >= PrefetchQueue.MAX_CAPACITY) {
      return false; // Queue full
    }
    this.queue.push(byte & 0xFF);
    return true;
  }

  public pop(): number | undefined {
    return this.queue.shift();
  }

  public peek(): number | undefined {
    return this.queue[0];
  }

  public flush(): number[] {
    const dumped = [...this.queue];
    this.queue = [];
    return dumped;
  }

  public getBytes(): number[] {
    return [...this.queue];
  }

  public get count(): number {
    return this.queue.length;
  }

  public get isFull(): boolean {
    return this.queue.length >= PrefetchQueue.MAX_CAPACITY;
  }

  public get isEmpty(): boolean {
    return this.queue.length === 0;
  }
}

export class BIU {
  public queue: PrefetchQueue;
  private memory: Memory;

  // Active address calculation state for visualization
  public currentCalc: AddressCalculationResult = {
    segmentReg: 'CS',
    segmentValue: 0x1000,
    offsetReg: 'IP',
    offsetValue: 0x0000,
    shiftResult: 0x10000,
    physicalAddress: 0x10000,
  };

  constructor(memory: Memory) {
    this.memory = memory;
    this.queue = new PrefetchQueue();
  }

  public reset(): void {
    this.queue.reset();
    this.currentCalc = {
      segmentReg: 'CS',
      segmentValue: 0x1000,
      offsetReg: 'IP',
      offsetValue: 0x0000,
      shiftResult: 0x10000,
      physicalAddress: 0x10000,
    };
  }

  public calculatePhysicalAddress(
    segReg: Register16,
    segVal: number,
    offsetReg: Register16 | 'DISP' | 'IMMEDIATE',
    offsetVal: number
  ): AddressCalculationResult {
    const shift = (segVal & 0xFFFF) << 4;
    const phys = (shift + (offsetVal & 0xFFFF)) & 0xFFFFF;
    this.currentCalc = {
      segmentReg: segReg,
      segmentValue: segVal & 0xFFFF,
      offsetReg: offsetReg,
      offsetValue: offsetVal & 0xFFFF,
      shiftResult: shift,
      physicalAddress: phys,
    };
    return this.currentCalc;
  }

  public fetchNextByte(cs: number, ip: number): { byte: number; physAddr: number } {
    const calc = this.calculatePhysicalAddress('CS', cs, 'IP', ip);
    const byte = this.memory.read8(calc.physicalAddress, true);
    return { byte, physAddr: calc.physicalAddress };
  }
}
