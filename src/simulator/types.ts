// 8086 CPU Simulator - Core Type Definitions

export type Register16 = 
  | 'AX' | 'BX' | 'CX' | 'DX'
  | 'SP' | 'BP' | 'SI' | 'DI'
  | 'CS' | 'DS' | 'SS' | 'ES'
  | 'IP';

export type Register8 = 
  | 'AL' | 'AH' | 'BL' | 'BH'
  | 'CL' | 'CH' | 'DL' | 'DH';

export type AnyRegister = Register16 | Register8;

export type FlagName = 
  | 'CF' // Carry Flag (bit 0)
  | 'PF' // Parity Flag (bit 2)
  | 'AF' // Auxiliary Carry Flag (bit 4)
  | 'ZF' // Zero Flag (bit 6)
  | 'SF' // Sign Flag (bit 7)
  | 'TF' // Trap Flag (bit 8)
  | 'IF' // Interrupt Enable Flag (bit 9)
  | 'DF' // Direction Flag (bit 10)
  | 'OF'; // Overflow Flag (bit 11)

export interface FlagsState {
  CF: boolean; // Carry
  PF: boolean; // Parity
  AF: boolean; // Auxiliary carry (half-carry for BCD)
  ZF: boolean; // Zero
  SF: boolean; // Sign
  TF: boolean; // Trap
  IF: boolean; // Interrupt
  DF: boolean; // Direction (0=up, 1=down)
  OF: boolean; // Overflow
}

export type ALUOperation = 
  | 'ADD' | 'ADC' | 'SUB' | 'SBB' 
  | 'INC' | 'DEC' | 'CMP' | 'NEG'
  | 'AND' | 'OR' | 'XOR' | 'NOT' | 'TEST'
  | 'SHL' | 'SHR' | 'SAR' | 'ROL' | 'ROR' | 'RCL' | 'RCR'
  | 'MUL' | 'IMUL' | 'DIV' | 'IDIV'
  | 'PASS_A' | 'PASS_B';

export type MicroOpType = 
  | 'BIU_ADDR_CALC'      // Calculating physical address (Seg * 16 + Offset)
  | 'BUS_FETCH_REQ'      // Emitting 20-bit address to memory bus
  | 'MEM_READ'           // Reading byte/word from memory
  | 'MEM_WRITE'          // Writing byte/word to memory
  | 'QUEUE_PUSH'         // Pushing fetched byte into 6-byte FIFO queue
  | 'QUEUE_POP'          // EU fetching byte from 6-byte FIFO queue
  | 'QUEUE_FLUSH'        // Flushing prefetch queue on branch/jump
  | 'DECODE_START'       // Instruction decoder parsing opcode
  | 'DECODE_COMPLETE'    // Decoding completed, microcode ready
  | 'REG_READ'           // Reading value from register to internal bus
  | 'REG_WRITE'          // Storing result into register from internal bus
  | 'ALU_INPUT_A'        // Setting ALU Input A
  | 'ALU_INPUT_B'        // Setting ALU Input B
  | 'ALU_EXEC'           // ALU computing operation
  | 'ALU_RESULT'         // ALU outputting result to datapath
  | 'FLAG_UPDATE'        // Updating FLAGS register bits
  | 'IP_ADVANCE'         // Advancing Instruction Pointer
  | 'CONTROL_SIGNAL'     // Control unit asserting control line
  | 'INSTRUCTION_START'  // New assembly instruction begins
  | 'INSTRUCTION_END';   // Assembly instruction completed

export interface MicroOp {
  id: string;
  stepNumber: number;
  type: MicroOpType;
  description: string;
  sourceComponent?: string;
  targetComponent?: string;
  activeBus?: string;
  value?: number;
  width?: 8 | 16 | 20;
  details?: Record<string, any>;
  timestamp?: number;
}

export interface Operand {
  type: 'register' | 'memory' | 'immediate' | 'segment';
  reg?: AnyRegister;
  value?: number; // Immediate value or displacement
  segment?: Register16; // CS, DS, SS, ES
  baseReg?: Register16; // BX, BP
  indexReg?: Register16; // SI, DI
  displacement?: number;
  width?: 8 | 16;
  rawText?: string;
}

export interface Instruction {
  id: string;
  line: number;
  mnemonic: string;
  operands: Operand[];
  bytes: number[];
  size: number;
  rawText: string;
  comment?: string;
  address?: number; // Physical or offset address in code segment
}

export interface MemoryAccess {
  address: number;
  type: 'read' | 'write' | 'fetch';
  value: number;
  width: 8 | 16;
  cycle: number;
}

export interface CPUState {
  registers: {
    AX: number;
    BX: number;
    CX: number;
    DX: number;
    SP: number;
    BP: number;
    SI: number;
    DI: number;
    CS: number;
    DS: number;
    SS: number;
    ES: number;
    IP: number;
  };
  flags: FlagsState;
  queue: number[]; // 0 to 6 bytes in FIFO
  alu: {
    inputA: number;
    inputB: number;
    operation: ALUOperation;
    result: number;
    width: 8 | 16;
    active: boolean;
  };
  biu: {
    segmentReg: Register16;
    segmentValue: number;
    offsetReg: Register16 | 'DISP' | 'IMMEDIATE';
    offsetValue: number;
    shiftResult: number; // Segment * 16
    physicalAddress: number; // (Segment * 16) + offset
    active: boolean;
    busDirection: 'IDLE' | 'READ' | 'WRITE' | 'FETCH';
    lastFetchedByte?: number;
  };
  controlUnit: {
    activeSignals: string[];
    currentPhase: string;
  };
  execution: {
    status: 'READY' | 'RUNNING' | 'PAUSED' | 'HALTED' | 'ERROR';
    currentInstructionIndex: number;
    currentInstruction?: Instruction;
    currentMicroOpIndex: number;
    cycleCount: number;
    instructionsExecuted: number;
    errorMessage?: string;
  };
}
