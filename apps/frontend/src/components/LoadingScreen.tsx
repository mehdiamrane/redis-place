import React from "react";

interface LoadingScreenProps {
  message: string;
  connectionStatus: "connecting" | "connected" | "disconnected";
  onRefresh?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, connectionStatus, onRefresh }) => {
  const isTimeout = message === "Connection timeout";
  const isDisconnected = connectionStatus === "disconnected";

  if (isDisconnected) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "#242424",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          color: "white",
          fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>⚠️</div>
        <h2
          style={{
            margin: 0,
            marginBottom: "20px",
            fontSize: "24px",
            fontWeight: "normal",
          }}
        >
          {isTimeout ? "Connection Timeout" : "Connection Lost"}
        </h2>
        <p
          style={{
            margin: 0,
            marginBottom: "10px",
            fontSize: "16px",
            color: "#ccc",
            textAlign: "center",
            maxWidth: "500px",
          }}
        >
          {isTimeout ? "Unable to connect to the backend server" : "Lost connection to the backend server"}
        </p>
        <p
          style={{
            margin: 0,
            marginBottom: "20px",
            fontSize: "14px",
            color: "#999",
            textAlign: "center",
          }}
        >
          {isTimeout
            ? "The server may be down. Please try again later or refresh the page"
            : "Please check your internet connection and refresh the page"}
        </p>
        <button
          onClick={onRefresh}
          style={{
            padding: "12px 24px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background 0.3s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#45a049")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#4CAF50")}
        >
          🔄 Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#242424",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        color: "white",
        fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ fontSize: "60px", marginBottom: "20px" }}>🎨</div>
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid #666",
          borderTop: "4px solid #ccc",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "20px",
        }}
      ></div>
      <h2
        style={{
          margin: 0,
          marginBottom: "20px",
          fontSize: "24px",
          fontWeight: "normal",
        }}
      >
        Loading Canvas...
      </h2>
      <p
        style={{
          margin: 0,
          marginBottom: "10px",
          fontSize: "16px",
          color: "#ccc",
          textAlign: "center",
          maxWidth: "500px",
        }}
      >
        {message}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          color: "#999",
          textAlign: "center",
        }}
      >
        {connectionStatus === "connecting" ? "Establishing connection..." : "This may take a few seconds..."}
      </p>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingScreen;
