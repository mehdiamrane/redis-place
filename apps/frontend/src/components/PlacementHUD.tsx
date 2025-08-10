import React, { useState, useEffect } from 'react';
import { getAvailableColorIds, colorIdToHex } from '@redis-place/shared';

interface PlacementHUDProps {
  selectedPixel: { x: number; y: number } | null;
  onPlacePixel: (color: string) => void;
  onColorPreview: (color: string | null) => void;
  onCooldownChange: (active: boolean) => void;
}

const PlacementHUD: React.FC<PlacementHUDProps> = ({ selectedPixel, onPlacePixel, onColorPreview, onCooldownChange }) => {
  const [selectedColorId, setSelectedColorId] = useState(5);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  // Get available color IDs
  const availableColorIds = getAvailableColorIds();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownActive && cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            setCooldownActive(false);
            onCooldownChange(false);
            return 0;
          }
          return prev - 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [cooldownActive, cooldownTime, onCooldownChange]);

  // Handle Enter key to paint when pixel is selected (but not during cooldown)
  useEffect(() => {
    if (!selectedPixel || cooldownActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to paint
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePlacePixel();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedPixel, cooldownActive]);

  // Set up color preview when color changes (but not during cooldown)
  useEffect(() => {
    if (selectedPixel && !cooldownActive) {
      const hexColor = colorIdToHex(selectedColorId);
      onColorPreview(hexColor);
    } else {
      onColorPreview(null);
    }
  }, [selectedColorId, selectedPixel, cooldownActive, onColorPreview]);

  // Clear preview when pixel is deselected or cooldown starts
  useEffect(() => {
    if (!selectedPixel || cooldownActive) {
      onColorPreview(null);
    }
  }, [selectedPixel, cooldownActive, onColorPreview]);

  const handlePlacePixel = () => {
    if (cooldownActive || !selectedPixel) return;
    const hexColor = colorIdToHex(selectedColorId);
    if (hexColor) {
      onPlacePixel(hexColor);
      setCooldownActive(true);
      setCooldownTime(10); // 1 second at 100ms intervals
      onCooldownChange(true);
    }
  };

  const handleColorSelect = (colorId: number) => {
    if (cooldownActive) return; // Don't allow color changes during cooldown
    setSelectedColorId(colorId);
  };

  // Show cooldown state - but still allow pixel selection for pre-selection
  if (cooldownActive && !selectedPixel) {
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
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#aaa' }}>
          You can still select pixels while waiting
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
          Click pixel or use SPACE to select
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
      {cooldownActive && (
        <div style={{ color: '#ff9900', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', padding: '6px', backgroundColor: 'rgba(255, 153, 0, 0.2)', borderRadius: '4px' }}>
          Cooldown: {(cooldownTime / 10).toFixed(1)}s - Pre-selecting for next paint
        </div>
      )}
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
          {availableColorIds.map((colorId) => {
            const hexColor = colorIdToHex(colorId);
            if (!hexColor) return null;

            return (
              <div
                key={colorId}
                onClick={() => handleColorSelect(colorId)}
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: hexColor,
                  cursor: cooldownActive ? 'not-allowed' : 'pointer',
                  border: selectedColorId === colorId ? '3px solid white' : '2px solid #666',
                  borderRadius: '4px',
                  transition: 'border-color 0.2s',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: cooldownActive ? 0.5 : 1
                }}
              >
                <span style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: colorId === 1 ? '#000' : '#fff',
                  textShadow: colorId === 1 ? 'none' : '0px 0px 3px rgba(0,0,0,1)',
                }}>
                  {colorId}
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
        {cooldownActive ? `Wait ${(cooldownTime / 10).toFixed(1)}s` : 'Paint Pixel'}
      </button>

      <div style={{ marginTop: '12px', fontSize: '11px', color: '#888' }}>
        <div>ESC: deselect • ENTER: paint</div>
        <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
          SPACE: select pixel • Arrow keys: move cursor
        </div>
      </div>
    </div>
  );
};

export default PlacementHUD;