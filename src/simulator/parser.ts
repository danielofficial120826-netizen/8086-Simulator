// 8086 CPU Simulator - Assembly Parser & Tokenizer
import { Instruction, Operand, AnyRegister, Register16, Register8 } from './types';

export interface ParseResult {
  instructions: Instruction[];
  errors: Array<{ line: number; message: string }>;
  labels: Record<string, number>; // label -> instruction index
}

const REGISTERS_16: Register16[] = ['AX', 'BX', 'CX', 'DX', 'SP', 'BP', 'SI', 'DI', 'CS', 'DS', 'SS', 'ES', 'IP'];
const REGISTERS_8: Register8[] = ['AL', 'AH', 'BL', 'BH', 'CL', 'CH', 'DL', 'DH'];

export class AssemblyParser {
  public static parse(sourceCode: string): ParseResult {
    const lines = sourceCode.split('\n');
    const instructions: Instruction[] = [];
    const errors: Array<{ line: number; message: string }> = [];
    const labels: Record<string, number> = {};

    let currentOrg = 0x0000;
    let instructionIndex = 0;

    // Pass 1: Parse instructions and find label positions
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      let rawLine = lines[i].trim();

      // Strip comments (';' or '//')
      const commentIdx = rawLine.search(/;|\/\//);
      let comment = '';
      if (commentIdx !== -1) {
        comment = rawLine.substring(commentIdx + 1).trim();
        rawLine = rawLine.substring(0, commentIdx).trim();
      }

      if (!rawLine) continue; // empty line

      // Handle label at start of line: "LABEL:" or "LABEL: MOV AX, 1"
      const labelMatch = rawLine.match(/^([A-Za-z_][A-Za-z0-9_]*):(.*)$/);
      if (labelMatch) {
        const labelName = labelMatch[1].toUpperCase();
        labels[labelName] = instructionIndex;
        rawLine = labelMatch[2].trim();
        if (!rawLine) continue; // Label-only line
      }

      // Check for directives like ORG
      const orgMatch = rawLine.match(/^ORG\s+([0-9A-Fa-f]+[Hh]?|0x[0-9A-Fa-f]+|\d+)$/i);
      if (orgMatch) {
        currentOrg = this.parseNumber(orgMatch[1]);
        continue;
      }

      // Parse mnemonic and operands
      const parts = rawLine.split(/\s+(.+)/);
      const mnemonic = parts[0].toUpperCase();
      const operandStr = parts[1] ? parts[1].trim() : '';

      try {
        const operands = this.parseOperandList(operandStr);
        const estimatedSize = this.estimateInstructionSize(mnemonic, operands);
        const bytes = this.generateDummyBytes(mnemonic, operands, estimatedSize);

        const inst: Instruction = {
          id: `inst_${instructionIndex}`,
          line: lineNum,
          mnemonic,
          operands,
          bytes,
          size: estimatedSize,
          rawText: rawLine,
          comment,
          address: currentOrg,
        };

        instructions.push(inst);
        currentOrg += estimatedSize;
        instructionIndex++;
      } catch (err: any) {
        errors.push({ line: lineNum, message: err.message || 'Syntax error' });
      }
    }

    return { instructions, errors, labels };
  }

  private static parseOperandList(operandStr: string): Operand[] {
    if (!operandStr) return [];
    
    // Split by comma outside brackets
    const tokens: string[] = [];
    let current = '';
    let inBracket = false;

    for (let i = 0; i < operandStr.length; i++) {
      const char = operandStr[i];
      if (char === '[') inBracket = true;
      if (char === ']') inBracket = false;

      if (char === ',' && !inBracket) {
        tokens.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) tokens.push(current.trim());

    return tokens.map(t => this.parseSingleOperand(t));
  }

  public static parseSingleOperand(text: string): Operand {
    const raw = text.trim();
    const upper = raw.toUpperCase();

    // 1. Check Register
    if (REGISTERS_16.includes(upper as Register16)) {
      return {
        type: 'register',
        reg: upper as Register16,
        width: 16,
        rawText: raw,
      };
    }
    if (REGISTERS_8.includes(upper as Register8)) {
      return {
        type: 'register',
        reg: upper as Register8,
        width: 8,
        rawText: raw,
      };
    }

    // 2. Check Memory Expression: [BX], [SI], [BX+SI], [BX+10H], DS:[SI], [1234H]
    const memMatch = raw.match(/^(?:([A-Za-z]{2}):\s*)?\[(.*)\]$/);
    if (memMatch) {
      const segOverride = memMatch[1] ? (memMatch[1].toUpperCase() as Register16) : undefined;
      const inside = memMatch[2].trim().toUpperCase();
      return this.parseMemoryInside(inside, segOverride, raw);
    }

    // 3. Check Immediate / Label
    // Character literal 'A'
    if (raw.startsWith("'") && raw.endsWith("'") && raw.length === 3) {
      return {
        type: 'immediate',
        value: raw.charCodeAt(1),
        width: 8,
        rawText: raw,
      };
    }

    // Number
    const num = this.tryParseNumber(raw);
    if (num !== null) {
      return {
        type: 'immediate',
        value: num,
        width: num > 0xFF ? 16 : 8,
        rawText: raw,
      };
    }

    // Label / Identifier
    return {
      type: 'immediate',
      rawText: raw, // Label name to be resolved
      width: 16,
    };
  }

  private static parseMemoryInside(inside: string, segOverride?: Register16, rawText = ''): Operand {
    // Examples: "BX", "BX+SI", "BP+DI+4", "1000H", "SI+04H"
    const parts = inside.split('+').map(p => p.trim());
    let baseReg: Register16 | undefined;
    let indexReg: Register16 | undefined;
    let disp = 0;

    for (const p of parts) {
      if (['BX', 'BP'].includes(p)) {
        baseReg = p as Register16;
      } else if (['SI', 'DI'].includes(p)) {
        indexReg = p as Register16;
      } else {
        const num = this.tryParseNumber(p);
        if (num !== null) {
          disp += num;
        }
      }
    }

    // Default segment: BP uses SS, all other data memory uses DS
    const defaultSeg: Register16 = baseReg === 'BP' ? 'SS' : 'DS';

    return {
      type: 'memory',
      segment: segOverride || defaultSeg,
      baseReg,
      indexReg,
      displacement: disp,
      width: 16, // Default word unless specified
      rawText,
    };
  }

  public static tryParseNumber(text: string): number | null {
    try {
      return this.parseNumber(text);
    } catch {
      return null;
    }
  }

  public static parseNumber(text: string): number {
    const t = text.trim();
    if (!t) throw new Error('Empty numeric token');

    // Hex format: 1234H, 0FFFFh
    if (/^[0-9A-Fa-f]+[Hh]$/.test(t)) {
      return parseInt(t.slice(0, -1), 16);
    }
    // C-style Hex: 0x1234
    if (/^0x[0-9A-Fa-f]+$/i.test(t)) {
      return parseInt(t.slice(2), 16);
    }
    // Binary: 10110011B, 0b1011
    if (/^[01]+[Bb]$/.test(t)) {
      return parseInt(t.slice(0, -1), 2);
    }
    if (/^0b[01]+$/i.test(t)) {
      return parseInt(t.slice(2), 2);
    }
    // Decimal: 123, -5
    if (/^-?\d+$/.test(t)) {
      return parseInt(t, 10);
    }

    throw new Error(`Invalid number format: "${text}"`);
  }

  private static estimateInstructionSize(mnemonic: string, operands: Operand[]): number {
    switch (mnemonic) {
      case 'NOP':
      case 'HLT':
      case 'CLC':
      case 'STC':
      case 'CMC':
      case 'CLD':
      case 'STD':
      case 'CLI':
      case 'STI':
      case 'RET':
        return 1;
      case 'INC':
      case 'DEC':
      case 'PUSH':
      case 'POP':
        return operands.length === 1 && operands[0].type === 'register' && operands[0].width === 16 ? 1 : 2;
      case 'JMP':
      case 'CALL':
      case 'JE':
      case 'JZ':
      case 'JNE':
      case 'JNZ':
      case 'JC':
      case 'JNC':
      case 'JS':
      case 'JNS':
      case 'LOOP':
        return 2; // short relative jump
      case 'MOV':
        if (operands[1]?.type === 'immediate') {
          return operands[0]?.width === 16 ? 3 : 2;
        }
        return 2;
      case 'ADD':
      case 'SUB':
      case 'CMP':
      case 'AND':
      case 'OR':
      case 'XOR':
        if (operands[1]?.type === 'immediate') {
          return operands[0]?.width === 16 ? 3 : 2;
        }
        return 2;
      default:
        return 2;
    }
  }

  private static generateDummyBytes(mnemonic: string, operands: Operand[], size: number): number[] {
    const opcodeMap: Record<string, number> = {
      NOP: 0x90,
      HLT: 0xF4,
      MOV: 0x89,
      ADD: 0x01,
      SUB: 0x29,
      CMP: 0x39,
      AND: 0x21,
      OR: 0x09,
      XOR: 0x31,
      INC: 0x40,
      DEC: 0x48,
      PUSH: 0x50,
      POP: 0x58,
      JMP: 0xEB,
      JE: 0x74,
      JZ: 0x74,
      JNE: 0x75,
      JNZ: 0x75,
      JC: 0x72,
      JNC: 0x73,
      LOOP: 0xE2,
      CALL: 0xE8,
      RET: 0xC3,
    };

    const first = opcodeMap[mnemonic] || 0x90;
    const bytes = [first];
    for (let i = 1; i < size; i++) {
      if (operands[1]?.type === 'immediate' && operands[1].value !== undefined) {
        if (i === 1) bytes.push(operands[1].value & 0xFF);
        if (i === 2) bytes.push((operands[1].value >> 8) & 0xFF);
      } else {
        bytes.push(0x00 + i);
      }
    }
    return bytes;
  }
}
