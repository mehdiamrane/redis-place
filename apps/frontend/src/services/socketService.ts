import { io, Socket } from "socket.io-client";
import { colorIndexToHex, hexToColorIndex } from "@redis-place/shared";
import AuthService from "./authService";

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
  data: { x: number; y: number; color: number }[];
  timestamp: number;
  width: number;
  height: number;
}

class SocketService {
  private socket: Socket | null = null;
  private authRequiredCallback: ((message: string) => void) | null = null;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(import.meta.env.VITE_SERVER_URL);

    this.socket.on("connect", () => {
      console.log("Connected to server");
      const sessionToken = AuthService.getSessionToken();
      this.socket?.emit("join-canvas", { sessionToken });
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

    this.socket.on("auth-required", (data) => {
      console.log("Authentication required:", data.message);
      if (this.authRequiredCallback) {
        this.authRequiredCallback(data.message);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  placePixel(x: number, y: number, color: number): void {
    console.log("placePixel called with:", { x, y, color });
    console.log("Socket connected:", this.socket?.connected);

    if (this.socket?.connected) {
      console.log("Emitting place-pixel event...");
      const sessionToken = AuthService.getSessionToken();
      this.socket.emit("place-pixel", {
        x,
        y,
        color,
        sessionToken,
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

  private parseCanvasData(pixelArray: { x: number; y: number; color: number }[]): PlacedPixel[] {
    try {
      console.log("🔍 Parsing canvas data:", pixelArray);

      if (!pixelArray || !Array.isArray(pixelArray)) {
        console.log("⚠️ Empty or invalid pixel array");
        return [];
      }

      console.log("📋 Processing pixel data:", pixelArray);

      const pixels = pixelArray.map((pixel: { x: number; y: number; color: number }) => ({
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


  onAuthRequired(callback: (message: string) => void): void {
    this.authRequiredCallback = callback;
  }

  removeAuthRequiredCallback(): void {
    this.authRequiredCallback = null;
  }
}

export const socketService = new SocketService();
export default socketService;
