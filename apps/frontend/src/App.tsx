import { useState, useEffect } from 'react'
import Canvas from './components/Canvas'
import InfoHUD from './components/InfoHUD'
import PlacementHUD from './components/PlacementHUD'
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

  useEffect(() => {
    const savedPixels = localStorage.getItem('placedPixels');
    if (savedPixels) {
      try {
        setPlacedPixels(JSON.parse(savedPixels));
      } catch (error) {
        console.error('Error loading placed pixels:', error);
      }
    }
  }, []);

  const handlePixelHover = (x: number, y: number) => {
    setHoveredPixel({ x, y });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handlePixelClick = (x: number, y: number) => {
    setSelectedPixel({ x, y });
  };

  const handleDeselectPixel = () => {
    setSelectedPixel(null);
    setPreviewColor(null);
  };

  const handleColorPreview = (color: string | null) => {
    setPreviewColor(color);
  };

  const handlePlacePixel = (color: string) => {
    if (!selectedPixel) return;
    
    const newPixel: PlacedPixel = {
      x: selectedPixel.x,
      y: selectedPixel.y,
      color,
      timestamp: Date.now()
    };

    const updatedPixels = placedPixels.filter(pixel => !(pixel.x === selectedPixel.x && pixel.y === selectedPixel.y));
    updatedPixels.push(newPixel);

    setPlacedPixels(updatedPixels);
    localStorage.setItem('placedPixels', JSON.stringify(updatedPixels));
    // Auto-deselect pixel after painting to close the interface
    setSelectedPixel(null);
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
      />
      <PlacementHUD
        selectedPixel={selectedPixel}
        onPlacePixel={handlePlacePixel}
        onColorPreview={handleColorPreview}
      />
    </div>
  )
}

export default App
