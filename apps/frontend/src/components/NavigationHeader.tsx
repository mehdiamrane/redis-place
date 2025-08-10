import React from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores";

const NavigationHeader: React.FC = () => {
  const { isAuthenticated, username, logout, showModal } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  const handleShowProfile = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("userProfile", username || "current");
    setSearchParams(newSearchParams);
  };

  const handleSignInClick = () => {
    showModal("Sign in to access your profile and place pixels!");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 1000,
        display: "flex",
        gap: "10px",
      }}
    >
      {isAuthenticated ? (
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span
            style={{
              color: "#333",
              fontWeight: "bold",
              background: "rgba(255, 255, 255, 0.9)",
              padding: "6px 10px",
              borderRadius: "4px",
            }}
          >
            👋 {username}
          </span>
          <button
            onClick={handleShowProfile}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0056b3")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#007bff")}
          >
            👤 Profile
          </button>
          <button
            onClick={logout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#c82333")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#dc3545")}
          >
            🚪 Logout
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignInClick}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0056b3")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#007bff")}
        >
          🔑 Sign In
        </button>
      )}

      <button
        onClick={() => handleNavigation("/")}
        style={{
          padding: "8px 16px",
          backgroundColor: location.pathname === "/" ? "#495057" : "#17a2b8",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "background-color 0.3s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = location.pathname === "/" ? "#495057" : "#138496")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = location.pathname === "/" ? "#495057" : "#17a2b8")}
      >
        🎨 Canvas
      </button>
      <button
        onClick={() => handleNavigation("/badges")}
        style={{
          padding: "8px 16px",
          backgroundColor: location.pathname === "/badges" ? "#495057" : "#6f42c1",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "background-color 0.3s",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = location.pathname === "/badges" ? "#495057" : "#5a32a3")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = location.pathname === "/badges" ? "#495057" : "#6f42c1")
        }
      >
        🏆 Badges
      </button>
      <button
        onClick={() => handleNavigation("/analytics")}
        style={{
          padding: "8px 16px",
          backgroundColor: location.pathname === "/analytics" ? "#495057" : "#28a745",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "background-color 0.3s",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = location.pathname === "/analytics" ? "#495057" : "#218838")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = location.pathname === "/analytics" ? "#495057" : "#28a745")
        }
      >
        📊 Analytics
      </button>
      <button
        onClick={() => handleNavigation("/replay")}
        style={{
          padding: "8px 16px",
          backgroundColor: location.pathname === "/replay" ? "#495057" : "#fd7e14",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "background-color 0.3s",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = location.pathname === "/replay" ? "#495057" : "#e8650e")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = location.pathname === "/replay" ? "#495057" : "#fd7e14")
        }
      >
        🎬 Replay
      </button>
    </div>
  );
};

export default NavigationHeader;
