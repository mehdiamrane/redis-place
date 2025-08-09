import { useState } from 'react'
import Canvas from './components/Canvas'
import HUD from './components/HUD'
import './App.css'

function App() {
  const [hoveredPixel, setHoveredPixel] = useState({ x: -1, y: -1 });
  const [zoom, setZoom] = useState(1);

  const handlePixelHover = (x: number, y: number) => {
    setHoveredPixel({ x, y });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
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
      />
      <HUD
        pixelX={hoveredPixel.x}
        pixelY={hoveredPixel.y}
        zoom={zoom}
      />
    </div>
  )
}

export default App
