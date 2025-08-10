import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Canvas from "./Canvas";
import PlacementHUD from "./PlacementHUD";
import UserProfile from "./UserProfile";
import HeatmapOverlay from "./HeatmapOverlay";
import LoadingScreen from "./LoadingScreen";
import NavigationHeader from "./NavigationHeader";
import LeftSidebar from "./LeftSidebar";
import { useAuthStore, useCanvasStore } from "../stores";
import { buildApiUrl, API_ENDPOINTS, QUERY_PARAMS } from "../constants/api";

function CanvasPage() {
  const canvasStore = useCanvasStore();
  const authStore = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Heatmap data fetching logic
  const fetchHeatmapData = useCallback(
    async (skipCache = false, timeRange?: number, forceEnabled = false) => {
      if (!forceEnabled && !canvasStore.showHeatmap) return;

      const hoursToUse = timeRange ?? canvasStore.heatmapTimeRange;

      try {
        const params = {
          [QUERY_PARAMS.HOURS]: hoursToUse,
          ...(skipCache && { [QUERY_PARAMS.NO_CACHE]: "true" }),
        };
        const url = buildApiUrl(API_ENDPOINTS.HEATMAP, params);
        const response = await fetch(url);
        const data: { x: number; y: number; intensity: number }[] = await response.json();

        const max = Math.max(...data.map((d) => d.intensity));
        canvasStore.setHeatmapData(data, max);
      } catch (error) {
        console.error("Error fetching heatmap data:", error);
      }
    },
    [canvasStore]
  );

  const handleToggleHeatmap = useCallback(
    (show: boolean) => {
      canvasStore.setShowHeatmap(show);
      if (show) {
        fetchHeatmapData(false, undefined, true);
      }
    },
    [fetchHeatmapData, canvasStore]
  );

  const handleHeatmapTimeRangeChange = useCallback(
    (hours: number) => {
      canvasStore.setHeatmapTimeRange(hours);
      fetchHeatmapData(false, hours);
    },
    [fetchHeatmapData, canvasStore]
  );

  const handleHeatmapRefresh = useCallback(() => {
    fetchHeatmapData(true);
  }, [fetchHeatmapData]);

  const handlePixelClick = useCallback(
    (x: number, y: number) => {
      canvasStore.setSelectedPixel({ x, y });
      canvasStore.setCursorPosition({ x, y });
    },
    [canvasStore]
  );

  const handleDeselectPixel = useCallback(() => {
    canvasStore.setSelectedPixel(null);
    canvasStore.setPreviewColor(null);
    canvasStore.setCursorPosition(null);
  }, [canvasStore]);

  // Handle global keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key.startsWith("Arrow")) return;

      if (canvasStore.cursorPosition) {
        e.preventDefault();

        const { x: currentX, y: currentY } = canvasStore.cursorPosition;
        let newX = currentX;
        let newY = currentY;

        switch (e.key) {
          case "ArrowUp":
            newY = Math.max(0, currentY - 1);
            break;
          case "ArrowDown":
            newY = Math.min(999, currentY + 1);
            break;
          case "ArrowLeft":
            newX = Math.max(0, currentX - 1);
            break;
          case "ArrowRight":
            newX = Math.min(999, currentX + 1);
            break;
        }

        const newPos = { x: newX, y: newY };
        canvasStore.setCursorPosition(newPos);
        canvasStore.setSelectedPixel(newPos);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [canvasStore]);

  // Handle user profile modal via URL params
  const userProfileParam = searchParams.get("userProfile");

  const handleCloseUserProfile = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("userProfile");
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Canvas Loading Screen */}
      {canvasStore.isCanvasLoading && (
        <LoadingScreen
          message={canvasStore.loadingMessage}
          connectionStatus={canvasStore.connectionStatus}
          onRefresh={() => window.location.reload()}
        />
      )}

      {/* Navigation Header */}
      <NavigationHeader />

      <Canvas
        width={1000}
        height={1000}
        onPixelHover={canvasStore.setHoveredPixel}
        onZoomChange={canvasStore.setZoom}
        onPanChange={canvasStore.setPan}
        onPixelClick={handlePixelClick}
        selectedPixel={canvasStore.selectedPixel}
        onDeselectPixel={handleDeselectPixel}
        previewColor={canvasStore.previewColor}
        placedPixels={canvasStore.placedPixels}
      />

      <HeatmapOverlay
        width={1000}
        height={1000}
        zoom={canvasStore.zoom}
        pan={canvasStore.pan}
        showHeatmap={canvasStore.showHeatmap}
        heatmapData={canvasStore.heatmapData}
        maxIntensity={canvasStore.maxHeatmapIntensity}
      />

      <LeftSidebar
        pixelX={canvasStore.hoveredPixel.x}
        pixelY={canvasStore.hoveredPixel.y}
        zoom={canvasStore.zoom}
        cursorPosition={canvasStore.cursorPosition}
        selectedPixel={canvasStore.selectedPixel}
        showHeatmap={canvasStore.showHeatmap}
        onToggleHeatmap={handleToggleHeatmap}
        timeRange={canvasStore.heatmapTimeRange}
        onTimeRangeChange={handleHeatmapTimeRangeChange}
        onRefreshData={handleHeatmapRefresh}
        connectionStatus={canvasStore.connectionStatus}
      />

      <PlacementHUD />

      {/* User Profile Modal */}
      {userProfileParam && authStore.isAuthenticated && (
        <UserProfile userId={`user:${userProfileParam}`} onClose={handleCloseUserProfile} />
      )}
    </div>
  );
}

export default CanvasPage;
