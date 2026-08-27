// 8086 Assembly Program Samples

export interface ProgramPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
}

export const PROGRAM_PRESETS: ProgramPreset[] = [
  {
    id: 'arithmetic_basic',
    name: '1. Basic Arithmetic & Registers',
    category: 'Fundamentals',
    description: 'Demonstrates MOV, ADD, SUB, and XCHG between 16-bit registers (AX, BX, CX, DX) and observes FLAGS.',
    code: `; Basic 8086 Arithmetic & Register Operations
MOV AX, 1234H      ; Load AX with 1234H
MOV BX, 0003H      ; Load BX with 0003H
ADD AX, BX         ; AX = AX + BX (1237H)
MOV CX, 0020H      ; Load CX with 0020H
SUB AX, CX         ; AX = AX - CX (1217H)
XCHG AX, DX        ; Swap AX and DX
HLT                ; Halt CPU
`,
  },
  {
    id: 'fibonacci',
    name: '2. Fibonacci Series Generator',
    category: 'Loops & Branches',
    description: 'Calculates the first 8 terms of the Fibonacci sequence using registers AX, BX, DX and a LOOP counter in CX.',
    code: `; Fibonacci Sequence Generator
MOV AX, 0000H      ; First Fibonacci number (F0 = 0)
MOV BX, 0001H      ; Second Fibonacci number (F1 = 1)
MOV CX, 0006H      ; Calculate next 6 terms

FIB_LOOP:
MOV DX, AX         ; Temp = AX
ADD DX, BX         ; DX = AX + BX (Next term)
MOV AX, BX         ; AX = BX
MOV BX, DX         ; BX = Next term
LOOP FIB_LOOP      ; Decrement CX and loop if CX != 0

HLT                ; Done! Final Fibonacci term in BX
`,
  },
  {
    id: 'bitwise_flags',
    name: '3. Bitwise Logic & Shift Operations',
    category: 'ALU & Flags',
    description: 'Explores bit-level operations (AND, OR, XOR, NOT, SHL, ROR) and watches individual status flags (ZF, SF, CF, PF).',
    code: `; Bitwise Logic and Shift Visualizer
MOV AX, 0F0FH      ; Load alternating bit pattern
MOV BX, 00FFH      ; Load mask in BX
AND AX, BX         ; AX = 000FH (Clear upper byte)
OR  AX, 0F00H      ; AX = 0F0FH (Set upper nibble)
XOR AX, 000FH      ; AX = 0F00H (Toggle lower nibble)
NOT AX             ; AX = F0FFH (Invert all bits)
MOV CL, 04H        ; Shift count = 4
SHL AX, 1          ; Shift AX left by 1 bit (sets CF)
ROR AX, 1          ; Rotate AX right by 1 bit
HLT
`,
  },
  {
    id: 'stack_subroutine',
    name: '4. Stack & Subroutines (CALL / RET)',
    category: 'Stack & Control Flow',
    description: 'Demonstrates PUSH/POP stack operations, subroutine CALL, and RET with return address preservation.',
    code: `; Subroutine & Stack Operations
MOV AX, 0005H      ; Argument 1 in AX
MOV BX, 0003H      ; Argument 2 in BX
CALL COMPUTE_SUM   ; Call subroutine
MOV DX, AX         ; Store final result in DX
HLT

COMPUTE_SUM:
PUSH BX            ; Save BX on stack
ADD  AX, BX        ; AX = AX + BX
INC  AX            ; Add 1 bonus
POP  BX            ; Restore BX from stack
RET                ; Return to caller
`,
  },
  {
    id: 'memory_addressing',
    name: '5. Segmented Memory & Base-Index Addressing',
    category: 'BIU & Memory',
    description: 'Demonstrates 20-bit physical address generation with Segment:Offset ([BX+SI+disp]) and memory read/write cycles.',
    code: `; Segmented Memory & Addressing Modes
MOV AX, 2000H      ; Setup Data Segment (DS)
MOV DS, AX
MOV BX, 0100H      ; Base register BX
MOV SI, 0020H      ; Index register SI
MOV DX, 0ABCDH     ; Data word to write

; Physical address: DS(2000H)*16 + (BX+SI+4) = 20000H + 0124H = 20124H
MOV [BX+SI+4], DX  ; Store DX to memory [20124H]
MOV CX, [BX+SI+4]  ; Read back word from memory into CX
HLT
`,
  },
  {
    id: 'conditional_branch',
    name: '6. Conditional Comparison & Branching',
    category: 'Control Flow',
    description: 'Uses CMP and conditional jumps (JE, JNE, JAE) to find the maximum of two values.',
    code: `; Find Maximum of Two Values
MOV AX, 0042H      ; Value A = 66
MOV BX, 0088H      ; Value B = 136

CMP AX, BX         ; Compare AX with BX (AX - BX)
JAE AX_IS_GREATER  ; Jump if AX >= BX

MOV DX, BX         ; BX is greater, put in DX
JMP FINISH

AX_IS_GREATER:
MOV DX, AX         ; AX is greater, put in DX

FINISH:
HLT                ; Maximum stored in DX
`,
  },
];
