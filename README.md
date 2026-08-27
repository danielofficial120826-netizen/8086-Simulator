# Intel 8086 Internal Architecture Visual Simulator

An interactive, production-quality 2D visual simulator of the **Intel 8086 Microprocessor** built with **React**, **TypeScript**, **Vite**, **SVG**, and **Tailwind CSS**.

This simulator provides an educational and technical exploration of the internal operation of the 8086 CPU. Users can write or load 8086 assembly programs, execute them step-by-step or clock-by-clock (micro-steps), pan and zoom around the architecture, inspect individual registers, wires, and ALU components, and watch binary signals travel through physical buses in real time.

---

## 🌟 Key Features

### 1. Two-Stage Pipelined Architecture (BIU + EU)
- **Bus Interface Unit (BIU)**:
  - **Segment Registers**: 16-bit `CS`, `DS`, `SS`, `ES`.
  - **Instruction Pointer**: 16-bit `IP`.
  - **Dedicated 20-Bit Address Generation Adder ($\Sigma$)**: Visually computes real-mode segmentation:
    $$\text{Physical Address} = (\text{Segment Register} \times 16) + \text{Offset} = (\text{Segment} \ll 4) + \text{Offset}$$
    Shows bit shifting, zero-padding, and the resulting 20-bit physical bus address.
  - **6-Byte FIFO Instruction Prefetch Queue**: 6 distinct physical FIFO byte slots (`B0` through `B5`) with live occupancy meter (`QUEUE: N / 6`) and queue flushing on branch instructions (`JMP`, `CALL`, `RET`, conditional jumps).
  - **20-bit Bus Interface Controller**: Multiplexed address/data lines (`AD0–AD15`, `A16–A19`) and control signal lines (`ALE`, `DEN`, `M/IO`, `RD`, `WR`).

- **Execution Unit (EU)**:
  - **General Purpose Registers**: 16-bit `AX`, `BX`, `CX`, `DX` with high/low 8-bit split sub-registers (`AH`/`AL`, `BH`/`BL`, `CH`/`CL`, `DH`/`DL`) and binary bit LEDs.
  - **Pointer & Index Registers**: `SP` (Stack Pointer), `BP` (Base Pointer), `SI` (Source Index), `DI` (Destination Index).
  - **16-Bit Arithmetic Logic Unit (ALU)**: Input A buffer, Input B buffer, V-shaped arithmetic operator core, 16-bit Result buffer, and bottom 16-bit binary signal lanes (`Bit 15 .. Bit 0`).
  - **16-Bit FLAGS Register**: 9 individual flip-flop LEDs for status and control flags:
    - **CF** (Carry), **PF** (Parity), **AF** (Auxiliary Carry), **ZF** (Zero), **SF** (Sign), **TF** (Trap), **IF** (Interrupt Enable), **DF** (Direction), **OF** (Overflow).
  - **Instruction Decoder & Control Logic**: Opcode decoder and microcode state machine.

---

### 2. Multi-Bus Network & Bit-Level Signal Animation
- **Interactive Buses**:
  - 16-bit Internal Data Bus (Cyan)
  - 20-bit Physical Address Bus (Amber)
  - Microcode Control Bus (Magenta)
  - Opcode Instruction Stream (Yellow)
- **Active Signal Pulses**: Animated photon waves travel along wire paths during active data transfers.
- **Wire Probing**: Click or hover over any wire to inspect its name, width (8-bit, 16-bit, 20-bit), signal type, source, target, and current binary logic state.

---

### 3. Interactive Vector Canvas (SVG)
- **Pan & Drag**: Drag freely with mouse or trackpad.
- **Smooth Zoom**: Zoom in/out (0.35x to 3.0x) with mouse wheel or UI buttons.
- **Focus Mode**: Dim inactive units and isolate the currently executing datapath.
- **Binary Bit Toggle**: Switch between compact hex values and 16-bit individual bit lane traces.
- **Auto-Fit & Center**: Double-click anywhere to reset camera framing.

---

### 4. Assembly Code Editor & Micro-Op Timeline
- **Code Editor**: Line numbers, active instruction pointer (`▶`), breakpoint gutter toggles, and instant syntax validation.
- **Transport Controls**:
  - `Run ▶` / `Pause ❚❚`
  - `Step ⏭ (Instruction)`: Executes one full instruction.
  - `Micro-Step ⇥ (Clock Stage)`: Advances one internal micro-op stage (BIU fetch $\to$ Queue push $\to$ Decode $\to$ Reg read $\to$ ALU $\to$ Reg write $\to$ Flags).
  - `Reset ↺`: Reinitializes CPU state and restarts the program.
  - Speed Slider (0.1x to 10x).
- **Execution Timeline**: Live chronological stream of all generated micro-operations. Clicking any event highlights its exact datapath on the architecture canvas.

---

### 5. Deep Inspector & 1MB Memory Viewer
- **Component Inspector**: Deep dive into selected registers, ALU, address summer, prefetch queue, or wire tracks (Hex, Decimal, Signed Decimal, Binary, formula).
- **CPU Registers Table**: Real-time state overview of all 14 registers, FLAGS, and queue contents.
- **Logic Analyzer Probe**: 16-bit digital oscilloscope trace showing $0\text{V} / 5\text{V}$ logic levels.
- **1MB Segmented Memory Explorer**: Hex & ASCII byte grid with `CS:IP`, `DS:SI`, and `SS:SP` physical pointer highlights.

---

## 📚 Preset Programs Included

1. **Basic Arithmetic & Registers**: Demonstrates `MOV`, `ADD`, `SUB`, and `XCHG` between 16-bit registers and observes flag mutations.
2. **Fibonacci Series Generator**: Generates Fibonacci numbers using registers `AX`, `BX`, `DX` and a `LOOP` counter in `CX`.
3. **Bitwise Logic & Shifts**: Explores bit-level operations (`AND`, `OR`, `XOR`, `NOT`, `SHL`, `ROR`) and watches `ZF`, `SF`, `CF`, and `PF`.
4. **Stack & Subroutines**: Demonstrates stack operations (`PUSH`, `POP`), subroutine `CALL`, and `RET` with return address preservation.
5. **Segmented Memory & Addressing**: Demonstrates 20-bit physical address generation with Segment:Offset (`[BX+SI+disp]`) and memory read/write cycles.
6. **Conditional Branching & Comparison**: Uses `CMP` and conditional jumps (`JE`, `JNE`, `JAE`) to find the maximum of two values.

---

## 🛠️ Supported 8086 Instructions

- **Data Transfer**: `MOV`, `XCHG`, `PUSH`, `POP`
- **Arithmetic**: `ADD`, `ADC`, `SUB`, `SBB`, `INC`, `DEC`, `CMP`, `NEG`
- **Logical**: `AND`, `OR`, `XOR`, `NOT`, `TEST`
- **Shifts & Rotates**: `SHL`/`SAL`, `SHR`, `SAR`, `ROL`, `ROR`
- **Control Flow**: `JMP`, `JE`/`JZ`, `JNE`/`JNZ`, `JC`/`JB`, `JNC`/`JAE`, `JS`, `JNS`, `LOOP`, `CALL`, `RET`, `NOP`, `HLT`
- **Flag Manipulation**: `CLC`, `STC`, `CMC`, `CLD`, `STD`, `CLI`, `STI`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/8086-visual-simulator.git

# Navigate to project directory
cd 8086-visual-simulator

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the Vite development server
npm run dev
```

Open your browser and navigate to **`http://localhost:5173/`**.

### Building for Production

```bash
# Type check and build production bundle
npm run build

# Preview production build
npm run preview
```

### Running Automated Tests

```bash
# Run Vitest test suite
npx vitest run
```

---

## 📁 Project Structure

```
8086-visual-simulator/
├── src/
│   ├── main.tsx                         # React entry point
│   ├── App.tsx                          # Main application layout and state manager
│   ├── index.css                        # Dark technical theme, CSS variables & keyframes
│   ├── simulator/                       # Pure CPU simulation engine
│   │   ├── types.ts                     # Core types: registers, flags, micro-ops, CPU state
│   │   ├── registers.ts                 # 16-bit / 8-bit registers & sub-register aliasing
│   │   ├── flags.ts                     # 16-bit FLAGS register & flag computation logic
│   │   ├── alu.ts                       # 16-bit & 8-bit Arithmetic Logic Unit
│   │   ├── memory.ts                    # 1MB segmented memory model
│   │   ├── biu.ts                       # 6-byte prefetch queue & 20-bit address summer
│   │   ├── parser.ts                    # 8086 assembly parser & tokenizer
│   │   ├── decoder.ts                   # Micro-op generator & instruction decoder
│   │   ├── cpu8086.ts                   # CPU execution engine & micro-step state machine
│   │   └── samples.ts                   # 6 preset educational 8086 programs
│   ├── visualization/                   # SVG vector architecture & animation layer
│   │   ├── types.ts                     # Camera, wire, selection & view options types
│   │   ├── layout.ts                    # Vector blueprint layout & multi-bus wire paths
│   │   └── components/
│   │       ├── ArchitectureView.tsx     # Main interactive SVG canvas (Pan/Zoom/Focus)
│   │       ├── RegisterBox.tsx          # Graphical register with 16-bit / 8-bit split
│   │       ├── FlagsComponent.tsx       # 16-bit FLAGS flip-flop LED indicators
│   │       ├── AddressSummer.tsx        # Dedicated 20-bit Address Summer (Seg*16 + Off)
│   │       ├── PrefetchQueue.tsx        # 6-byte FIFO prefetch queue with slot meters
│   │       ├── ALUComponent.tsx         # Detailed 16-bit ALU schematic & signal lanes
│   │       └── BusNetwork.tsx           # Multi-lane selectable buses & pulse waves
│   ├── ui/                              # Control panel & debug tools
│   │   ├── Header.tsx                   # Top metrics bar, status badges, view toggles
│   │   ├── ControlBar.tsx               # Oscilloscope transport, speed slider, presets
│   │   ├── EditorPanel.tsx              # Assembly editor with line pointers & breakpoints
│   │   ├── TimelinePanel.tsx            # Granular micro-operation chronological stream
│   │   ├── InspectorPanel.tsx           # Deep component inspector & logic analyzer probe
│   │   ├── MemoryPanel.tsx              # 1MB hex/ASCII segmented memory explorer
│   │   └── HelpModal.tsx                # Architectural guide & keyboard shortcuts
│   └── tests/
│       └── simulator.test.ts            # Vitest unit test suite (12 test suites)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 📜 License

This project is licensed under the **MIT License**.
