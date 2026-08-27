// 8086 Architecture Visualization - Vector Blueprint Layout & Wires
import { WireDefinition } from './types';

export const CANVAS_DIMENSIONS = {
  width: 1440,
  height: 960,
};

export const LAYOUT = {
  BIU_CONTAINER: {
    x: 40,
    y: 50,
    width: 610,
    height: 840,
    label: 'BUS INTERFACE UNIT (BIU)',
    color: '#3b82f6',
  },
  EU_CONTAINER: {
    x: 690,
    y: 50,
    width: 710,
    height: 840,
    label: 'EXECUTION UNIT (EU)',
    color: '#10b981',
  },

  // BIU Components
  SEGMENT_REGISTERS: {
    x: 70,
    y: 110,
    width: 230,
    height: 200,
  },
  IP_REGISTER: {
    x: 70,
    y: 330,
    width: 230,
    height: 60,
  },
  ADDRESS_SUMMER: {
    x: 340,
    y: 110,
    width: 280,
    height: 220,
  },
  PREFETCH_QUEUE: {
    x: 70,
    y: 430,
    width: 550,
    height: 120,
  },
  BUS_CONTROL: {
    x: 340,
    y: 600,
    width: 280,
    height: 150,
  },
  MEMORY_INTERFACE: {
    x: 70,
    y: 600,
    width: 230,
    height: 150,
  },

  // EU Components
  GP_REGISTERS: {
    x: 720,
    y: 110,
    width: 310,
    height: 240,
  },
  POINTER_REGISTERS: {
    x: 1060,
    y: 110,
    width: 310,
    height: 240,
  },
  DECODER: {
    x: 720,
    y: 380,
    width: 310,
    height: 110,
  },
  FLAGS: {
    x: 1060,
    y: 380,
    width: 310,
    height: 110,
  },
  ALU: {
    x: 720,
    y: 520,
    width: 650,
    height: 270,
  },
};

// Precise Orthogonal & Bezier Wire Paths
export const WIRES: WireDefinition[] = [
  // 1. Segment Registers to Address Summer (16-bit)
  {
    id: 'wire_seg_to_summer',
    name: 'Segment Reg -> Adder (16-bit)',
    busWidth: 16,
    type: 'address',
    source: 'Segment Registers',
    target: 'Address Summer',
    path: 'M 300 200 L 340 200',
    labelPosition: { x: 320, y: 190 },
  },

  // 2. IP to Address Summer (16-bit)
  {
    id: 'wire_ip_to_summer',
    name: 'IP -> Adder (16-bit Offset)',
    busWidth: 16,
    type: 'address',
    source: 'IP Register',
    target: 'Address Summer',
    path: 'M 300 360 L 420 360 L 420 330',
    labelPosition: { x: 350, y: 350 },
  },

  // 3. Address Summer to Bus Interface / Memory (20-bit Physical Address)
  {
    id: 'wire_summer_to_bus',
    name: '20-bit Physical Address Bus',
    busWidth: 20,
    type: 'address',
    source: 'Address Summer',
    target: 'Bus Control',
    path: 'M 480 330 L 480 600',
    labelPosition: { x: 490, y: 460 },
  },

  // 4. Memory to Bus Interface / Prefetch Queue (8-bit Instruction Stream)
  {
    id: 'wire_mem_to_queue',
    name: 'Memory -> Prefetch Queue (8-bit Data)',
    busWidth: 8,
    type: 'instruction',
    source: 'Memory Interface',
    target: 'Prefetch Queue',
    path: 'M 180 600 L 180 550',
    labelPosition: { x: 190, y: 575 },
  },

  // 5. Prefetch Queue to Instruction Decoder (8-bit Opcode Stream)
  {
    id: 'wire_queue_to_decoder',
    name: 'Queue -> EU Decoder (Opcode Bus)',
    busWidth: 8,
    type: 'instruction',
    source: 'Prefetch Queue',
    target: 'Instruction Decoder',
    path: 'M 620 490 L 670 490 L 670 435 L 720 435',
    labelPosition: { x: 670, y: 460 },
  },

  // 6. Decoder to Control Logic / EU (Control lines)
  {
    id: 'wire_decoder_to_control',
    name: 'Microcode Control Bus',
    busWidth: 16,
    type: 'control',
    source: 'Instruction Decoder',
    target: 'ALU',
    path: 'M 875 490 L 875 520',
    labelPosition: { x: 885, y: 505 },
  },

  // 7. Internal 16-bit Data Bus Spine (Main Datapath)
  {
    id: 'wire_internal_bus_spine',
    name: '16-bit Internal Data Bus',
    busWidth: 16,
    type: 'data',
    source: 'General Registers',
    target: 'ALU Input',
    path: 'M 660 120 L 660 760',
    labelPosition: { x: 645, y: 280 },
  },

  // 8. General Purpose Regs to Internal Bus
  {
    id: 'wire_gp_to_bus',
    name: 'GP Registers Datapath',
    busWidth: 16,
    type: 'data',
    source: 'GP Registers',
    target: 'Internal Data Bus',
    path: 'M 720 230 L 660 230',
    labelPosition: { x: 690, y: 220 },
  },

  // 9. Pointer Regs to Internal Bus
  {
    id: 'wire_pointers_to_bus',
    name: 'Pointer & Index Datapath',
    busWidth: 16,
    type: 'data',
    source: 'Pointer Registers',
    target: 'Internal Data Bus',
    path: 'M 1060 230 L 1040 230 L 1040 80 L 660 80',
    labelPosition: { x: 850, y: 70 },
  },

  // 10. Internal Bus to ALU Input A
  {
    id: 'wire_bus_to_alu_a',
    name: 'Bus -> ALU Input A (16-bit)',
    busWidth: 16,
    type: 'data',
    source: 'Internal Data Bus',
    target: 'ALU Input A',
    path: 'M 660 570 L 760 570',
    labelPosition: { x: 710, y: 560 },
  },

  // 11. Internal Bus to ALU Input B
  {
    id: 'wire_bus_to_alu_b',
    name: 'Bus -> ALU Input B (16-bit)',
    busWidth: 16,
    type: 'data',
    source: 'Internal Data Bus',
    target: 'ALU Input B',
    path: 'M 660 630 L 760 630',
    labelPosition: { x: 710, y: 620 },
  },

  // 12. ALU Result Output Bus back to Internal Bus
  {
    id: 'wire_alu_out_to_bus',
    name: 'ALU Result -> Internal Bus (16-bit)',
    busWidth: 16,
    type: 'data',
    source: 'ALU Result Buffer',
    target: 'Internal Data Bus',
    path: 'M 1200 700 L 1200 760 L 660 760',
    labelPosition: { x: 930, y: 770 },
  },

  // 13. ALU Flags Output to FLAGS Register
  {
    id: 'wire_alu_to_flags',
    name: 'ALU Status Flags Bus (9-bit)',
    busWidth: 16,
    type: 'control',
    source: 'ALU Core',
    target: 'FLAGS Register',
    path: 'M 1215 520 L 1215 490',
    labelPosition: { x: 1225, y: 505 },
  },

  // 14. BIU to EU Internal Bus Bridge
  {
    id: 'wire_biu_eu_bridge',
    name: 'BIU <-> EU Datapath Bridge',
    busWidth: 16,
    type: 'data',
    source: 'BIU Internal Bus',
    target: 'Internal Data Bus',
    path: 'M 620 670 L 660 670',
    labelPosition: { x: 635, y: 660 },
  },
];
