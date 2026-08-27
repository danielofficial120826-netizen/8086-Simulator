// 8086 CPU Simulator - Instruction Decoder & Micro-Op Generator
import { Instruction, MicroOp, Operand, CPUState, Register16, ALUOperation } from './types';
import { Registers } from './registers';
import { Flags } from './flags';
import { Memory } from './memory';
import { BIU } from './biu';
import { ALU } from './alu';

export class InstructionDecoder {
  public static generateMicroOps(
    inst: Instruction,
    registers: Registers,
    flags: Flags,
    memory: Memory,
    biu: BIU,
    labels: Record<string, number>,
    instructionIndex: number,
    instructions: Instruction[]
  ): { microOps: MicroOp[]; nextInstructionIndex: number } {
    const ops: MicroOp[] = [];
    let step = 1;
    let nextIndex = instructionIndex + 1;

    const addOp = (
      type: MicroOp['type'],
      description: string,
      sourceComponent?: string,
      targetComponent?: string,
      activeBus?: string,
      value?: number,
      width: 8 | 16 | 20 = 16,
      details?: Record<string, any>
    ) => {
      ops.push({
        id: `mop_${inst.id}_${step}`,
        stepNumber: step++,
        type,
        description,
        sourceComponent,
        targetComponent,
        activeBus,
        value,
        width,
        details,
        timestamp: Date.now(),
      });
    };

    const currentCS = registers.get16('CS');
    const currentIP = registers.get16('IP');

    // 1. INSTRUCTION START
    addOp(
      'INSTRUCTION_START',
      `Executing "${inst.rawText}" at CS:IP = ${currentCS.toString(16).padStart(4, '0').toUpperCase()}:${currentIP.toString(16).padStart(4, '0').toUpperCase()}H`,
      'EU',
      'BIU',
      undefined,
      currentIP,
      16
    );

    // 2. BIU ADDRESS CALCULATION
    const physCalc = biu.calculatePhysicalAddress('CS', currentCS, 'IP', currentIP);
    addOp(
      'BIU_ADDR_CALC',
      `BIU generates Physical Address: CS(${currentCS.toString(16).toUpperCase()}H) × 16 + IP(${currentIP.toString(16).toUpperCase()}H) = ${physCalc.physicalAddress.toString(16).toUpperCase()}H`,
      'Address Summer',
      'Bus Interface',
      'Address Bus (20-bit)',
      physCalc.physicalAddress,
      20,
      { segment: currentCS, offset: currentIP, physical: physCalc.physicalAddress }
    );

    // 3. FETCH & QUEUE OPERATIONS
    for (let b = 0; b < inst.size; b++) {
      const fetchAddr = (physCalc.physicalAddress + b) & 0xFFFFF;
      const byteVal = inst.bytes[b] ?? 0x90;
      addOp(
        'BUS_FETCH_REQ',
        `BIU fetches instruction byte [${b + 1}/${inst.size}] (${byteVal.toString(16).padStart(2, '0').toUpperCase()}H) from 20-bit bus at ${fetchAddr.toString(16).toUpperCase()}H`,
        'Bus Interface',
        'Memory',
        'System Bus (20-bit)',
        fetchAddr,
        20
      );

      addOp(
        'QUEUE_PUSH',
        `Byte ${byteVal.toString(16).padStart(2, '0').toUpperCase()}H enters 6-byte Prefetch Queue`,
        'Bus Interface',
        'Prefetch Queue',
        'BIU Internal Bus',
        byteVal,
        8,
        { byte: byteVal, slot: b }
      );
    }

    // 4. EU CONSUMES FROM QUEUE
    addOp(
      'QUEUE_POP',
      `EU consumes ${inst.size} opcode byte(s) from 6-byte Prefetch Queue`,
      'Prefetch Queue',
      'Instruction Decoder',
      'BIU->EU Bus',
      inst.bytes[0],
      8
    );

    // 5. DECODE
    addOp(
      'DECODE_START',
      `Decoder parses opcode: "${inst.mnemonic}" with ${inst.operands.length} operand(s)`,
      'Instruction Decoder',
      'Control Unit',
      'Control Bus',
      inst.bytes[0],
      8,
      { mnemonic: inst.mnemonic, operands: inst.operands.map(o => o.rawText) }
    );

    const alu = new ALU(flags);
    const m = inst.mnemonic;
    const op1 = inst.operands[0];
    const op2 = inst.operands[1];

    // Helper to resolve effective address of a memory operand
    const resolveMemAddr = (op: Operand): { seg: Register16; offset: number; phys: number } => {
      const segReg = op.segment || (op.baseReg === 'BP' ? 'SS' : 'DS');
      const segVal = registers.get16(segReg);
      let offset = op.displacement || 0;
      if (op.baseReg) offset += registers.get16(op.baseReg);
      if (op.indexReg) offset += registers.get16(op.indexReg);
      offset = offset & 0xFFFF;
      const phys = biu.calculatePhysicalAddress(segReg, segVal, op.baseReg || 'DISP', offset).physicalAddress;

      addOp(
        'BIU_ADDR_CALC',
        `Effective Address: ${segReg}:${offset.toString(16).toUpperCase()}H -> Physical Address ${phys.toString(16).toUpperCase()}H`,
        'Address Summer',
        'Memory',
        'Address Bus (20-bit)',
        phys,
        20
      );
      return { seg: segReg, offset, phys };
    };

    // Helper to read an operand value
    const readOperandVal = (op: Operand, defaultWidth: 8 | 16 = 16): number => {
      if (op.type === 'register' && op.reg) {
        const val = registers.get(op.reg);
        const w = registers.getWidth(op.reg);
        addOp(
          'REG_READ',
          `Read register ${op.reg} = ${val.toString(16).toUpperCase()}H (${val}) onto Internal Data Bus`,
          `Reg ${op.reg}`,
          'Internal Data Bus',
          'Internal Data Bus (16-bit)',
          val,
          w
        );
        return val;
      }
      if (op.type === 'immediate') {
        let val = op.value ?? 0;
        if (op.rawText && labels[op.rawText.toUpperCase()] !== undefined) {
          val = labels[op.rawText.toUpperCase()];
        }
        addOp(
          'REG_READ',
          `Immediate operand = ${val.toString(16).toUpperCase()}H (${val})`,
          'Instruction Decoder',
          'Internal Data Bus',
          'Internal Data Bus (16-bit)',
          val,
          op.width || defaultWidth
        );
        return val;
      }
      if (op.type === 'memory') {
        const ea = resolveMemAddr(op);
        const val = op.width === 8 ? memory.read8(ea.phys) : memory.read16(ea.phys);
        addOp(
          'MEM_READ',
          `Memory Read from [${ea.seg}:${ea.offset.toString(16).toUpperCase()}H] = ${val.toString(16).toUpperCase()}H`,
          'Memory',
          'Internal Data Bus',
          'Data Bus (16-bit)',
          val,
          op.width || defaultWidth
        );
        return val;
      }
      return 0;
    };

    // Instruction logic execution
    switch (m) {
      case 'MOV': {
        if (!op1 || !op2) break;
        const val2 = readOperandVal(op2, op1.width || 16);
        const width = op1.width || (op1.reg ? registers.getWidth(op1.reg) : 16);

        if (op1.type === 'register' && op1.reg) {
          addOp(
            'REG_WRITE',
            `Write ${val2.toString(16).toUpperCase()}H to ${op1.reg}`,
            'Internal Data Bus',
            `Reg ${op1.reg}`,
            'Internal Data Bus (16-bit)',
            val2,
            width
          );
        } else if (op1.type === 'memory') {
          const ea = resolveMemAddr(op1);
          addOp(
            'MEM_WRITE',
            `Write ${val2.toString(16).toUpperCase()}H to memory [${ea.seg}:${ea.offset.toString(16).toUpperCase()}H]`,
            'Internal Data Bus',
            'Memory',
            'Data Bus (16-bit)',
            val2,
            width
          );
        }
        break;
      }

      case 'XCHG': {
        if (!op1 || !op2 || !op1.reg || !op2.reg) break;
        const val1 = readOperandVal(op1);
        const val2 = readOperandVal(op2);
        addOp('REG_WRITE', `XCHG: write ${val2.toString(16).toUpperCase()}H to ${op1.reg}`, 'Internal Data Bus', `Reg ${op1.reg}`);
        addOp('REG_WRITE', `XCHG: write ${val1.toString(16).toUpperCase()}H to ${op2.reg}`, 'Internal Data Bus', `Reg ${op2.reg}`);
        break;
      }

      case 'ADD':
      case 'ADC':
      case 'SUB':
      case 'SBB':
      case 'CMP':
      case 'AND':
      case 'OR':
      case 'XOR':
      case 'TEST': {
        if (!op1 || !op2) break;
        const val1 = readOperandVal(op1);
        const val2 = readOperandVal(op2);
        const width = op1.width || (op1.reg ? registers.getWidth(op1.reg) : 16);

        addOp('ALU_INPUT_A', `ALU Input A <= ${val1.toString(16).toUpperCase()}H`, 'Internal Data Bus', 'ALU Input A', undefined, val1, width);
        addOp('ALU_INPUT_B', `ALU Input B <= ${val2.toString(16).toUpperCase()}H`, 'Internal Data Bus', 'ALU Input B', undefined, val2, width);
        addOp('ALU_EXEC', `ALU performs ${m} on A and B`, 'ALU', 'ALU Core', undefined, undefined, width, { op: m });

        const aluOp = m as ALUOperation;
        const res = alu.execute(aluOp, val1, val2, width);

        addOp('ALU_RESULT', `ALU Result = ${res.result.toString(16).toUpperCase()}H`, 'ALU Core', 'ALU Output Bus', 'ALU Output Bus', res.result, width);

        if (m !== 'CMP' && m !== 'TEST') {
          if (op1.type === 'register' && op1.reg) {
            addOp('REG_WRITE', `Write ALU Result ${res.result.toString(16).toUpperCase()}H to ${op1.reg}`, 'ALU Output Bus', `Reg ${op1.reg}`, 'Internal Data Bus (16-bit)', res.result, width);
          }
        }

        addOp('FLAG_UPDATE', `FLAGS updated: CF=${res.flags.CF ? 1 : 0} ZF=${res.flags.ZF ? 1 : 0} SF=${res.flags.SF ? 1 : 0} OF=${res.flags.OF ? 1 : 0} PF=${res.flags.PF ? 1 : 0} AF=${res.flags.AF ? 1 : 0}`, 'ALU', 'FLAGS Register', 'Control Bus', undefined, 16, { flags: res.flags });
        break;
      }

      case 'INC':
      case 'DEC':
      case 'NOT':
      case 'NEG': {
        if (!op1) break;
        const val1 = readOperandVal(op1);
        const width = op1.width || (op1.reg ? registers.getWidth(op1.reg) : 16);

        addOp('ALU_INPUT_A', `ALU Input A <= ${val1.toString(16).toUpperCase()}H`, 'Internal Data Bus', 'ALU Input A', undefined, val1, width);
        const aluOp = m as ALUOperation;
        const res = alu.execute(aluOp, val1, 0, width);
        addOp('ALU_RESULT', `ALU Result = ${res.result.toString(16).toUpperCase()}H`, 'ALU Core', 'ALU Output Bus', undefined, res.result, width);

        if (op1.type === 'register' && op1.reg) {
          addOp('REG_WRITE', `Write ${res.result.toString(16).toUpperCase()}H to ${op1.reg}`, 'ALU Output Bus', `Reg ${op1.reg}`, undefined, res.result, width);
        }

        if (m !== 'NOT') {
          addOp('FLAG_UPDATE', `FLAGS updated: ZF=${res.flags.ZF ? 1 : 0} SF=${res.flags.SF ? 1 : 0} OF=${res.flags.OF ? 1 : 0}`, 'ALU', 'FLAGS Register', undefined, undefined, 16, { flags: res.flags });
        }
        break;
      }

      case 'SHL':
      case 'SAL':
      case 'SHR':
      case 'SAR':
      case 'ROL':
      case 'ROR': {
        if (!op1) break;
        const val1 = readOperandVal(op1);
        const count = op2 ? readOperandVal(op2) : 1;
        const width = op1.width || (op1.reg ? registers.getWidth(op1.reg) : 16);
        const shiftOp = m === 'SAL' ? 'SHL' : (m as ALUOperation);

        addOp('ALU_INPUT_A', `ALU Input A <= ${val1.toString(16).toUpperCase()}H`, 'Internal Data Bus', 'ALU Input A', undefined, val1, width);
        addOp('ALU_INPUT_B', `Shift count <= ${count}`, 'Internal Data Bus', 'ALU Input B', undefined, count, 8);
        const res = alu.execute(shiftOp, val1, count, width);
        addOp('ALU_RESULT', `Shift Result = ${res.result.toString(16).toUpperCase()}H`, 'ALU Core', 'ALU Output Bus', undefined, res.result, width);

        if (op1.type === 'register' && op1.reg) {
          addOp('REG_WRITE', `Write ${res.result.toString(16).toUpperCase()}H to ${op1.reg}`, 'ALU Output Bus', `Reg ${op1.reg}`, undefined, res.result, width);
        }
        addOp('FLAG_UPDATE', `FLAGS updated: CF=${res.flags.CF ? 1 : 0} ZF=${res.flags.ZF ? 1 : 0}`, 'ALU', 'FLAGS Register');
        break;
      }

      case 'PUSH': {
        if (!op1) break;
        const val = readOperandVal(op1);
        const oldSP = registers.get16('SP');
        const newSP = (oldSP - 2) & 0xFFFF;
        addOp('REG_WRITE', `Decrement SP: ${oldSP.toString(16).toUpperCase()}H -> ${newSP.toString(16).toUpperCase()}H`, 'ALU', 'Reg SP', undefined, newSP, 16);
        const ss = registers.get16('SS');
        const stackPhys = biu.calculatePhysicalAddress('SS', ss, 'SP', newSP).physicalAddress;
        addOp('MEM_WRITE', `Push ${val.toString(16).toUpperCase()}H onto Stack at SS:SP (${stackPhys.toString(16).toUpperCase()}H)`, 'Internal Data Bus', 'Memory', 'Data Bus (16-bit)', val, 16);
        break;
      }

      case 'POP': {
        if (!op1 || !op1.reg) break;
        const currentSP = registers.get16('SP');
        const ss = registers.get16('SS');
        const stackPhys = biu.calculatePhysicalAddress('SS', ss, 'SP', currentSP).physicalAddress;
        const val = memory.read16(stackPhys);
        addOp('MEM_READ', `Pop ${val.toString(16).toUpperCase()}H from Stack at SS:SP (${stackPhys.toString(16).toUpperCase()}H)`, 'Memory', 'Internal Data Bus', 'Data Bus (16-bit)', val, 16);
        addOp('REG_WRITE', `Store popped value ${val.toString(16).toUpperCase()}H into ${op1.reg}`, 'Internal Data Bus', `Reg ${op1.reg}`, undefined, val, 16);
        const newSP = (currentSP + 2) & 0xFFFF;
        addOp('REG_WRITE', `Increment SP: ${currentSP.toString(16).toUpperCase()}H -> ${newSP.toString(16).toUpperCase()}H`, 'ALU', 'Reg SP', undefined, newSP, 16);
        break;
      }

      case 'JMP':
      case 'JE':
      case 'JZ':
      case 'JNE':
      case 'JNZ':
      case 'JC':
      case 'JB':
      case 'JNC':
      case 'JAE':
      case 'JS':
      case 'JNS':
      case 'LOOP': {
        let shouldJump = false;
        const fl = flags.getState();

        if (m === 'JMP') shouldJump = true;
        else if (m === 'JE' || m === 'JZ') shouldJump = fl.ZF;
        else if (m === 'JNE' || m === 'JNZ') shouldJump = !fl.ZF;
        else if (m === 'JC' || m === 'JB') shouldJump = fl.CF;
        else if (m === 'JNC' || m === 'JAE') shouldJump = !fl.CF;
        else if (m === 'JS') shouldJump = fl.SF;
        else if (m === 'JNS') shouldJump = !fl.SF;
        else if (m === 'LOOP') {
          const cx = (registers.get16('CX') - 1) & 0xFFFF;
          addOp('REG_WRITE', `LOOP: Decrement CX to ${cx.toString(16).toUpperCase()}H`, 'ALU', 'Reg CX', undefined, cx, 16);
          shouldJump = cx !== 0;
        }

        const targetLabel = op1?.rawText ? op1.rawText.toUpperCase() : '';
        const targetIndex = labels[targetLabel];

        if (shouldJump && targetIndex !== undefined) {
          nextIndex = targetIndex;
          const targetInst = instructions[targetIndex];
          const newTargetIP = targetInst?.address ?? (targetIndex * 2);
          addOp('CONTROL_SIGNAL', `Branch taken to label "${targetLabel}" (Instruction #${targetIndex})`, 'Control Unit', 'BIU', 'Control Bus');
          addOp('QUEUE_FLUSH', `Branch Taken: Flushing 6-byte Prefetch Queue`, 'Control Unit', 'Prefetch Queue');
          addOp('IP_ADVANCE', `Jump: Setting IP to ${newTargetIP.toString(16).padStart(4, '0').toUpperCase()}H`, 'Control Unit', 'Reg IP', undefined, newTargetIP, 16);
        } else {
          addOp('CONTROL_SIGNAL', `Branch not taken; execution continues sequentially`, 'Control Unit', 'BIU');
        }
        break;
      }

      case 'CALL': {
        const targetLabel = op1?.rawText ? op1.rawText.toUpperCase() : '';
        const targetIndex = labels[targetLabel];
        const returnIP = (currentIP + inst.size) & 0xFFFF;

        // Push return address
        const oldSP = registers.get16('SP');
        const newSP = (oldSP - 2) & 0xFFFF;
        addOp('REG_WRITE', `CALL: Decrement SP to ${newSP.toString(16).toUpperCase()}H`, 'ALU', 'Reg SP', undefined, newSP, 16);
        addOp('MEM_WRITE', `CALL: Push Return Address ${returnIP.toString(16).toUpperCase()}H onto Stack`, 'Internal Data Bus', 'Memory', undefined, returnIP, 16);

        if (targetIndex !== undefined) {
          nextIndex = targetIndex;
          const targetInst = instructions[targetIndex];
          const newTargetIP = targetInst?.address ?? (targetIndex * 2);
          addOp('QUEUE_FLUSH', `CALL: Flushing 6-byte Prefetch Queue`, 'Control Unit', 'Prefetch Queue');
          addOp('IP_ADVANCE', `CALL: Setting IP to subroutine ${newTargetIP.toString(16).toUpperCase()}H`, 'Control Unit', 'Reg IP', undefined, newTargetIP, 16);
        }
        break;
      }

      case 'RET': {
        const currentSP = registers.get16('SP');
        const ss = registers.get16('SS');
        const stackPhys = biu.calculatePhysicalAddress('SS', ss, 'SP', currentSP).physicalAddress;
        const returnIP = memory.read16(stackPhys);
        addOp('MEM_READ', `RET: Pop Return Address ${returnIP.toString(16).toUpperCase()}H from Stack`, 'Memory', 'Internal Data Bus', undefined, returnIP, 16);
        const newSP = (currentSP + 2) & 0xFFFF;
        addOp('REG_WRITE', `RET: Increment SP to ${newSP.toString(16).toUpperCase()}H`, 'ALU', 'Reg SP', undefined, newSP, 16);
        addOp('QUEUE_FLUSH', `RET: Flushing 6-byte Prefetch Queue`, 'Control Unit', 'Prefetch Queue');
        addOp('IP_ADVANCE', `RET: Restoring IP to ${returnIP.toString(16).toUpperCase()}H`, 'Internal Data Bus', 'Reg IP', undefined, returnIP, 16);

        // Find instruction corresponding to return address
        const foundIdx = instructions.findIndex(i => i.address === returnIP);
        if (foundIdx !== -1) {
          nextIndex = foundIdx;
        }
        break;
      }

      case 'CLC':
        addOp('FLAG_UPDATE', 'Clear Carry Flag (CF = 0)', 'Control Unit', 'FLAGS Register', undefined, 0, 16);
        break;
      case 'STC':
        addOp('FLAG_UPDATE', 'Set Carry Flag (CF = 1)', 'Control Unit', 'FLAGS Register', undefined, 1, 16);
        break;
      case 'CMC':
        addOp('FLAG_UPDATE', `Complement Carry Flag (CF = ${flags.get('CF') ? 0 : 1})`, 'Control Unit', 'FLAGS Register');
        break;
      case 'CLD':
        addOp('FLAG_UPDATE', 'Clear Direction Flag (DF = 0, auto-increment)', 'Control Unit', 'FLAGS Register');
        break;
      case 'STD':
        addOp('FLAG_UPDATE', 'Set Direction Flag (DF = 1, auto-decrement)', 'Control Unit', 'FLAGS Register');
        break;
      case 'CLI':
        addOp('FLAG_UPDATE', 'Clear Interrupt Flag (IF = 0, interrupts disabled)', 'Control Unit', 'FLAGS Register');
        break;
      case 'STI':
        addOp('FLAG_UPDATE', 'Set Interrupt Flag (IF = 1, interrupts enabled)', 'Control Unit', 'FLAGS Register');
        break;
      case 'NOP':
        addOp('CONTROL_SIGNAL', 'NOP (No Operation) - 3 clock cycles idle', 'Control Unit', 'EU');
        break;
      case 'HLT':
        addOp('CONTROL_SIGNAL', 'HLT: CPU halts until interrupt or reset', 'Control Unit', 'EU');
        break;
    }

    // IP advancement if no branch jump occurred
    if (nextIndex === instructionIndex + 1) {
      const advancedIP = (currentIP + inst.size) & 0xFFFF;
      addOp(
        'IP_ADVANCE',
        `Instruction Pointer IP advances by ${inst.size} byte(s) to ${advancedIP.toString(16).padStart(4, '0').toUpperCase()}H`,
        'Control Unit',
        'Reg IP',
        'Internal Bus',
        advancedIP,
        16
      );
    }

    // INSTRUCTION END
    addOp(
      'INSTRUCTION_END',
      `Instruction "${inst.mnemonic}" execution complete`,
      'EU',
      'BIU'
    );

    return { microOps: ops, nextInstructionIndex: nextIndex };
  }
}
