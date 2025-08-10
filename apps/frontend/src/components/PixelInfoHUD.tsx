import React, { useState, useEffect } from 'react';
import { colorIdToHex, isEmptyPixel } from '@redis-place/shared';

interface PixelInfoData {
  x: number;
  y: number;
  currentColor: number;
  lastPlacement?: {
    userId: string;
    x: number;
    y: number;
    color: number;
    timestamp: number;
  } | null;
  message?: string;
  searchAttempts?: number;
}

interface PixelInfoHUDProps {
  selectedPixel: { x: number; y: number } | null;
}

const PixelInfoHUD: React.FC<PixelInfoHUDProps> = ({ selectedPixel }) => {
  const [infoData, setInfoData] = useState<PixelInfoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pixel info when selected pixel changes
  useEffect(() => {
    if (!selectedPixel || selectedPixel.x < 0 || selectedPixel.y < 0) {
      setInfoData(null);
      setError(null);
      return;
    }

    const fetchInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/pixel-info/${selectedPixel.x}/${selectedPixel.y}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch pixel info');
        }
        
        const data = await response.json();
        setInfoData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pixel info');
        console.error('Error fetching pixel info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [selectedPixel]);

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'now';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '100px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 1000,
      width: '280px',
      minHeight: '60px'
    }}>
      {/* Header */}
      <div style={{
        fontSize: '13px',
        fontWeight: 'bold',
        marginBottom: '8px',
        borderBottom: '1px solid #555',
        paddingBottom: '5px'
      }}>
        📍 Pixel Info
      </div>

      {!selectedPixel && (
        <div style={{ color: '#888', fontSize: '11px' }}>
          Select a pixel to view its info
        </div>
      )}

      {selectedPixel && loading && (
        <div style={{ color: '#ccc', fontSize: '11px' }}>
          🔍 Searching for pixel ({selectedPixel.x}, {selectedPixel.y})...
        </div>
      )}

      {selectedPixel && error && (
        <div style={{ color: '#f44336', fontSize: '11px' }}>
          ❌ {error}
        </div>
      )}

      {selectedPixel && infoData && !loading && !error && (
        <div>
          {/* Coordinates */}
          <div style={{ marginBottom: '8px', fontSize: '11px', color: '#ccc' }}>
            Position: ({infoData.x}, {infoData.y})
          </div>

          {/* Current Color */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '6px',
            borderRadius: '3px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: colorIdToHex(infoData.currentColor) || 'transparent',
                border: '1px solid white',
                borderRadius: '2px'
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
              Current: {isEmptyPixel(infoData.currentColor) ? 'Empty' : `Color ${infoData.currentColor}`}
            </span>
          </div>

          {/* Last Placement Info */}
          {isEmptyPixel(infoData.currentColor) ? (
            <div style={{ fontSize: '11px', color: '#666' }}>
              This pixel is empty (no color placed)
            </div>
          ) : infoData.lastPlacement ? (
            <div>
              <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '5px' }}>
                Last placed by:
              </div>
              
              <div style={{
                backgroundColor: 'rgba(76, 175, 80, 0.15)',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid rgba(76, 175, 80, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      backgroundColor: colorIdToHex(infoData.lastPlacement.color) || 'transparent',
                      border: '1px solid white',
                      borderRadius: '2px'
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                    {infoData.lastPlacement.userId}
                  </span>
                </div>
                
                <div style={{ fontSize: '10px', color: '#aaa' }}>
                  {new Date(infoData.lastPlacement.timestamp).toLocaleString()}
                </div>
                
                <div style={{ fontSize: '10px', color: '#999' }}>
                  {getRelativeTime(infoData.lastPlacement.timestamp)}
                </div>
              </div>
              
              {infoData.searchAttempts && infoData.searchAttempts > 1 && (
                <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
                  Found after searching {infoData.searchAttempts} batches
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#666' }}>
              {infoData.message || 'No placement found'}
              {infoData.searchAttempts && (
                <div style={{ fontSize: '9px', marginTop: '2px' }}>
                  Searched {infoData.searchAttempts} batches
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PixelInfoHUD;