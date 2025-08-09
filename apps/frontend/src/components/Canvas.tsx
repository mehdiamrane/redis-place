import React, { useRef, useEffect, useState, useCallback } from 'react';

interface PlacedPixel {
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

interface CanvasProps {
  width: number;
  height: number;
  onPixelHover: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
  placedPixels: PlacedPixel[];
  onPixelClick: (x: number, y: number) => void;
  selectedPixel: { x: number; y: number } | null;
  onDeselectPixel: () => void;
  previewColor: string | null;
}

const Canvas: React.FC<CanvasProps> = ({ width, height, onPixelHover, onZoomChange, placedPixels, onPixelClick, selectedPixel, onDeselectPixel, previewColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number, y: number } | null>(null);
  
  const pixelSize = 10; // Each logical pixel is rendered as 10x10 screen pixels

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

    // Draw the 1000x1000 white area (scaled by pixelSize)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width * pixelSize, height * pixelSize);

    // Draw border around the 1000x1000 area
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(0, 0, width * pixelSize, height * pixelSize);

    // Draw grid lines (always visible now since pixels are larger)
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

    // Draw placed pixels (skip the selected pixel if there's a preview)
    placedPixels.forEach(pixel => {
      // Skip drawing the underlying pixel if we're showing a preview at this position
      if (selectedPixel && previewColor && 
          pixel.x === selectedPixel.x && pixel.y === selectedPixel.y) {
        return;
      }
      
      ctx.fillStyle = pixel.color;
      ctx.fillRect(
        pixel.x * pixelSize, 
        pixel.y * pixelSize, 
        pixelSize, 
        pixelSize
      );
    });

    // Show color preview on selected pixel with more noticeable opacity
    if (selectedPixel && previewColor) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = previewColor;
      ctx.fillRect(
        selectedPixel.x * pixelSize, 
        selectedPixel.y * pixelSize, 
        pixelSize, 
        pixelSize
      );
      ctx.globalAlpha = 1.0;
    }

    // Highlight selected pixel with red outline
    if (selectedPixel) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3 / zoom;
      ctx.strokeRect(
        selectedPixel.x * pixelSize, 
        selectedPixel.y * pixelSize, 
        pixelSize, 
        pixelSize
      );
    }
    
    // Note: Cursor position is now always the same as selected pixel, so no separate cursor visualization needed

    // Highlight hovered pixel with lighter outline (only if different from selected pixel)
    if (hoveredPixel && 
        (!selectedPixel || hoveredPixel.x !== selectedPixel.x || hoveredPixel.y !== selectedPixel.y)) {
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(
        hoveredPixel.x * pixelSize, 
        hoveredPixel.y * pixelSize, 
        pixelSize, 
        pixelSize
      );
    }

    ctx.restore();
  }, [width, height, zoom, pan, hoveredPixel, placedPixels, selectedPixel, previewColor]);

  const getPixelCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const pixelX = Math.floor((canvasX - pan.x) / (zoom * pixelSize));
    const pixelY = Math.floor((canvasY - pan.y) / (zoom * pixelSize));

    if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
      return { x: pixelX, y: pixelY };
    }
    return null;
  }, [zoom, pan, width, height, pixelSize]);

  const constrainPan = useCallback((newPan: { x: number, y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return newPan;

    const canvasPixelWidth = width * pixelSize * zoom;
    const canvasPixelHeight = height * pixelSize * zoom;
    
    // Ensure at least 100 pixels of the canvas are always visible
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
      
      // Check if we actually moved
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        setHasMoved(true);
        // Deselect pixel when starting to drag
        if (!hasMoved) {
          onDeselectPixel();
        }
      }
      
      const newPan = { x: pan.x + deltaX, y: pan.y + deltaY };
      setPan(constrainPan(newPan));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      const pixelCoords = getPixelCoordinates(e.clientX, e.clientY);
      if (pixelCoords) {
        setHoveredPixel(pixelCoords);
        onPixelHover(pixelCoords.x, pixelCoords.y);
      } else {
        setHoveredPixel(null);
        onPixelHover(-1, -1);
      }
    }
  }, [isDragging, dragStart, pan, constrainPan, getPixelCoordinates, onPixelHover, hasMoved, onDeselectPixel]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setHasMoved(false);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const pixelCoords = getPixelCoordinates(e.clientX, e.clientY);
    if (pixelCoords) {
      onPixelClick(pixelCoords.x, pixelCoords.y);
    }
  }, [getPixelCoordinates, onPixelClick]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const wasMoving = hasMoved;
    setIsDragging(false);
    setHasMoved(false);
    
    // Only trigger click if we weren't actually dragging (moving)
    if (!wasMoving) {
      handleClick(e);
    }
  }, [hasMoved, handleClick]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(50, zoom * delta));
    
    // Update zoom
    setZoom(newZoom);
    onZoomChange(newZoom);
    
    // Constrain pan with the new zoom level
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

        return {
          x: Math.max(minPanX, Math.min(maxPanX, prev.x)),
          y: Math.max(minPanY, Math.min(maxPanY, prev.y))
        };
      });
    }
  }, [zoom, onZoomChange, width, height, pixelSize]);

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

  useEffect(() => {
    const handleMouseUpGlobal = () => setIsDragging(false);
    
    // Handle escape key to deselect pixel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPixel) {
        onDeselectPixel();
      }
    };
    
    // Prevent browser zoom on Ctrl+scroll and pinch gestures
    const preventZoom = (e: WheelEvent | TouchEvent) => {
      if ((e as WheelEvent).ctrlKey || (e as TouchEvent).touches?.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('mouseup', handleMouseUpGlobal);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUpGlobal);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
    };
  }, [selectedPixel, onDeselectPixel]);

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

export default Canvas;