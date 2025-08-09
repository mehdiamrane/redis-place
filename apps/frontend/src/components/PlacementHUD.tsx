import React, { useState, useEffect } from 'react';

interface PlacementHUDProps {
  selectedPixel: { x: number; y: number } | null;
  onPlacePixel: (color: string) => void;
}

const PlacementHUD: React.FC<PlacementHUDProps> = ({ selectedPixel, onPlacePixel }) => {
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  const colors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#ffffff', '#000000', '#ff8000', '#8000ff', '#008000', '#800000',
    '#808080', '#c0c0c0', '#400080', '#008080'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownActive && cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            setCooldownActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [cooldownActive, cooldownTime]);

  const handlePlacePixel = () => {
    if (cooldownActive || !selectedPixel) return;
    onPlacePixel(selectedColor);
    setCooldownActive(true);
    setCooldownTime(10);
  };

  // Show cooldown state
  if (cooldownActive) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1000,
        textAlign: 'center'
      }}>
        <div style={{ color: '#ff9900', fontWeight: 'bold' }}>
          Cooldown: {(cooldownTime / 10).toFixed(1)}s
        </div>
      </div>
    );
  }

  // Show prompt when no pixel selected
  if (!selectedPixel) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1000,
        textAlign: 'center'
      }}>
        <div style={{ color: '#aaa' }}>
          Click on a pixel to paint
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 1000,
      minWidth: '300px',
      textAlign: 'center'
    }}>
      <div style={{ color: '#ffff00', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
        Selected: ({selectedPixel.x}, {selectedPixel.y})
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>Choose color:</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '6px',
          marginBottom: '16px',
          justifyContent: 'center',
          maxWidth: '280px',
          margin: '0 auto 16px auto'
        }}>
          {colors.map(color => (
            <div
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: color,
                cursor: 'pointer',
                border: selectedColor === color ? '3px solid white' : '2px solid #666',
                borderRadius: '4px',
                transition: 'border-color 0.2s'
              }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handlePlacePixel}
        disabled={cooldownActive}
        style={{
          padding: '12px 24px',
          backgroundColor: cooldownActive ? '#666' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: cooldownActive ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'background-color 0.2s'
        }}
      >
        Paint Pixel
      </button>

      <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
        Press ESC or drag to deselect
      </div>
    </div>
  );
};

export default PlacementHUD;