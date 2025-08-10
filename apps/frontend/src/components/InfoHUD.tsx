import React from 'react';
import { HUDPanel, HUDRow, HUDLabel, HUDValue } from './ui';

interface InfoHUDProps {
  pixelX: number;
  pixelY: number;
  zoom: number;
  cursorPosition: { x: number; y: number } | null;
}

const InfoHUD: React.FC<InfoHUDProps> = ({ pixelX, pixelY, zoom, cursorPosition }) => {
  return (
    <HUDPanel 
      position="relative"
      interactive={false}
      style={{ width: 'fit-content', gap: '2px' }}
    >
      <HUDRow>
        <HUDLabel>Selection:</HUDLabel>
        <HUDValue>{cursorPosition ? `(${cursorPosition.x}, ${cursorPosition.y})` : 'None'}</HUDValue>
      </HUDRow>
      <HUDRow>
        <HUDLabel>Hovered:</HUDLabel>
        <HUDValue>{pixelX >= 0 && pixelY >= 0 ? `(${pixelX}, ${pixelY})` : 'N/A'}</HUDValue>
      </HUDRow>
      <HUDRow>
        <HUDLabel>Zoom:</HUDLabel>
        <HUDValue>{zoom.toFixed(1)}x</HUDValue>
      </HUDRow>
    </HUDPanel>
  );
};

export default InfoHUD;