import { useEffect, useCallback, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import CanvasPage from "./components/CanvasPage";
import AnalyticsPage from "./components/AnalyticsPage";
import BadgesPage from "./components/BadgesPage";
import ReplayPage from "./components/ReplayPage";
import ProfilePage from "./components/ProfilePage";
import AuthModal from "./components/AuthModal";
import socketService from "./services/socketService";
import { useAuthStore, useCanvasStore } from "./stores";
import "./App.css";

function App() {
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingStartTimeRef = useRef<number>(Date.now());

  // Zustand stores
  const authStore = useAuthStore();
  const canvasStore = useCanvasStore();

  useEffect(() => {
    authStore.checkAuth();

    // Set up connection status handler
    socketService.onConnectionStatusChange((status) => {
      canvasStore.setConnectionStatus(status);

      if (status === "connecting") {
        canvasStore.setCanvasLoading(true, "Connecting to backend...");
        loadingStartTimeRef.current = Date.now();

        const timeout = setTimeout(() => {
          console.log("Connection timeout - backend may be down");
          canvasStore.setConnectionStatus("disconnected");
          canvasStore.setCanvasLoading(true, "Connection timeout");
        }, 10000);
        connectionTimeoutRef.current = timeout;
      } else if (status === "connected") {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        canvasStore.loadInitialCanvas();
      } else if (status === "disconnected") {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        canvasStore.setCanvasLoading(false, "Connection lost...");
      }
    });

    socketService.onAuthRequired((message) => {
      authStore.showModal(message);
    });

    socketService.onRateLimited((data) => {
      console.log("Rate limited, rolling back optimistic update");
      canvasStore.rollbackPixelPlacement(data.x, data.y);
      authStore.showModal(data.message);
    });

    socketService.connect();

    socketService.onPixelUpdate((data) => {
      const color = socketService.colorIdToHex(data.color) || "#ffffff";
      canvasStore.updatePixel(data.x, data.y, color, data.timestamp);
    });

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      socketService.disconnect();
      socketService.removeAuthRequiredCallback();
      socketService.removeRateLimitedCallback();
      socketService.removeConnectionStatusCallback();
    };
  }, []); // Empty dependency array - this should only run once on mount

  const handleAuthSuccess = useCallback(async () => {
    await authStore.checkAuth();
    authStore.hideModal();
  }, [authStore]);


  return (
    <>
      <Routes>
        <Route path="/" element={<CanvasPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/badges" element={<BadgesPage />} />
        <Route path="/replay" element={<ReplayPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
      </Routes>

      {/* Global Authentication Modal */}
      <AuthModal
        isOpen={authStore.showAuthModal}
        onClose={authStore.hideModal}
        message={authStore.authMessage}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}

export default App;
