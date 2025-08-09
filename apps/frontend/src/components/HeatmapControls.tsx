import React from 'react';

interface HeatmapControlsProps {
  showHeatmap: boolean;
  onToggleHeatmap: (show: boolean) => void;
  timeRange: number;
  onTimeRangeChange: (hours: number) => void;
  onRefreshData: () => void;
}

const HeatmapControls: React.FC<HeatmapControlsProps> = ({
  showHeatmap,
  onToggleHeatmap,
  timeRange,
  onTimeRangeChange,
  onRefreshData
}) => {
  const timeRangeOptions = [
    { value: 1, label: '1h' },
    { value: 6, label: '6h' },
    { value: 24, label: '24h' },
    { value: 168, label: '7d' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      minWidth: '200px'
    }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
        Activity Heatmap
      </h3>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => onToggleHeatmap(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Show Heatmap
        </label>
      </div>

      {showHeatmap && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: '500' }}>
            Time Range:
          </label>
          <div style={{ display: 'flex', gap: '5px' }}>
            {timeRangeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onTimeRangeChange(option.value)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: timeRange === option.value ? '#4CAF50' : '#555',
                  color: 'white',
                  transition: 'background-color 0.2s'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={onRefreshData}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              marginTop: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F57C00'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF9800'}
          >
            🔄 Refresh (Skip Cache)
          </button>
        </div>
      )}

      {showHeatmap && (
        <div style={{ 
          fontSize: '12px', 
          opacity: 0.8, 
          marginTop: '5px',
          borderTop: '1px solid #555',
          paddingTop: '8px'
        }}>
          <div>🔵 Cold zones (low activity)</div>
          <div>🟢 Moderate activity</div>
          <div>🟡 High activity</div>
          <div>🔴 Hot zones (very active)</div>
        </div>
      )}
    </div>
  );
};

export default HeatmapControls;