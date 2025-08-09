import React from 'react';

interface InfoHUDProps {
  pixelX: number;
  pixelY: number;
  zoom: number;
}

const InfoHUD: React.FC<InfoHUDProps> = ({ pixelX, pixelY, zoom }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 1000,
      pointerEvents: 'none'
    }}>
      <div>
        Hovered: {pixelX >= 0 && pixelY >= 0 ? `(${pixelX}, ${pixelY})` : 'N/A'}
      </div>
      <div>
        Zoom: {zoom.toFixed(1)}x
      </div>
    </div>
  );
};

export default InfoHUD;