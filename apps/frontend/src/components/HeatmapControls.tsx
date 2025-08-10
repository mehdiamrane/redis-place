import React from "react";

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
  onRefreshData,
}) => {
  const timeRangeOptions = [
    { value: 1, label: "1h" },
    { value: 6, label: "6h" },
    { value: 24, label: "24h" },
    { value: 168, label: "7d" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "16px",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "14px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        minWidth: "200px",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "16px",
          fontWeight: "bold",
        }}
      >
        Activity Heatmap
      </h3>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => onToggleHeatmap(e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          Show Heatmap
        </label>
      </div>

      {showHeatmap && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Time Range:
          </label>
          <div style={{ display: "flex", gap: "4px" }}>
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onTimeRangeChange(option.value)}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "medium",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  backgroundColor: timeRange === option.value ? "#4CAF50" : "#666",
                  color: "white",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={onRefreshData}
            style={{
              width: "100%",
              marginTop: "8px",
              fontSize: "12px",
              padding: "8px 16px",
              backgroundColor: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f57c00")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ff9800")}
          >
            🔄 Refresh (Skip Cache)
          </button>
        </div>
      )}

      {showHeatmap && (
        <div
          style={{
            fontSize: "12px",
            opacity: 0.8,
            marginTop: "4px",
            borderTop: "1px solid #666",
            paddingTop: "8px",
          }}
        >
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
