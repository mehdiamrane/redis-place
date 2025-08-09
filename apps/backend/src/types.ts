export interface PlacedPixel {
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

export interface PixelUpdateData {
  x: number;
  y: number;
  color: number;
  userId: string;
  timestamp: number;
}

export interface CanvasSnapshot {
  data: string;
  timestamp: number;
  width: number;
  height: number;
}

export interface SocketEvents {
  'place-pixel': (data: { x: number; y: number; color: number; userId: string }) => void;
  'join-canvas': (data: { userId: string }) => void;
  'pixel-update': (data: PixelUpdateData) => void;
  'canvas-loaded': (data: { success: boolean }) => void;
  'error': (data: { message: string }) => void;
}