import React from "react";

interface ReplayEvent {
  id: string;
  userId: string;
  x: number;
  y: number;
  color: number;
  timestamp: number;
}

interface PlacedPixel {
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

interface ReplayInfoProps {
  events: ReplayEvent[];
  displayedPixels: PlacedPixel[];
}

const ReplayInfo: React.FC<ReplayInfoProps> = ({ events, displayedPixels }) => {
  if (events.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "10px 15px",
        borderRadius: "5px",
        fontSize: "14px",
        fontFamily: "monospace",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "5px" }}>🎬 Canvas Replay</div>
      <div>Events: {events.length}</div>
      <div>Pixels: {displayedPixels.length}</div>
      {events[0] && events[events.length - 1] && (
        <div style={{ fontSize: "12px", marginTop: "5px", color: "#ccc" }}>
          {new Date(events[0].timestamp).toLocaleDateString()} -{" "}
          {new Date(events[events.length - 1].timestamp).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default ReplayInfo;
