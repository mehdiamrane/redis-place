import React from "react";

const ReplayNoEventsMessage: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#666",
      }}
    >
      <div style={{ marginBottom: "20px" }}>📭 No events found in selected date range</div>
      <div style={{ fontSize: "14px", textAlign: "center", maxWidth: "400px" }}>
        No pixel placement events found in the selected time range. Try a different date range or place some pixels
        first!
      </div>
    </div>
  );
};

export default ReplayNoEventsMessage;
