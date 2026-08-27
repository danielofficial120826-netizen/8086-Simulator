// 8086 CPU Simulator - Core Engine & State Machine
import { CPUState, Instruction, MicroOp, Register16, ALUOperation } from './types';
import { Registers } from './registers';
import { Flags } from './flags';
import { Memory } from './memory';
import { BIU } from './biu';
import { ALU } from './alu';
import { AssemblyParser, ParseResult } from './parser';
import { InstructionDecoder } from './decoder';

export type SimulationEventListener = (event: MicroOp, cpuState: CPUState) => void;

export class CPU8086 {
  public registers: Registers;
  public flags: Flags;
  public memory: Memory;
  public biu: BIU;
  public alu: ALU;

  private parsedProgram: ParseResult = { instructions: [], errors: [], labels: {} };
  private currentInstructionIndex = 0;
  private activeMicroOps: MicroOp[] = [];
  private currentMicroOpIndex = 0;
  private cycleCount = 0;
  private instructionsExecuted = 0;
  private status: CPUState['execution']['status'] = 'READY';
  private errorMessage = '';

  private eventListeners: SimulationEventListener[] = [];

  // Active datapath values for visualization
  private currentAluState: CPUState['alu'] = {
    inputA: 0,
    inputB: 0,
    operation: 'ADD',
    result: 0,
    width: 16,
    active: false,
  };

  private activeControlSignals: string[] = [];

  constructor() {
    this.registers = new Registers();
    this.flags = new Flags();
    this.memory = new Memory();
    this.biu = new BIU(this.memory);
    this.alu = new ALU(this.flags);
    this.reset();
  }

  public reset(customRegisters?: Partial<Record<Register16, number>>): void {
    this.registers.reset(customRegisters);
    this.flags.reset();
    this.memory.reset();
    this.biu.reset();
    this.currentInstructionIndex = 0;
    this.activeMicroOps = [];
    this.currentMicroOpIndex = 0;
    this.cycleCount = 0;
    this.instructionsExecuted = 0;
    this.status = 'READY';
    this.errorMessage = '';
    this.activeControlSignals = [];
    this.currentAluState = {
      inputA: 0,
      inputB: 0,
      operation: 'ADD',
      result: 0,
      width: 16,
      active: false,
    };
  }

  public onEvent(listener: SimulationEventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  private emitEvent(op: MicroOp): void {
    const state = this.getState();
    for (const listener of this.eventListeners) {
      listener(op, state);
    }
  }

  public loadAssembly(sourceCode: string): ParseResult {
    this.parsedProgram = AssemblyParser.parse(sourceCode);
    if (this.parsedProgram.errors.length === 0 && this.parsedProgram.instructions.length > 0) {
      this.reset();
      // Load instructions into simulated memory starting at CS:IP
      const cs = this.registers.get16('CS');
      const ip = this.registers.get16('IP');
      let offset = ip;
      for (const inst of this.parsedProgram.instructions) {
        const phys = Memory.calculatePhysicalAddress(cs, offset);
        this.memory.loadProgramBytes(phys, inst.bytes);
        inst.address = offset;
        offset += inst.size;
      }
      this.status = 'READY';
    } else if (this.parsedProgram.errors.length > 0) {
      this.status = 'ERROR';
      this.errorMessage = this.parsedProgram.errors[0].message;
    }
    return this.parsedProgram;
  }

  public getParsedProgram(): ParseResult {
    return this.parsedProgram;
  }

  // Executes exactly one fine-grained Micro-Operation (Clock/Stage level)
  public microStep(): { completedInstruction: boolean; currentMicroOp?: MicroOp } {
    if (this.status === 'HALTED' || this.status === 'ERROR') {
      return { completedInstruction: false };
    }

    // If no micro-ops active, decode next instruction
    if (this.activeMicroOps.length === 0 || this.currentMicroOpIndex >= this.activeMicroOps.length) {
      if (this.currentInstructionIndex >= this.parsedProgram.instructions.length) {
        this.status = 'HALTED';
        return { completedInstruction: false };
      }

      const inst = this.parsedProgram.instructions[this.currentInstructionIndex];
      const decoded = InstructionDecoder.generateMicroOps(
        inst,
        this.registers,
        this.flags,
        this.memory,
        this.biu,
        this.parsedProgram.labels,
        this.currentInstructionIndex,
        this.parsedProgram.instructions
      );

      this.activeMicroOps = decoded.microOps;
      this.currentMicroOpIndex = 0;
      this.status = 'RUNNING';
    }

    const mop = this.activeMicroOps[this.currentMicroOpIndex];
    this.currentMicroOpIndex++;
    this.cycleCount++;

    // Apply micro-op to internal state
    this.applyMicroOp(mop);
    this.emitEvent(mop);

    let completedInstruction = false;
    if (mop.type === 'INSTRUCTION_END' || this.currentMicroOpIndex >= this.activeMicroOps.length) {
      this.instructionsExecuted++;
      completedInstruction = true;

      // Handle next instruction transition
      const inst = this.parsedProgram.instructions[this.currentInstructionIndex];
      if (inst?.mnemonic === 'HLT') {
        this.status = 'HALTED';
      } else {
        // Advance currentInstructionIndex based on IP or jump
        const currentIP = this.registers.get16('IP');
        const nextIdx = this.parsedProgram.instructions.findIndex(i => i.address === currentIP);
        if (nextIdx !== -1) {
          this.currentInstructionIndex = nextIdx;
        } else {
          this.currentInstructionIndex++;
        }

        if (this.currentInstructionIndex >= this.parsedProgram.instructions.length) {
          this.status = 'HALTED';
        }
      }
      this.activeMicroOps = [];
      this.currentMicroOpIndex = 0;
    }

    return { completedInstruction, currentMicroOp: mop };
  }

  // Executes one complete Assembly Instruction (all its micro-operations)
  public stepInstruction(): MicroOp[] {
    const executedOps: MicroOp[] = [];
    if (this.status === 'HALTED' || this.status === 'ERROR') {
      return executedOps;
    }

    let done = false;
    while (!done && (this.status as string) !== 'HALTED' && (this.status as string) !== 'ERROR') {
      const res = this.microStep();
      if (res.currentMicroOp) {
        executedOps.push(res.currentMicroOp);
      }
      if (res.completedInstruction) {
        done = true;
      }
    }

    return executedOps;
  }

  private applyMicroOp(mop: MicroOp): void {
    switch (mop.type) {
      case 'BIU_ADDR_CALC':
        this.biu.currentCalc.physicalAddress = mop.value ?? this.biu.currentCalc.physicalAddress;
        break;

      case 'QUEUE_PUSH':
        if (mop.value !== undefined) {
          this.biu.queue.push(mop.value);
        }
        break;

      case 'QUEUE_POP':
        this.biu.queue.pop();
        break;

      case 'QUEUE_FLUSH':
        this.biu.queue.flush();
        break;

      case 'REG_WRITE':
        if (mop.targetComponent && mop.value !== undefined) {
          const regName = mop.targetComponent.replace(/^Reg\s+/, '').toUpperCase();
          if (this.registers.is8Bit(regName)) {
            this.registers.set8(regName, mop.value);
          } else if (this.registers.is16Bit(regName)) {
            this.registers.set16(regName as Register16, mop.value);
          }
        }
        break;

      case 'IP_ADVANCE':
        if (mop.value !== undefined) {
          this.registers.set16('IP', mop.value);
        }
        break;

      case 'ALU_INPUT_A':
        if (mop.value !== undefined) {
          this.currentAluState.inputA = mop.value;
          this.currentAluState.active = true;
        }
        break;

      case 'ALU_INPUT_B':
        if (mop.value !== undefined) {
          this.currentAluState.inputB = mop.value;
        }
        break;

      case 'ALU_EXEC':
        if (mop.details?.op) {
          this.currentAluState.operation = mop.details.op as ALUOperation;
        }
        break;

      case 'ALU_RESULT':
        if (mop.value !== undefined) {
          this.currentAluState.result = mop.value;
        }
        break;

      case 'FLAG_UPDATE':
        if (mop.details?.flags) {
          this.flags.reset(mop.details.flags);
        }
        break;

      case 'CONTROL_SIGNAL':
        this.activeControlSignals = [mop.description];
        break;
    }
  }

  public getState(): CPUState {
    const currentInst = this.parsedProgram.instructions[this.currentInstructionIndex];
    const cs = this.registers.get16('CS');
    const ip = this.registers.get16('IP');

    return {
      registers: this.registers.getState(),
      flags: this.flags.getState(),
      queue: this.biu.queue.getBytes(),
      alu: { ...this.currentAluState },
      biu: {
        segmentReg: this.biu.currentCalc.segmentReg,
        segmentValue: this.biu.currentCalc.segmentValue,
        offsetReg: this.biu.currentCalc.offsetReg,
        offsetValue: this.biu.currentCalc.offsetValue,
        shiftResult: this.biu.currentCalc.shiftResult,
        physicalAddress: this.biu.currentCalc.physicalAddress,
        active: true,
        busDirection: 'FETCH',
      },
      controlUnit: {
        activeSignals: [...this.activeControlSignals],
        currentPhase: this.activeMicroOps[this.currentMicroOpIndex]?.type || 'IDLE',
      },
      execution: {
        status: this.status,
        currentInstructionIndex: this.currentInstructionIndex,
        currentInstruction: currentInst,
        currentMicroOpIndex: this.currentMicroOpIndex,
        cycleCount: this.cycleCount,
        instructionsExecuted: this.instructionsExecuted,
        errorMessage: this.errorMessage,
      },
    };
  }

  public setStatus(status: CPUState['execution']['status']): void {
    this.status = status;
  }
}
