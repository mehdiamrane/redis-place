import redis from './redis';
import { CanvasSnapshot } from './types';
import { colorIndexToHex, hexToColorIndex } from '@redis-place/shared';

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 1000;
export const CANVAS_KEY = 'canvas:pixels';
export const SNAPSHOT_KEY = 'canvas:snapshot';
export const PLACED_PIXELS_KEY = 'canvas:placed';

export class CanvasManager {
  static pixelToIndex(x: number, y: number): number {
    return y * CANVAS_WIDTH + x;
  }

  static indexToPixel(index: number): { x: number; y: number } {
    return {
      x: index % CANVAS_WIDTH,
      y: Math.floor(index / CANVAS_WIDTH)
    };
  }

  static async setPixel(x: number, y: number, color: number): Promise<void> {
    if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
      throw new Error('Invalid pixel coordinates');
    }
    if (color < 0 || color > 15) {
      throw new Error('Invalid color value (must be 0-15)');
    }

    const pixelIndex = this.pixelToIndex(x, y);
    // Each u4 field takes 4 bits, so we need to multiply by 4 for the bit offset
    const bitOffset = pixelIndex * 4;
    await redis.bitfield(CANVAS_KEY, 'SET', 'u4', bitOffset, color);
    
    // Track placed pixels for efficient snapshot generation
    const pixelKey = `${x}:${y}`;
    await redis.sadd(PLACED_PIXELS_KEY, pixelKey);
    
    // Regenerate snapshot asynchronously (non-blocking)
    this.generateSnapshot().catch(error => 
      console.error('Async snapshot generation failed:', error)
    );
  }

  static async getPixel(x: number, y: number): Promise<number> {
    if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
      return 0;
    }

    const pixelIndex = this.pixelToIndex(x, y);
    // Each u4 field takes 4 bits, so we need to multiply by 4 for the bit offset
    const bitOffset = pixelIndex * 4;
    const [color] = await redis.bitfield(CANVAS_KEY, 'GET', 'u4', bitOffset) as [number];
    console.log('Pixel color:', color);
    
    return color || 0;
  }

  static async generateSnapshot(): Promise<CanvasSnapshot> {
    console.log('Generating canvas snapshot...');
    const pixels: { x: number; y: number; color: number }[] = [];
    
    // Check if canvas exists
    const canvasExists = await redis.exists(CANVAS_KEY);
    if (!canvasExists) {
      const snapshot: CanvasSnapshot = {
        data: JSON.stringify([]),
        timestamp: Date.now(),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
      };
      await redis.set(SNAPSHOT_KEY, JSON.stringify(snapshot));
      console.log('Generated empty canvas snapshot');
      return snapshot;
    }

    // Get all placed pixels from the tracked set
    console.log('Loading placed pixels from Redis set...');
    const placedPixelKeys = await redis.smembers(PLACED_PIXELS_KEY);
    
    console.log(`Found ${placedPixelKeys.length} placed pixels to load`);
    
    // Load color for each placed pixel
    for (const pixelKey of placedPixelKeys) {
      const [xStr, yStr] = pixelKey.split(':');
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);
      
      if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
        const color = await this.getPixel(x, y);
        if (color > 0) {
          pixels.push({ x, y, color });
        }
      }
    }
    
    const snapshot: CanvasSnapshot = {
      data: JSON.stringify(pixels),
      timestamp: Date.now(),
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT
    };

    await redis.set(SNAPSHOT_KEY, JSON.stringify(snapshot));
    console.log(`Generated snapshot with ${pixels.length} pixels`);
    return snapshot;
  }

  static async getSnapshot(): Promise<CanvasSnapshot | null> {
    try {
      const snapshotData = await redis.get(SNAPSHOT_KEY);
      if (!snapshotData) {
        return await this.generateSnapshot();
      }
      return JSON.parse(snapshotData);
    } catch (error) {
      console.error('Error getting snapshot:', error);
      return await this.generateSnapshot();
    }
  }

  static async clearCanvas(): Promise<void> {
    console.log('Clearing canvas data...');
    await redis.del(CANVAS_KEY);
    await redis.del(SNAPSHOT_KEY);
    await redis.del(PLACED_PIXELS_KEY);
    console.log('Canvas data cleared');
  }

  static async initializeCanvas(): Promise<void> {
    // Check if canvas exists, if not initialize it
    const canvasExists = await redis.exists(CANVAS_KEY);
    if (!canvasExists) {
      console.log('Initializing empty canvas...');
      // Initialize canvas with a single pixel to create the key
      await redis.bitfield(CANVAS_KEY, 'SET', 'u4', 0, 0);
    }
    
    // Generate snapshot for fast loading
    await this.generateSnapshot();
  }

  static colorIndexToHex(colorIndex: number): string {
    return colorIndexToHex(colorIndex);
  }

  static hexToColorIndex(hex: string): number {
    return hexToColorIndex(hex);
  }
}