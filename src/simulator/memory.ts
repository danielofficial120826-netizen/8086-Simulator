// 8086 CPU Simulator - 1MB Segmented Memory System
import { MemoryAccess } from './types';

export class Memory {
  // 1 Megabyte address space: 2^20 bytes = 1,048,576 bytes
  private bytes: Uint8Array = new Uint8Array(1024 * 1024);
  private accessLog: MemoryAccess[] = [];
  private currentCycle = 0;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.bytes.fill(0);
    this.accessLog = [];
    this.currentCycle = 0;
  }

  public setCycle(cycle: number): void {
    this.currentCycle = cycle;
  }

  // Calculate 20-bit physical address: (Segment * 16) + Offset
  public static calculatePhysicalAddress(segment: number, offset: number): number {
    return ((segment & 0xFFFF) << 4) + (offset & 0xFFFF) & 0xFFFFF;
  }

  public read8(physicalAddress: number, isFetch = false): number {
    const addr = physicalAddress & 0xFFFFF;
    const value = this.bytes[addr];
    this.accessLog.push({
      address: addr,
      type: isFetch ? 'fetch' : 'read',
      value,
      width: 8,
      cycle: this.currentCycle,
    });
    return value;
  }

  public read16(physicalAddress: number): number {
    const addr = physicalAddress & 0xFFFFF;
    const low = this.bytes[addr];
    const high = this.bytes[(addr + 1) & 0xFFFFF];
    const value = (high << 8) | low;
    this.accessLog.push({
      address: addr,
      type: 'read',
      value,
      width: 16,
      cycle: this.currentCycle,
    });
    return value;
  }

  public write8(physicalAddress: number, value: number): void {
    const addr = physicalAddress & 0xFFFFF;
    const val = value & 0xFF;
    this.bytes[addr] = val;
    this.accessLog.push({
      address: addr,
      type: 'write',
      value: val,
      width: 8,
      cycle: this.currentCycle,
    });
  }

  public write16(physicalAddress: number, value: number): void {
    const addr = physicalAddress & 0xFFFFF;
    const low = value & 0xFF;
    const high = (value >> 8) & 0xFF;
    this.bytes[addr] = low;
    this.bytes[(addr + 1) & 0xFFFFF] = high;
    this.accessLog.push({
      address: addr,
      type: 'write',
      value: value & 0xFFFF,
      width: 16,
      cycle: this.currentCycle,
    });
  }

  public loadProgramBytes(startPhysicalAddress: number, bytes: number[]): void {
    let addr = startPhysicalAddress & 0xFFFFF;
    for (const b of bytes) {
      this.bytes[addr] = b & 0xFF;
      addr = (addr + 1) & 0xFFFFF;
    }
  }

  public getByteSlice(physicalAddress: number, count: number): number[] {
    const slice: number[] = [];
    let addr = physicalAddress & 0xFFFFF;
    for (let i = 0; i < count; i++) {
      slice.push(this.bytes[addr]);
      addr = (addr + 1) & 0xFFFFF;
    }
    return slice;
  }

  public getAccessLog(): MemoryAccess[] {
    return [...this.accessLog];
  }

  public clearAccessLog(): void {
    this.accessLog = [];
  }
}
