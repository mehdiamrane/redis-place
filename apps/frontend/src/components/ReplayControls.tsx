import React from "react";

interface ReplayControlsProps {
  startDate: string;
  endDate: string;
  loading: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onLoadEvents: () => void;
  formatDateForInput: (date: Date) => string;
}

const ReplayControls: React.FC<ReplayControlsProps> = ({
  startDate,
  endDate,
  loading,
  onStartDateChange,
  onEndDateChange,
  onLoadEvents,
  formatDateForInput,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "180px", // Position above the timeline player
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "15px 20px",
        borderRadius: "8px",
        fontSize: "12px",
        display: "flex",
        gap: "15px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label>From:</label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          style={{
            padding: "4px 8px",
            backgroundColor: "#333",
            color: "white",
            border: "1px solid #555",
            borderRadius: "3px",
            fontSize: "11px",
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label>To:</label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          style={{
            padding: "4px 8px",
            backgroundColor: "#333",
            color: "white",
            border: "1px solid #555",
            borderRadius: "3px",
            fontSize: "11px",
          }}
        />
      </div>

      <button
        onClick={onLoadEvents}
        disabled={loading || !startDate || !endDate}
        style={{
          padding: "6px 12px",
          backgroundColor: loading ? "#666" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "11px",
          fontWeight: "bold",
        }}
      >
        {loading ? "⏳ Loading..." : "🎬 Load Replay"}
      </button>

      {/* Quick preset buttons */}
      <div style={{ display: "flex", gap: "5px" }}>
        {[
          { label: "1h", hours: 1 },
          { label: "6h", hours: 6 },
          { label: "24h", hours: 24 },
          { label: "7d", hours: 24 * 7 },
        ].map(({ label, hours }) => (
          <button
            key={label}
            onClick={() => {
              const now = new Date();
              const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
              onStartDateChange(formatDateForInput(start));
              onEndDateChange(formatDateForInput(now));
            }}
            style={{
              padding: "3px 6px",
              backgroundColor: "#555",
              color: "white",
              border: "none",
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "9px",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReplayControls;
