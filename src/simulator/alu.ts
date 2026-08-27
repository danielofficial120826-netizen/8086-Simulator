// 8086 CPU Simulator - Arithmetic Logic Unit (ALU)
import { ALUOperation, FlagName, FlagsState } from './types';
import { Flags } from './flags';

export interface ALUResult {
  operation: ALUOperation;
  inputA: number;
  inputB: number;
  result: number;
  width: 8 | 16;
  flags: FlagsState;
  modifiedFlags: FlagName[];
}

export class ALU {
  private flags: Flags;

  constructor(flags: Flags) {
    this.flags = flags;
  }

  public execute(op: ALUOperation, a: number, b: number, width: 8 | 16 = 16): ALUResult {
    const mask = width === 8 ? 0xFF : 0xFFFF;
    const signMask = width === 8 ? 0x80 : 0x8000;
    const initialFlags = this.flags.getState();
    const inA = a & mask;
    const inB = b & mask;
    let res = 0;
    let modified: FlagName[] = [];

    switch (op) {
      case 'ADD': {
        res = this.flags.updateAdd(inA, inB, false, width);
        modified = ['CF', 'PF', 'AF', 'ZF', 'SF', 'OF'];
        break;
      }
      case 'ADC': {
        res = this.flags.updateAdd(inA, inB, initialFlags.CF, width);
        modified = ['CF', 'PF', 'AF', 'ZF', 'SF', 'OF'];
        break;
      }
      case 'SUB':
      case 'CMP': {
        res = this.flags.updateSub(inA, inB, false, width);
        modified = ['CF', 'PF', 'AF', 'ZF', 'SF', 'OF'];
        break;
      }
      case 'SBB': {
        res = this.flags.updateSub(inA, inB, initialFlags.CF, width);
        modified = ['CF', 'PF', 'AF', 'ZF', 'SF', 'OF'];
        break;
      }
      case 'INC': {
        res = this.flags.updateIncDec(inA, true, width);
        modified = ['PF', 'AF', 'ZF', 'SF', 'OF'];
        break;
      }
      case 'DEC': {
        res = this.flags.updateIncDec(inA, false, width);
        modified = ['PF', 'AF', 'ZF', 'SF', 'OF'];
        break;
      }
      case 'NEG': {
        // NEG is effectively 0 - inA
        res = this.flags.updateSub(0, inA, false, width);
        modified = ['CF', 'PF', 'AF', 'ZF', 'SF', 'OF'];
        break;
      }
      case 'AND':
      case 'TEST': {
        res = inA & inB;
        this.flags.updateLogical(res, width);
        modified = ['CF', 'PF', 'AF', 'ZF', 'SF', 'OF'];
        break;
      }
      case 'OR': {
        res = inA | inB;
        this.flags.updateLogical(res, width);
        modified = ['CF', 'PF', 'AF', 'ZF', 'SF', 'OF'];
        break;
      }
      case 'XOR': {
        res = inA ^ inB;
        this.flags.updateLogical(res, width);
        modified = ['CF', 'PF', 'AF', 'ZF', 'SF', 'OF'];
        break;
      }
      case 'NOT': {
        res = (~inA) & mask;
        // NOT does not affect any flags in 8086
        modified = [];
        break;
      }
      case 'SHL': {
        const count = inB & 0x1F;
        if (count > 0) {
          let temp = inA;
          let lastOut = 0;
          for (let i = 0; i < count; i++) {
            lastOut = (temp & signMask) !== 0 ? 1 : 0;
            temp = (temp << 1) & mask;
          }
          res = temp;
          this.flags.set('CF', lastOut === 1);
          this.flags.set('ZF', res === 0);
          this.flags.set('SF', (res & signMask) !== 0);
          this.flags.set('PF', Flags.calculateParity(res));
          if (count === 1) {
            // OF is high if high bit changed
            const signBit = (res & signMask) !== 0;
            this.flags.set('OF', signBit !== (lastOut === 1));
          }
          modified = ['CF', 'PF', 'ZF', 'SF', 'OF'];
        } else {
          res = inA;
        }
        break;
      }
      case 'SHR': {
        const count = inB & 0x1F;
        if (count > 0) {
          let temp = inA;
          let lastOut = 0;
          for (let i = 0; i < count; i++) {
            lastOut = temp & 1;
            temp = temp >> 1;
          }
          res = temp & mask;
          this.flags.set('CF', lastOut === 1);
          this.flags.set('ZF', res === 0);
          this.flags.set('SF', (res & signMask) !== 0);
          this.flags.set('PF', Flags.calculateParity(res));
          if (count === 1) {
            this.flags.set('OF', (inA & signMask) !== 0);
          }
          modified = ['CF', 'PF', 'ZF', 'SF', 'OF'];
        } else {
          res = inA;
        }
        break;
      }
      case 'SAR': {
        const count = inB & 0x1F;
        if (count > 0) {
          let temp = inA;
          let lastOut = 0;
          const signVal = (inA & signMask) !== 0;
          for (let i = 0; i < count; i++) {
            lastOut = temp & 1;
            temp = (temp >> 1) | (signVal ? signMask : 0);
          }
          res = temp & mask;
          this.flags.set('CF', lastOut === 1);
          this.flags.set('ZF', res === 0);
          this.flags.set('SF', (res & signMask) !== 0);
          this.flags.set('PF', Flags.calculateParity(res));
          if (count === 1) {
            this.flags.set('OF', false);
          }
          modified = ['CF', 'PF', 'ZF', 'SF', 'OF'];
        } else {
          res = inA;
        }
        break;
      }
      case 'ROL': {
        const count = inB & (width === 8 ? 0x07 : 0x0F);
        let temp = inA;
        const topBitShift = width === 8 ? 7 : 15;
        for (let i = 0; i < count; i++) {
          const bit = (temp >> topBitShift) & 1;
          temp = ((temp << 1) | bit) & mask;
          this.flags.set('CF', bit === 1);
        }
        res = temp;
        if (count === 1) {
          const topBit = (res >> topBitShift) & 1;
          this.flags.set('OF', topBit !== (this.flags.get('CF') ? 1 : 0));
        }
        modified = ['CF', 'OF'];
        break;
      }
      case 'ROR': {
        const count = inB & (width === 8 ? 0x07 : 0x0F);
        let temp = inA;
        const topBitShift = width === 8 ? 7 : 15;
        for (let i = 0; i < count; i++) {
          const bit = temp & 1;
          temp = (temp >> 1) | (bit << topBitShift);
          this.flags.set('CF', bit === 1);
        }
        res = temp & mask;
        if (count === 1) {
          const bit1 = (res >> topBitShift) & 1;
          const bit2 = (res >> (topBitShift - 1)) & 1;
          this.flags.set('OF', bit1 !== bit2);
        }
        modified = ['CF', 'OF'];
        break;
      }
      case 'PASS_A': {
        res = inA;
        break;
      }
      case 'PASS_B': {
        res = inB;
        break;
      }
      default:
        res = inA;
    }

    return {
      operation: op,
      inputA: inA,
      inputB: inB,
      result: res & mask,
      width,
      flags: this.flags.getState(),
      modifiedFlags: modified,
    };
  }
}
