import redis from './redis';
import { CanvasSnapshot } from './types';
import { colorIndexToHex, hexToColorIndex } from '@redis-place/shared';

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 1000;
export const CANVAS_KEY = 'canvas:pixels';
export const SNAPSHOT_KEY = 'canvas:snapshot';
export const PLACED_PIXELS_KEY = 'canvas:placed';
export const HEATMAP_ZONE_SIZE = 50; // 50x50 pixel zones = 20x20 grid

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
    
    // Add heatmap zone tracking
    const zoneX = Math.floor(x / HEATMAP_ZONE_SIZE);
    const zoneY = Math.floor(y / HEATMAP_ZONE_SIZE);
    const now = Date.now();
    
    try {
      await redis.call('TS.ADD', `heatmap:${zoneX}:${zoneY}`, now, 1);
    } catch (error) {
      // If time series doesn't exist, create it first
      try {
        await redis.call('TS.CREATE', `heatmap:${zoneX}:${zoneY}`, 'RETENTION', 604800000); // 7 days
        await redis.call('TS.ADD', `heatmap:${zoneX}:${zoneY}`, now, 1);
      } catch (createError) {
        console.error('Error adding to heatmap time series:', createError);
      }
    }
    
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
        data: [],
        timestamp: Date.now(),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
      };
      await redis.call('JSON.SET', SNAPSHOT_KEY, '$', JSON.stringify(snapshot));
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
      data: pixels,
      timestamp: Date.now(),
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT
    };

    await redis.call('JSON.SET', SNAPSHOT_KEY, '$', JSON.stringify(snapshot));
    console.log(`Generated snapshot with ${pixels.length} pixels`);
    return snapshot;
  }

  static async getSnapshot(): Promise<CanvasSnapshot | null> {
    try {
      const snapshotData = await redis.call('JSON.GET', SNAPSHOT_KEY) as string;
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

  static async getHeatmapData(timeRangeHours = 24, skipCache = false): Promise<{ x: number; y: number; intensity: number }[]> {
    const cacheKey = `heatmap:cache:${timeRangeHours}h`;
    
    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          console.log(`Heatmap cache hit for ${timeRangeHours}h`);
          return JSON.parse(cachedData);
        }
      } catch (error) {
        console.error('Error reading heatmap cache:', error);
        // Continue with fresh calculation if cache read fails
      }
    }
    
    console.log(`Heatmap cache miss (skipCache=${skipCache}) for ${timeRangeHours}h, calculating...`);
    const fromTime = Date.now() - (timeRangeHours * 60 * 60 * 1000);
    
    const zonesX = Math.ceil(CANVAS_WIDTH / HEATMAP_ZONE_SIZE);
    const zonesY = Math.ceil(CANVAS_HEIGHT / HEATMAP_ZONE_SIZE);
    
    // Use pipeline for parallel execution of all time series queries
    const pipeline = redis.pipeline();
    const zones: { x: number; y: number }[] = [];
    
    for (let x = 0; x < zonesX; x++) {
      for (let y = 0; y < zonesY; y++) {
        pipeline.call('TS.RANGE', `heatmap:${x}:${y}`, fromTime, '+');
        zones.push({ x, y });
      }
    }
    
    const results = await pipeline.exec();
    const heatmapData = zones.map((zone, index) => {
      const [err, activity] = results![index];
      const intensity = err ? 0 : (activity as [number, string][]).reduce((sum, [_, value]) => sum + parseInt(value), 0);
      return { ...zone, intensity };
    });
    
    // Cache the result for 5 minutes (300 seconds)
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(heatmapData));
      console.log(`Heatmap data cached for ${timeRangeHours}h`);
    } catch (error) {
      console.error('Error caching heatmap data:', error);
      // Continue without caching if cache write fails
    }
    
    return heatmapData;
  }
}