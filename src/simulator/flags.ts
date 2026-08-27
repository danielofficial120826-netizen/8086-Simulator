// 8086 CPU Simulator - FLAGS Register & Computations
import { FlagsState, FlagName } from './types';

export class Flags {
  private flags: FlagsState = {
    CF: false, // Bit 0
    PF: false, // Bit 2
    AF: false, // Bit 4
    ZF: false, // Bit 6
    SF: false, // Bit 7
    TF: false, // Bit 8
    IF: true,  // Bit 9 (Enabled by default)
    DF: false, // Bit 10
    OF: false, // Bit 11
  };

  constructor(initial?: Partial<FlagsState>) {
    if (initial) {
      this.flags = { ...this.flags, ...initial };
    }
  }

  public reset(custom?: Partial<FlagsState>): void {
    this.flags = {
      CF: false,
      PF: false,
      AF: false,
      ZF: false,
      SF: false,
      TF: false,
      IF: true,
      DF: false,
      OF: false,
      ...custom,
    };
  }

  public get(name: FlagName): boolean {
    return this.flags[name];
  }

  public set(name: FlagName, value: boolean): void {
    this.flags[name] = value;
  }

  public getState(): FlagsState {
    return { ...this.flags };
  }

  public asWord(): number {
    let word = 0x0002; // Bit 1 is always 1 in 8086
    if (this.flags.CF) word |= 1 << 0;
    if (this.flags.PF) word |= 1 << 2;
    if (this.flags.AF) word |= 1 << 4;
    if (this.flags.ZF) word |= 1 << 6;
    if (this.flags.SF) word |= 1 << 7;
    if (this.flags.TF) word |= 1 << 8;
    if (this.flags.IF) word |= 1 << 9;
    if (this.flags.DF) word |= 1 << 10;
    if (this.flags.OF) word |= 1 << 11;
    return word;
  }

  public fromWord(word: number): void {
    this.flags.CF = (word & (1 << 0)) !== 0;
    this.flags.PF = (word & (1 << 2)) !== 0;
    this.flags.AF = (word & (1 << 4)) !== 0;
    this.flags.ZF = (word & (1 << 6)) !== 0;
    this.flags.SF = (word & (1 << 7)) !== 0;
    this.flags.TF = (word & (1 << 8)) !== 0;
    this.flags.IF = (word & (1 << 9)) !== 0;
    this.flags.DF = (word & (1 << 10)) !== 0;
    this.flags.OF = (word & (1 << 11)) !== 0;
  }

  // Calculate 8086 parity flag: True if low 8-bits of result has even number of 1 bits
  public static calculateParity(value: number): boolean {
    let low8 = value & 0xFF;
    let count = 0;
    while (low8 > 0) {
      if (low8 & 1) count++;
      low8 >>= 1;
    }
    return count % 2 === 0;
  }

  // Update standard logical flags (AND, OR, XOR, TEST)
  public updateLogical(result: number, width: 8 | 16): void {
    const mask = width === 8 ? 0xFF : 0xFFFF;
    const signMask = width === 8 ? 0x80 : 0x8000;
    const res = result & mask;

    this.flags.CF = false;
    this.flags.OF = false;
    this.flags.AF = false; // Undefined in real 8086, set false
    this.flags.ZF = res === 0;
    this.flags.SF = (res & signMask) !== 0;
    this.flags.PF = Flags.calculateParity(res);
  }

  // Update flags for ADD / ADC
  public updateAdd(a: number, b: number, carryIn: boolean, width: 8 | 16): number {
    const mask = width === 8 ? 0xFF : 0xFFFF;
    const signMask = width === 8 ? 0x80 : 0x8000;
    const maxVal = width === 8 ? 0x100 : 0x10000;
    const cIn = carryIn ? 1 : 0;

    const raw = a + b + cIn;
    const result = raw & mask;

    this.flags.CF = raw >= maxVal;
    this.flags.ZF = result === 0;
    this.flags.SF = (result & signMask) !== 0;
    this.flags.PF = Flags.calculateParity(result);
    // AF: half-carry from bit 3 to 4
    this.flags.AF = ((a & 0x0F) + (b & 0x0F) + cIn) > 0x0F;
    // OF: overflow in signed arithmetic
    const signA = (a & signMask) !== 0;
    const signB = (b & signMask) !== 0;
    const signRes = (result & signMask) !== 0;
    this.flags.OF = (signA === signB) && (signA !== signRes);

    return result;
  }

  // Update flags for SUB / SBB / CMP
  public updateSub(a: number, b: number, borrowIn: boolean, width: 8 | 16): number {
    const mask = width === 8 ? 0xFF : 0xFFFF;
    const signMask = width === 8 ? 0x80 : 0x8000;
    const bIn = borrowIn ? 1 : 0;

    const raw = a - b - bIn;
    const result = raw & mask;

    this.flags.CF = raw < 0;
    this.flags.ZF = result === 0;
    this.flags.SF = (result & signMask) !== 0;
    this.flags.PF = Flags.calculateParity(result);
    // AF: borrow from bit 4
    this.flags.AF = ((a & 0x0F) - (b & 0x0F) - bIn) < 0;
    // OF: signed overflow
    const signA = (a & signMask) !== 0;
    const signB = (b & signMask) !== 0;
    const signRes = (result & signMask) !== 0;
    this.flags.OF = (signA !== signB) && (signA !== signRes);

    return result;
  }

  // Update flags for INC / DEC (does NOT affect CF in 8086!)
  public updateIncDec(original: number, isInc: boolean, width: 8 | 16): number {
    const mask = width === 8 ? 0xFF : 0xFFFF;
    const signMask = width === 8 ? 0x80 : 0x8000;
    const result = (isInc ? original + 1 : original - 1) & mask;

    this.flags.ZF = result === 0;
    this.flags.SF = (result & signMask) !== 0;
    this.flags.PF = Flags.calculateParity(result);

    if (isInc) {
      this.flags.AF = (original & 0x0F) === 0x0F;
      this.flags.OF = original === (width === 8 ? 0x7F : 0x7FFF);
    } else {
      this.flags.AF = (original & 0x0F) === 0x00;
      this.flags.OF = original === (width === 8 ? 0x80 : 0x8000);
    }

    return result;
  }
}
