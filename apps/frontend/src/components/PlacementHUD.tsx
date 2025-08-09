import React, { useState, useEffect } from 'react';

interface PlacementHUDProps {
  selectedPixel: { x: number; y: number } | null;
  onPlacePixel: (color: string) => void;
  onColorPreview: (color: string | null) => void;
}

const PlacementHUD: React.FC<PlacementHUDProps> = ({ selectedPixel, onPlacePixel, onColorPreview }) => {
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

  // Handle keyboard shortcuts when pixel is selected (but not during cooldown)
  useEffect(() => {
    if (!selectedPixel || cooldownActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to paint
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePlacePixel();
        return;
      }

      // Color selection keys: 1-9, 0, Q, W, E, R, T, Y
      let colorIndex = -1;
      
      // Numbers 1-9 map to colors 0-8
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 9) {
        colorIndex = keyNum - 1;
      }
      // 0 maps to color 9
      else if (e.key === '0') {
        colorIndex = 9;
      }
      // Letter keys for colors 10-15
      else {
        const letterKeys = ['q', 'w', 'e', 'r', 't', 'y'];
        const letterIndex = letterKeys.indexOf(e.key.toLowerCase());
        if (letterIndex !== -1) {
          colorIndex = 10 + letterIndex;
        }
      }

      if (colorIndex >= 0 && colorIndex < colors.length) {
        setSelectedColor(colors[colorIndex]);
        onColorPreview(colors[colorIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedPixel, cooldownActive, colors, onColorPreview]);

  // Set up color preview when color changes (but not during cooldown)
  useEffect(() => {
    if (selectedPixel && !cooldownActive) {
      onColorPreview(selectedColor);
    } else {
      onColorPreview(null);
    }
  }, [selectedColor, selectedPixel, cooldownActive, onColorPreview]);

  // Clear preview when pixel is deselected or cooldown starts
  useEffect(() => {
    if (!selectedPixel || cooldownActive) {
      onColorPreview(null);
    }
  }, [selectedPixel, cooldownActive, onColorPreview]);

  const handlePlacePixel = () => {
    if (cooldownActive || !selectedPixel) return;
    onPlacePixel(selectedColor);
    setCooldownActive(true);
    setCooldownTime(50); // 5 seconds at 100ms intervals
  };

  const handleColorSelect = (color: string) => {
    if (cooldownActive) return; // Don't allow color changes during cooldown
    setSelectedColor(color);
    onColorPreview(color);
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
          {colors.map((color, index) => {
            // Generate keyboard label: 1-9, 0, Q, W, E, R, T, Y
            let keyLabel;
            if (index < 9) {
              keyLabel = (index + 1).toString();
            } else if (index === 9) {
              keyLabel = '0';
            } else {
              const letterKeys = ['Q', 'W', 'E', 'R', 'T', 'Y'];
              keyLabel = letterKeys[index - 10];
            }

            return (
              <div
                key={color}
                onClick={() => handleColorSelect(color)}
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: selectedColor === color ? '3px solid white' : '2px solid #666',
                  borderRadius: '4px',
                  transition: 'border-color 0.2s',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: color === '#ffffff' || color === '#ffff00' || color === '#00ffff' ? '#000' : '#fff',
                  textShadow: color === '#ffffff' || color === '#ffff00' || color === '#00ffff' ? 'none' : '1px 1px 1px rgba(0,0,0,0.8)'
                }}>
                  {keyLabel}
                </span>
              </div>
            );
          })}
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

      <div style={{ marginTop: '12px', fontSize: '11px', color: '#888' }}>
        <div>ESC: deselect • ENTER: paint • 1-9, 0, Q-Y: select color</div>
      </div>
    </div>
  );
};

export default PlacementHUD;