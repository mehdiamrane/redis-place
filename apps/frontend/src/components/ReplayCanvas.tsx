import React, { useRef, useEffect, useState, useCallback } from 'react';

interface PlacedPixel {
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

interface ReplayEvent {
  id: string;
  userId: string;
  x: number;
  y: number;
  color: number;
  timestamp: number;
}

interface ReplayCanvasProps {
  width: number;
  height: number;
  placedPixels: PlacedPixel[];
  currentEvent?: ReplayEvent;
  autoCenterOnPixel?: boolean;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (pan: { x: number, y: number }) => void;
}

const ReplayCanvas: React.FC<ReplayCanvasProps> = ({ 
  width, 
  height, 
  placedPixels, 
  currentEvent,
  autoCenterOnPixel = true,
  onZoomChange, 
  onPanChange 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const pixelSize = 10;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill entire canvas with gray background
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw the white canvas area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width * pixelSize, height * pixelSize);

    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(0, 0, width * pixelSize, height * pixelSize);

    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1 / zoom;
    
    for (let x = 0; x <= width; x++) {
      const pos = x * pixelSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, height * pixelSize);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y++) {
      const pos = y * pixelSize;
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(width * pixelSize, pos);
      ctx.stroke();
    }

    // Draw placed pixels
    placedPixels.forEach(pixel => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(
        pixel.x * pixelSize, 
        pixel.y * pixelSize, 
        pixelSize, 
        pixelSize
      );
    });

    ctx.restore();
  }, [width, height, zoom, pan, placedPixels]);

  const constrainPan = useCallback((newPan: { x: number, y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return newPan;

    const canvasPixelWidth = width * pixelSize * zoom;
    const canvasPixelHeight = height * pixelSize * zoom;
    
    const minVisibleArea = 100;
    
    const maxPanX = canvas.width - minVisibleArea;
    const minPanX = -canvasPixelWidth + minVisibleArea;
    const maxPanY = canvas.height - minVisibleArea;
    const minPanY = -canvasPixelHeight + minVisibleArea;

    return {
      x: Math.max(minPanX, Math.min(maxPanX, newPan.x)),
      y: Math.max(minPanY, Math.min(maxPanY, newPan.y))
    };
  }, [width, height, pixelSize, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const newPan = constrainPan({ x: pan.x + deltaX, y: pan.y + deltaY });
      setPan(newPan);
      onPanChange?.(newPan);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, dragStart, pan, constrainPan, onPanChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(50, zoom * delta));
    
    setZoom(newZoom);
    onZoomChange?.(newZoom);
    
    // Constrain pan with new zoom
    const canvas = canvasRef.current;
    if (canvas) {
      setPan(prev => {
        const canvasPixelWidth = width * pixelSize * newZoom;
        const canvasPixelHeight = height * pixelSize * newZoom;
        
        const minVisibleArea = 100;
        const maxPanX = canvas.width - minVisibleArea;
        const minPanX = -canvasPixelWidth + minVisibleArea;
        const maxPanY = canvas.height - minVisibleArea;
        const minPanY = -canvasPixelHeight + minVisibleArea;

        const newPan = {
          x: Math.max(minPanX, Math.min(maxPanX, prev.x)),
          y: Math.max(minPanY, Math.min(maxPanY, prev.y))
        };
        onPanChange?.(newPan);
        return newPan;
      });
    }
  }, [zoom, onZoomChange, onPanChange, width, height, pixelSize]);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Auto-center on current event pixel
  useEffect(() => {
    if (!currentEvent || !autoCenterOnPixel || isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate the pixel position in canvas coordinates
    const pixelCenterX = (currentEvent.x + 0.5) * pixelSize * zoom;
    const pixelCenterY = (currentEvent.y + 0.5) * pixelSize * zoom;

    // Calculate desired pan to center this pixel
    const desiredPanX = canvas.width / 2 - pixelCenterX;
    const desiredPanY = canvas.height / 2 - pixelCenterY;

    // Constrain the pan to valid bounds
    const constrainedPan = constrainPan({ x: desiredPanX, y: desiredPanY });

    // Smooth transition to new pan position
    const animatePan = () => {
      const duration = 300; // ms
      const startTime = Date.now();
      const startPan = { ...pan };
      const deltaX = constrainedPan.x - startPan.x;
      const deltaY = constrainedPan.y - startPan.y;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const newPan = {
          x: startPan.x + deltaX * easeProgress,
          y: startPan.y + deltaY * easeProgress
        };

        setPan(newPan);
        onPanChange?.(newPan);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    };

    animatePan();
  }, [currentEvent, autoCenterOnPixel, zoom, constrainPan, onPanChange, isDragging]);

  useEffect(() => {
    const handleMouseUpGlobal = () => setIsDragging(false);
    
    const preventZoom = (e: WheelEvent | TouchEvent) => {
      if ((e as WheelEvent).ctrlKey || (e as TouchEvent).touches?.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('mouseup', handleMouseUpGlobal);
    document.addEventListener('wheel', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUpGlobal);
      document.removeEventListener('wheel', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        cursor: isDragging ? 'grabbing' : 'grab',
        width: '100vw',
        height: '100vh'
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    />
  );
};

export default ReplayCanvas;