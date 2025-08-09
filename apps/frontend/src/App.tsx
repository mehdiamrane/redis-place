import { useState, useEffect } from 'react'
import Canvas from './components/Canvas'
import InfoHUD from './components/InfoHUD'
import PlacementHUD from './components/PlacementHUD'
import socketService from './services/socketService'
import './App.css'

interface PlacedPixel {
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

function App() {
  const [hoveredPixel, setHoveredPixel] = useState({ x: -1, y: -1 });
  const [zoom, setZoom] = useState(1);
  const [placedPixels, setPlacedPixels] = useState<PlacedPixel[]>([]);
  const [selectedPixel, setSelectedPixel] = useState<{ x: number; y: number } | null>(null);
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [cooldownActive, setCooldownActive] = useState(false);

  useEffect(() => {
    socketService.connect();

    const loadInitialCanvas = async () => {
      try {
        const pixels = await socketService.loadCanvas();
        setPlacedPixels(pixels);
      } catch (error) {
        console.error('Error loading canvas:', error);
      }
    };

    loadInitialCanvas();

    socketService.onPixelUpdate((data) => {
      const newPixel: PlacedPixel = {
        x: data.x,
        y: data.y,
        color: socketService.colorIndexToHex(data.color),
        timestamp: data.timestamp
      };

      setPlacedPixels(prev => {
        const filtered = prev.filter(pixel => !(pixel.x === data.x && pixel.y === data.y));
        return [...filtered, newPixel];
      });
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handlePixelHover = (x: number, y: number) => {
    setHoveredPixel({ x, y });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handlePixelClick = (x: number, y: number) => {
    setSelectedPixel({ x, y });
    // Update cursor position to match clicked pixel for continuity
    setCursorPosition({ x, y });
  };

  const handleDeselectPixel = () => {
    setSelectedPixel(null);
    setPreviewColor(null);
    setCursorPosition(null); // Clear cursor position
  };

  const handleColorPreview = (color: string | null) => {
    setPreviewColor(color);
  };

  const handleCooldownChange = (active: boolean) => {
    setCooldownActive(active);
  };

  // Handle global keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys and Space for navigation (not when typing in color picker)
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        return;
      }

      // Arrow key navigation (when cursor position is active)
      if (e.key.startsWith('Arrow') && cursorPosition) {
        e.preventDefault();
        
        setCursorPosition(prev => {
          if (!prev) return null; // Safety check
          let newX = prev.x;
          let newY = prev.y;

          switch (e.key) {
            case 'ArrowUp':
              newY = Math.max(0, prev.y - 1);
              break;
            case 'ArrowDown':
              newY = Math.min(999, prev.y + 1);
              break;
            case 'ArrowLeft':
              newX = Math.max(0, prev.x - 1);
              break;
            case 'ArrowRight':
              newX = Math.min(999, prev.x + 1);
              break;
          }

          const newPos = { x: newX, y: newY };
          // Auto-select the new cursor position (allowed even during cooldown)
          setSelectedPixel(newPos);
          return newPos;
        });
      }
      
      // Space bar for pixel selection (allowed even during cooldown, but needs active cursor)
      if (e.key === ' ' && cursorPosition) {
        e.preventDefault();
        setSelectedPixel({ x: cursorPosition.x, y: cursorPosition.y });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cursorPosition, selectedPixel, cooldownActive]);

  const handlePlacePixel = (color: string) => {
    console.log('handlePlacePixel called with:', { color, selectedPixel });
    if (!selectedPixel) {
      console.log('No selected pixel, returning');
      return;
    }
    
    // Optimistic update: Add pixel immediately for instant feedback
    const optimisticPixel = {
      x: selectedPixel.x,
      y: selectedPixel.y,
      color: color,
      timestamp: Date.now()
    };
    
    setPlacedPixels(prev => {
      const filtered = prev.filter(pixel => !(pixel.x === selectedPixel.x && pixel.y === selectedPixel.y));
      return [...filtered, optimisticPixel];
    });
    
    const colorIndex = socketService.hexToColorIndex(color);
    console.log('Color converted to index:', colorIndex);
    socketService.placePixel(selectedPixel.x, selectedPixel.y, colorIndex);
    
    // After painting: close interface but keep cursor position for further navigation
    setSelectedPixel(null);
    // Cursor position stays the same so user can continue moving with arrow keys
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden'
    }}>
      <Canvas
        width={1000}
        height={1000}
        onPixelHover={handlePixelHover}
        onZoomChange={handleZoomChange}
        onPixelClick={handlePixelClick}
        selectedPixel={selectedPixel}
        onDeselectPixel={handleDeselectPixel}
        previewColor={previewColor}
        placedPixels={placedPixels}
      />
      <InfoHUD
        pixelX={hoveredPixel.x}
        pixelY={hoveredPixel.y}
        zoom={zoom}
        cursorPosition={cursorPosition}
      />
      <PlacementHUD
        selectedPixel={selectedPixel}
        onPlacePixel={handlePlacePixel}
        onColorPreview={handleColorPreview}
        onCooldownChange={handleCooldownChange}
      />
    </div>
  )
}

export default App
