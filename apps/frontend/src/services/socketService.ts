import { io, Socket } from "socket.io-client";
import { colorIdToHex, hexToColorId } from "@redis-place/shared";
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
  private rateLimitedCallback: ((data: { message: string; remainingSeconds: number; x: number; y: number }) => void) | null = null;
  private connectionStatusCallback: ((status: 'connecting' | 'connected' | 'disconnected') => void) | null = null;

  connect(): void {
    if (this.socket?.connected) {
      this.connectionStatusCallback?.('connected');
      return;
    }

    // Notify connecting state
    this.connectionStatusCallback?.('connecting');

    this.socket = io(import.meta.env.VITE_SERVER_URL);

    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.connectionStatusCallback?.('connected');
      const sessionToken = AuthService.getSessionToken();
      this.socket?.emit("join-canvas", { sessionToken });
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.connectionStatusCallback?.('disconnected');
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

    this.socket.on("rate-limited", (data) => {
      console.log("Rate limited:", data.message);
      if (this.rateLimitedCallback) {
        this.rateLimitedCallback(data);
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
        color: colorIdToHex(pixel.color) || '#ffffff', // Default to white for empty pixels
        timestamp: Date.now(),
      }));

      console.log("✨ Final pixels array:", pixels);
      return pixels;
    } catch (error) {
      console.error("❌ Error parsing canvas data:", error);
      return [];
    }
  }

  colorIdToHex(colorId: number): string | null {
    return colorIdToHex(colorId);
  }

  hexToColorId(hex: string): number {
    const id = hexToColorId(hex);
    console.log(`Color mapping: ${hex} -> id ${id}`);
    return id;
  }


  onAuthRequired(callback: (message: string) => void): void {
    this.authRequiredCallback = callback;
  }

  removeAuthRequiredCallback(): void {
    this.authRequiredCallback = null;
  }

  onRateLimited(callback: (data: { message: string; remainingSeconds: number; x: number; y: number }) => void): void {
    this.rateLimitedCallback = callback;
  }

  removeRateLimitedCallback(): void {
    this.rateLimitedCallback = null;
  }

  onConnectionStatusChange(callback: (status: 'connecting' | 'connected' | 'disconnected') => void): void {
    this.connectionStatusCallback = callback;
  }

  removeConnectionStatusCallback(): void {
    this.connectionStatusCallback = null;
  }
}

export const socketService = new SocketService();
export default socketService;
