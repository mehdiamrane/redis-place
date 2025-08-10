import React from "react";

interface ConnectionStatusProps {
  status: "connecting" | "connected" | "disconnected";
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          text: "Connected",
          color: "#4CAF50",
          show: true,
        };
      case "connecting":
        return {
          text: "Connecting...",
          color: "#FF9800",
          show: true,
        };
      case "disconnected":
        return {
          text: "Disconnected",
          color: "#f44336",
          show: true,
        };
      default:
        return { show: false };
    }
  };

  const config = getStatusConfig();

  if (!config.show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        background: "rgba(0, 0, 0, 0.7)",
        color: config.color,
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "bold",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: config.color,
        }}
      ></div>
      {config.text}
    </div>
  );
};

export default ConnectionStatus;
