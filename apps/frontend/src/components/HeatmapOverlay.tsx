import React, { useRef, useEffect, useCallback } from 'react';

interface HeatmapData {
  x: number;
  y: number;
  intensity: number;
}

interface HeatmapOverlayProps {
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
  showHeatmap: boolean;
  heatmapData: HeatmapData[];
  maxIntensity: number;
}

const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({ 
  zoom, 
  pan, 
  showHeatmap,
  heatmapData,
  maxIntensity
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const pixelSize = 10; // Match the main canvas pixel size
  const zoneSize = 50; // Must match backend HEATMAP_ZONE_SIZE


  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showHeatmap || maxIntensity === 0) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw heatmap zones
    heatmapData.forEach(zone => {
      if (zone.intensity > 0) {
        const normalizedIntensity = zone.intensity / maxIntensity;
        
        // Create color gradient: blue (cold) -> green -> yellow -> red (hot)
        let r, g, b;
        if (normalizedIntensity < 0.5) {
          // Blue to green
          const t = normalizedIntensity * 2;
          r = 0;
          g = Math.floor(255 * t);
          b = Math.floor(255 * (1 - t));
        } else {
          // Green to red
          const t = (normalizedIntensity - 0.5) * 2;
          r = Math.floor(255 * t);
          g = Math.floor(255 * (1 - t));
          b = 0;
        }
        
        // Semi-transparent overlay
        const alpha = Math.max(0.2, normalizedIntensity * 0.7);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        
        ctx.fillRect(
          zone.x * zoneSize * pixelSize,
          zone.y * zoneSize * pixelSize,
          zoneSize * pixelSize,
          zoneSize * pixelSize
        );
      }
    });

    ctx.restore();
  }, [heatmapData, maxIntensity, showHeatmap, zoom, pan, zoneSize, pixelSize]);


  // Redraw when any relevant props change
  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  // Resize canvas to match window size
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawHeatmap();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawHeatmap]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Allow clicks to pass through to main canvas
        zIndex: showHeatmap ? 1 : -1,
        opacity: showHeatmap ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
    />
  );
};

export default HeatmapOverlay;