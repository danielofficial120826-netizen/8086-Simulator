// 8086 Architecture Visualization - Types
import { Register16, Register8, FlagName, ALUOperation } from '../simulator/types';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export type SelectedItemType = 
  | 'REGISTER'
  | 'FLAGS'
  | 'FLAG_BIT'
  | 'ALU'
  | 'ADDRESS_SUMMER'
  | 'PREFETCH_QUEUE'
  | 'DECODER'
  | 'CONTROL_UNIT'
  | 'BUS_INTERFACE'
  | 'WIRE'
  | 'BIU'
  | 'EU'
  | 'MEMORY'
  | 'NONE';

export interface SelectedItem {
  type: SelectedItemType;
  id: string;
  name: string;
  category?: 'BIU' | 'EU' | 'BUS' | 'CONTROL' | 'MEMORY';
  details?: Record<string, any>;
}

export interface WireDefinition {
  id: string;
  name: string;
  busWidth: 1 | 8 | 16 | 20;
  type: 'data' | 'address' | 'control' | 'instruction';
  source: string;
  target: string;
  path: string; // SVG path d attribute
  labelPosition?: { x: number; y: number };
}

export interface ActiveSignalPacket {
  id: string;
  wireId: string;
  value: number;
  width: 8 | 16 | 20;
  type: 'data' | 'address' | 'control' | 'instruction';
  source: string;
  target: string;
  progress: number; // 0 to 1
  path: string;
}

export interface ViewOptions {
  showLabels: boolean;
  showBusValues: boolean;
  showBinary: boolean;
  showHex: boolean;
  showSignalNames: boolean;
  showInternalEvents: boolean;
  focusMode: boolean; // Dims everything except active datapath
  showGrid: boolean;
}
