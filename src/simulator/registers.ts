// 8086 CPU Simulator - Registers Management
import { Register16, Register8, AnyRegister, CPUState } from './types';

export class Registers {
  private values: Record<Register16, number> = {
    AX: 0x0000,
    BX: 0x0000,
    CX: 0x0000,
    DX: 0x0000,
    SP: 0xFFFE, // Stack top in SS
    BP: 0x0000,
    SI: 0x0000,
    DI: 0x0000,
    CS: 0x1000, // Default code segment 0x1000
    DS: 0x2000, // Default data segment 0x2000
    SS: 0x3000, // Default stack segment 0x3000
    ES: 0x4000, // Default extra segment 0x4000
    IP: 0x0000, // Instruction pointer
  };

  constructor(initialValues?: Partial<Record<Register16, number>>) {
    if (initialValues) {
      this.reset(initialValues);
    }
  }

  public reset(customValues?: Partial<Record<Register16, number>>): void {
    this.values = {
      AX: 0x0000,
      BX: 0x0000,
      CX: 0x0000,
      DX: 0x0000,
      SP: 0xFFFE,
      BP: 0x0000,
      SI: 0x0000,
      DI: 0x0000,
      CS: 0x1000,
      DS: 0x2000,
      SS: 0x3000,
      ES: 0x4000,
      IP: 0x0000,
      ...customValues,
    };
  }

  public get16(reg: Register16): number {
    return this.values[reg] & 0xFFFF;
  }

  public set16(reg: Register16, value: number): { oldValue: number; newValue: number; changedBits: number } {
    const oldValue = this.values[reg] & 0xFFFF;
    const newValue = value & 0xFFFF;
    this.values[reg] = newValue;
    return {
      oldValue,
      newValue,
      changedBits: oldValue ^ newValue,
    };
  }

  public get8(reg: Register8): number {
    switch (reg) {
      case 'AL': return this.values.AX & 0xFF;
      case 'AH': return (this.values.AX >> 8) & 0xFF;
      case 'BL': return this.values.BX & 0xFF;
      case 'BH': return (this.values.BX >> 8) & 0xFF;
      case 'CL': return this.values.CX & 0xFF;
      case 'CH': return (this.values.CX >> 8) & 0xFF;
      case 'DL': return this.values.DX & 0xFF;
      case 'DH': return (this.values.DX >> 8) & 0xFF;
    }
  }

  public set8(reg: Register8, value: number): { oldValue: number; newValue: number; parentReg: Register16 } {
    const v = value & 0xFF;
    let parentReg: Register16 = 'AX';
    let oldValue = 0;
    
    switch (reg) {
      case 'AL':
        parentReg = 'AX';
        oldValue = this.values.AX & 0xFF;
        this.values.AX = (this.values.AX & 0xFF00) | v;
        break;
      case 'AH':
        parentReg = 'AX';
        oldValue = (this.values.AX >> 8) & 0xFF;
        this.values.AX = (this.values.AX & 0x00FF) | (v << 8);
        break;
      case 'BL':
        parentReg = 'BX';
        oldValue = this.values.BX & 0xFF;
        this.values.BX = (this.values.BX & 0xFF00) | v;
        break;
      case 'BH':
        parentReg = 'BX';
        oldValue = (this.values.BX >> 8) & 0xFF;
        this.values.BX = (this.values.BX & 0x00FF) | (v << 8);
        break;
      case 'CL':
        parentReg = 'CX';
        oldValue = this.values.CX & 0xFF;
        this.values.CX = (this.values.CX & 0xFF00) | v;
        break;
      case 'CH':
        parentReg = 'CX';
        oldValue = (this.values.CX >> 8) & 0xFF;
        this.values.CX = (this.values.CX & 0x00FF) | (v << 8);
        break;
      case 'DL':
        parentReg = 'DX';
        oldValue = this.values.DX & 0xFF;
        this.values.DX = (this.values.DX & 0xFF00) | v;
        break;
      case 'DH':
        parentReg = 'DX';
        oldValue = (this.values.DX >> 8) & 0xFF;
        this.values.DX = (this.values.DX & 0x00FF) | (v << 8);
        break;
    }

    return { oldValue, newValue: v, parentReg };
  }

  public get(reg: AnyRegister): number {
    if (this.is8Bit(reg)) {
      return this.get8(reg as Register8);
    }
    return this.get16(reg as Register16);
  }

  public set(reg: AnyRegister, value: number) {
    if (this.is8Bit(reg)) {
      return this.set8(reg as Register8, value);
    }
    return this.set16(reg as Register16, value);
  }

  public is8Bit(reg: string): reg is Register8 {
    return ['AL', 'AH', 'BL', 'BH', 'CL', 'CH', 'DL', 'DH'].includes(reg);
  }

  public is16Bit(reg: string): reg is Register16 {
    return ['AX', 'BX', 'CX', 'DX', 'SP', 'BP', 'SI', 'DI', 'CS', 'DS', 'SS', 'ES', 'IP'].includes(reg);
  }

  public getWidth(reg: AnyRegister): 8 | 16 {
    return this.is8Bit(reg) ? 8 : 16;
  }

  public getState(): CPUState['registers'] {
    return { ...this.values };
  }
}
