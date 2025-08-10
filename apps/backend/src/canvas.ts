import redis from './redis';
import { CanvasSnapshot } from './types';
import { colorIdToHex, hexToColorId } from '@redis-place/shared';

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 1000;
export const CANVAS_KEY = 'canvas:pixels';
export const CANVAS_SNAPSHOT_CACHE_KEY = 'canvas:snapshot:cache';
export const HEATMAP_ZONE_SIZE = 50; // 50x50 pixel zones = 20x20 grid

export class CanvasManager {
  private static isGeneratingSnapshot = false;
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
    if (color < 0 || color > 31) {
      throw new Error('Invalid color value (must be 0-31)');
    }

    const pixelIndex = this.pixelToIndex(x, y);
    // Each u5 field takes 5 bits, so we need to multiply by 5 for the bit offset
    const bitOffset = pixelIndex * 5;
    await redis.bitfield(CANVAS_KEY, 'SET', 'u5', bitOffset, color);
    
    // Invalidate snapshot cache since canvas has changed
    await redis.del(CANVAS_SNAPSHOT_CACHE_KEY);
    console.log('Canvas snapshot cache invalidated due to pixel placement');
    
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
  }

  static async getPixel(x: number, y: number): Promise<number> {
    if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
      return 0;
    }

    const pixelIndex = this.pixelToIndex(x, y);
    // Each u5 field takes 5 bits, so we need to multiply by 5 for the bit offset
    const bitOffset = pixelIndex * 5;
    const [color] = await redis.bitfield(CANVAS_KEY, 'GET', 'u5', bitOffset) as [number];
    console.log('Pixel color:', color);
    
    return color || 0;
  }

  static async generateSnapshot(): Promise<CanvasSnapshot> {
    console.log('Generating canvas snapshot with Redis caching');
    
    // Check if canvas exists
    const canvasExists = await redis.exists(CANVAS_KEY);
    if (!canvasExists) {
      console.log('Canvas does not exist, returning empty snapshot');
      return {
        data: [],
        timestamp: Date.now(),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
      };
    }

    // Check Redis cache first
    const cachedSnapshot = await redis.get(CANVAS_SNAPSHOT_CACHE_KEY);
    if (cachedSnapshot) {
      console.log('Returning cached snapshot from Redis');
      return JSON.parse(cachedSnapshot);
    }
    
    // Prevent multiple simultaneous generations - wait for ongoing generation to complete
    if (this.isGeneratingSnapshot) {
      console.log('Snapshot generation already in progress, waiting for completion...');
      
      // Poll until generation completes (with timeout)
      const maxWaitTime = 30000; // 30 seconds max wait
      const pollInterval = 500; // Check every 500ms
      const startTime = Date.now();
      
      while (this.isGeneratingSnapshot && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Check if cache is now available
        const cachedSnapshot = await redis.get(CANVAS_SNAPSHOT_CACHE_KEY);
        if (cachedSnapshot) {
          console.log('Returning snapshot cached by concurrent generation');
          return JSON.parse(cachedSnapshot);
        }
      }
      
      // If we timed out, let this request proceed (rare edge case)
      if (this.isGeneratingSnapshot) {
        console.log('Timed out waiting for concurrent generation, proceeding anyway');
      }
    }
    
    this.isGeneratingSnapshot = true;
    
    try {
      // Optimized bitfield reading with larger pipelines for faster processing
      console.log('Reading bitfield with optimized pipelines...');
      const pixels: { x: number; y: number; color: number }[] = [];
      const totalPixels = CANVAS_WIDTH * CANVAS_HEIGHT;
      const pipelineSize = 50000; // Larger but safer pipeline size
      
      let processedPixels = 0;
      
      for (let i = 0; i < totalPixels; i += pipelineSize) {
        const pipeline = redis.pipeline();
        const endIdx = Math.min(i + pipelineSize, totalPixels);
        
        // Add BITFIELD GET commands to pipeline
        for (let j = i; j < endIdx; j++) {
          pipeline.bitfield(CANVAS_KEY, 'GET', 'u5', j * 5);
        }
        
        const results = await pipeline.exec();
        
        // Process results efficiently
        if (results) {
          for (let k = 0; k < results.length; k++) {
            const [err, result] = results[k];
            const pixelIndex = i + k;
            
            if (!err && result && Array.isArray(result) && result.length > 0) {
              const color = result[0] || 0;
              if (color > 0) { // Only include non-empty pixels
                const x = pixelIndex % CANVAS_WIDTH;
                const y = Math.floor(pixelIndex / CANVAS_WIDTH);
                pixels.push({ x, y, color });
              }
            }
          }
        }
        
        processedPixels += (endIdx - i);
        
        // Log progress every 100k pixels
        if (processedPixels % 100000 === 0 || processedPixels === totalPixels) {
          console.log(`Processed ${processedPixels}/${totalPixels} pixels, found ${pixels.length} non-empty pixels`);
        }
      }
      
      console.log(`Completed optimized snapshot generation: ${pixels.length} non-empty pixels found`);
      
      const snapshot: CanvasSnapshot = {
        data: pixels,
        timestamp: Date.now(),
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
      };
      
      // Cache the result in Redis (no expiration, invalidated on pixel changes)
      await redis.set(CANVAS_SNAPSHOT_CACHE_KEY, JSON.stringify(snapshot));
      console.log('Snapshot cached in Redis (valid until canvas changes)');
      
      return snapshot;
    } finally {
      this.isGeneratingSnapshot = false;
    }
  }

  static async getSnapshot(): Promise<CanvasSnapshot> {
    // Always generate snapshot fresh from bitfield (single source of truth)
    return await this.generateSnapshot();
  }

  static async clearCanvas(): Promise<void> {
    console.log('Clearing canvas data...');
    await redis.del(CANVAS_KEY);
    await redis.del(CANVAS_SNAPSHOT_CACHE_KEY);
    console.log('Canvas data and cache cleared');
  }

  static async initializeCanvas(): Promise<void> {
    // Check if canvas exists, if not initialize it
    const canvasExists = await redis.exists(CANVAS_KEY);
    if (!canvasExists) {
      console.log('Initializing empty canvas...');
      // Initialize canvas with a single pixel to create the key
      await redis.bitfield(CANVAS_KEY, 'SET', 'u5', 0, 0);
    }
    console.log('Canvas initialized');
  }

  static colorIdToHex(colorId: number): string | null {
    return colorIdToHex(colorId);
  }

  static hexToColorId(hex: string): number {
    return hexToColorId(hex);
  }

  // Legacy compatibility methods
  static colorIndexToHex(colorIndex: number): string {
    const hex = colorIdToHex(colorIndex);
    return hex || '#ffffff'; // Return white for empty pixels
  }

  static hexToColorIndex(hex: string): number {
    return hexToColorId(hex);
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