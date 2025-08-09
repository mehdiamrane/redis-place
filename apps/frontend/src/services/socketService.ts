import { io, Socket } from "socket.io-client";
import { colorIndexToHex, hexToColorIndex } from "@redis-place/shared";

interface PlacedPixel {
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

interface PixelUpdateData {
  x: number;
  y: number;
  color: number;
  userId: string;
  timestamp: number;
}

interface CanvasSnapshot {
  data: string;
  timestamp: number;
  width: number;
  height: number;
}

class SocketService {
  private socket: Socket | null = null;
  private userId: string;

  constructor() {
    this.userId = this.getOrCreateUserId();
  }

  private getOrCreateUserId(): string {
    const STORAGE_KEY = 'redis-place-user-id';
    
    // Try to get existing user ID from localStorage
    const existingUserId = localStorage.getItem(STORAGE_KEY);
    
    if (existingUserId) {
      console.log('Using existing user ID:', existingUserId);
      return existingUserId;
    }
    
    // Generate new user ID if none exists
    const newUserId = this.generateUserId();
    localStorage.setItem(STORAGE_KEY, newUserId);
    console.log('Generated new user ID:', newUserId);
    return newUserId;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(import.meta.env.VITE_SERVER_URL);

    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.socket?.emit("join-canvas", { userId: this.userId });
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    this.socket.on("canvas-loaded", (data) => {
      console.log("Canvas loaded:", data);
    });

    this.socket.on("error", (data) => {
      console.error("Socket error:", data.message);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  placePixel(x: number, y: number, color: number): void {
    console.log("placePixel called with:", { x, y, color, userId: this.userId });
    console.log("Socket connected:", this.socket?.connected);

    if (this.socket?.connected) {
      console.log("Emitting place-pixel event...");
      this.socket.emit("place-pixel", {
        x,
        y,
        color,
        userId: this.userId,
      });
    } else {
      console.error("Socket not connected");
    }
  }

  onPixelUpdate(callback: (data: PixelUpdateData) => void): void {
    if (this.socket) {
      this.socket.on("pixel-update", (data) => {
        console.log("Received pixel-update:", data);
        callback(data);
      });
    }
  }

  async loadCanvas(): Promise<PlacedPixel[]> {
    try {
      console.log("🔄 Loading canvas from server...");
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/canvas`);
      const snapshot: CanvasSnapshot = await response.json();

      console.log("📦 Received snapshot:", snapshot);
      console.log("📊 Snapshot data type:", typeof snapshot.data, "Length:", snapshot.data?.length);

      if (!snapshot.data) {
        console.log("⚠️ No snapshot data received");
        return [];
      }

      const pixels = this.parseCanvasData(snapshot.data);
      console.log("🎨 Parsed pixels:", pixels.length, "pixels loaded");
      return pixels;
    } catch (error) {
      console.error("❌ Error loading canvas:", error);
      return [];
    }
  }

  private parseCanvasData(jsonData: string): PlacedPixel[] {
    try {
      console.log("🔍 Parsing canvas data:", jsonData);

      if (!jsonData) {
        console.log("⚠️ Empty jsonData");
        return [];
      }

      const pixelData = JSON.parse(jsonData);
      console.log("📋 Parsed pixel data:", pixelData);

      const pixels = pixelData.map((pixel: { x: number; y: number; color: number }) => ({
        x: pixel.x,
        y: pixel.y,
        color: colorIndexToHex(pixel.color),
        timestamp: Date.now(),
      }));

      console.log("✨ Final pixels array:", pixels);
      return pixels;
    } catch (error) {
      console.error("❌ Error parsing canvas data:", error);
      return [];
    }
  }

  colorIndexToHex(colorIndex: number): string {
    return colorIndexToHex(colorIndex);
  }

  hexToColorIndex(hex: string): number {
    const index = hexToColorIndex(hex);
    console.log(`Color mapping: ${hex} -> index ${index}`);
    return index;
  }
}

export const socketService = new SocketService();
export default socketService;
