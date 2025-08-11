import { create } from "zustand";
import socketService from "../services/socketService";

export interface PlacedPixel {
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

export interface CanvasState {
  // Canvas data
  placedPixels: PlacedPixel[];
  isCanvasLoading: boolean;
  loadingMessage: string;

  // Canvas interaction
  hoveredPixel: { x: number; y: number };
  selectedPixel: { x: number; y: number } | null;
  cursorPosition: { x: number; y: number } | null;
  previewColor: string | null;

  // Canvas view
  zoom: number;
  pan: { x: number; y: number };

  // Connection status
  connectionStatus: "connecting" | "connected" | "disconnected";

  // Cooldown
  cooldownActive: boolean;

  // Heatmap state
  showHeatmap: boolean;
  heatmapTimeRange: number;
  heatmapData: { x: number; y: number; intensity: number }[];
  maxHeatmapIntensity: number;
}

export interface CanvasActions {
  // Canvas data actions
  setPlacedPixels: (pixels: PlacedPixel[]) => void;
  addPixel: (pixel: PlacedPixel) => void;
  updatePixel: (x: number, y: number, color: string, timestamp: number) => void;
  setCanvasLoading: (loading: boolean, message?: string) => void;

  // Canvas interaction actions
  setHoveredPixel: (x: number, y: number) => void;
  setSelectedPixel: (pixel: { x: number; y: number } | null) => void;
  setCursorPosition: (position: { x: number; y: number } | null) => void;
  setPreviewColor: (color: string | null) => void;

  // Canvas view actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;

  // Connection actions
  setConnectionStatus: (status: "connecting" | "connected" | "disconnected") => void;

  // Cooldown actions
  setCooldownActive: (active: boolean) => void;

  // Heatmap actions
  setShowHeatmap: (show: boolean) => void;
  setHeatmapTimeRange: (hours: number) => void;
  setHeatmapData: (data: { x: number; y: number; intensity: number }[], maxIntensity: number) => void;

  // Complex actions
  placePixel: (color: string) => void;
  rollbackPixelPlacement: (x: number, y: number) => void;
  loadInitialCanvas: () => Promise<void>;
}

export type CanvasStore = CanvasState & CanvasActions;

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // State
  placedPixels: [],
  isCanvasLoading: true,
  loadingMessage: "Connecting to backend...",
  hoveredPixel: { x: -1, y: -1 },
  selectedPixel: null,
  cursorPosition: null,
  previewColor: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  connectionStatus: "connecting",
  cooldownActive: false,
  showHeatmap: false,
  heatmapTimeRange: 24,
  heatmapData: [],
  maxHeatmapIntensity: 0,

  // Actions
  setPlacedPixels: (pixels: PlacedPixel[]) => {
    set({ placedPixels: pixels });
  },

  addPixel: (pixel: PlacedPixel) => {
    set((state) => ({
      placedPixels: [...state.placedPixels, pixel],
    }));
  },

  updatePixel: (x: number, y: number, color: string, timestamp: number) => {
    set((state) => {
      const filtered = state.placedPixels.filter((pixel) => !(pixel.x === x && pixel.y === y));
      return {
        placedPixels: [...filtered, { x, y, color, timestamp }],
      };
    });
  },

  setCanvasLoading: (loading: boolean, message?: string) => {
    set({
      isCanvasLoading: loading,
      loadingMessage: message || "Loading...",
    });
  },

  setHoveredPixel: (x: number, y: number) => {
    set({ hoveredPixel: { x, y } });
  },

  setSelectedPixel: (pixel: { x: number; y: number } | null) => {
    set({ selectedPixel: pixel });
  },

  setCursorPosition: (position: { x: number; y: number } | null) => {
    set({ cursorPosition: position });
  },

  setPreviewColor: (color: string | null) => {
    set({ previewColor: color });
  },

  setZoom: (zoom: number) => {
    set({ zoom });
  },

  setPan: (pan: { x: number; y: number }) => {
    set({ pan });
  },

  setConnectionStatus: (status: "connecting" | "connected" | "disconnected") => {
    set({ connectionStatus: status });
  },

  setCooldownActive: (active: boolean) => {
    set({ cooldownActive: active });
  },

  setShowHeatmap: (show: boolean) => {
    set({ showHeatmap: show });
  },

  setHeatmapTimeRange: (hours: number) => {
    set({ heatmapTimeRange: hours });
  },

  setHeatmapData: (data: { x: number; y: number; intensity: number }[], maxIntensity: number) => {
    set({
      heatmapData: data,
      maxHeatmapIntensity: maxIntensity,
    });
  },

  placePixel: (color: string) => {
    const { selectedPixel, cooldownActive } = get();

    if (!selectedPixel || cooldownActive) {
      return;
    }

    // Optimistic update: immediately add pixel to local state
    const optimisticPixel: PlacedPixel = {
      x: selectedPixel.x,
      y: selectedPixel.y,
      color: color,
      timestamp: Date.now(),
    };

    // Update local state immediately
    set((state) => {
      const filtered = state.placedPixels.filter(
        (pixel) => !(pixel.x === selectedPixel.x && pixel.y === selectedPixel.y)
      );
      return {
        placedPixels: [...filtered, optimisticPixel],
        selectedPixel: null,
      };
    });

    // Send to server
    const colorId = socketService.hexToColorId(color);
    socketService.placePixel(selectedPixel.x, selectedPixel.y, colorId);
  },

  rollbackPixelPlacement: (x: number, y: number) => {
    set((state) => {
      // Remove the optimistically placed pixel and restore previous state
      const filtered = state.placedPixels.filter(
        (pixel) => !(pixel.x === x && pixel.y === y)
      );
      return {
        placedPixels: filtered,
        cooldownActive: false,
      };
    });
  },

  loadInitialCanvas: async () => {
    const loadingStartTime = Date.now();

    try {
      set({ loadingMessage: "Loading canvas snapshot..." });
      const pixels = await socketService.loadCanvas();
      set({ placedPixels: pixels });
    } catch (error) {
      console.error("Error loading canvas:", error);
      set({ loadingMessage: "Failed to load canvas" });
    } finally {
      // Ensure loading screen shows for at least 1 second
      const elapsedTime = Date.now() - loadingStartTime;
      const minDisplayTime = 1000;

      if (elapsedTime < minDisplayTime) {
        setTimeout(() => {
          set({ isCanvasLoading: false });
        }, minDisplayTime - elapsedTime);
      } else {
        set({ isCanvasLoading: false });
      }
    }
  },
}));
