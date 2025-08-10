import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import ReplayCanvas from "./ReplayCanvas";
import ReplayTimeline from "./ReplayTimeline";
import ReplayControls from "./ReplayControls";
import ReplayControlsContainer from "./ReplayControlsContainer";
import ReplayInfo from "./ReplayInfo";
import ReplayNoEventsMessage from "./ReplayNoEventsMessage";
import NavigationHeader from "./NavigationHeader";
import { HUDPanel } from "./ui";
import { theme } from "../styles/theme";
import { colorIdToHex } from "@redis-place/shared";

const LoadingOverlay = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: ${theme.zIndex.modal};
`;

const LoadingContent = styled.div`
  text-align: center;
  color: ${theme.colors.white};
  font-size: ${theme.fontSize.lg};
  font-weight: bold;
`;

const LoadingSubtext = styled.div`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.lightGray};
  margin-top: ${theme.spacing.xs};
`;

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

const ReplayPage: React.FC = () => {
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [displayedPixels, setDisplayedPixels] = useState<PlacedPixel[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Helper function to format date for datetime-local input (in local timezone)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Load replay events from API
  const loadEvents = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      setError(null);
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();

      // Ensure loading state is visible for at least 1 second
      const loadingStartTime = Date.now();

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/replay?start=${startTime}&end=${endTime}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load replay data");
      }

      const data = await response.json();
      
      // Calculate remaining time to show loading for at least 1 second
      const loadingDuration = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, 1000 - loadingDuration);
      
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      
      setEvents(data.events || []);
      setCurrentEventIndex(0);
      setDisplayedPixels([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load replay data");
      console.error("Error loading replay data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set default date range (last 24 hours) and auto-load data
  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    setStartDate(formatDateForInput(yesterday));
    setEndDate(formatDateForInput(now));

    // Auto-load the last 24 hours of data
    loadEvents(yesterday, now);
  }, [loadEvents]);

  // Update displayed pixels when current event index changes
  useEffect(() => {
    if (events.length === 0) {
      setDisplayedPixels([]);
      return;
    }

    // Get all events up to current index
    const eventsToDisplay = events.slice(0, currentEventIndex + 1);

    // Convert to pixels, keeping only the latest pixel for each coordinate
    const pixelMap = new Map<string, PlacedPixel>();

    eventsToDisplay.forEach((event) => {
      const key = `${event.x}:${event.y}`;
      const hexColor = colorIdToHex(event.color);
      if (hexColor) {
        // Only add pixels that have a valid color (not empty)
        pixelMap.set(key, {
          x: event.x,
          y: event.y,
          color: hexColor,
          timestamp: event.timestamp,
        });
      }
    });

    setDisplayedPixels(Array.from(pixelMap.values()));
  }, [currentEventIndex, events]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || currentEventIndex >= events.length - 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentEventIndex((prev) => {
        const next = prev + 1;
        if (next >= events.length - 1) {
          setIsPlaying(false);
          return events.length - 1;
        }
        return next;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentEventIndex, events.length, playbackSpeed]);

  const handlePlayPause = useCallback(() => {
    if (currentEventIndex >= events.length - 1) {
      // If at the end, reset to beginning and start playing
      setCurrentEventIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, currentEventIndex, events.length]);

  const handleReset = useCallback(() => {
    setCurrentEventIndex(0);
    setIsPlaying(false);
  }, []);

  const handleEventIndexChange = useCallback(
    (index: number) => {
      setCurrentEventIndex(Math.max(0, Math.min(events.length - 1, index)));
    },
    [events.length]
  );

  const handleLoadEvents = useCallback(() => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      setError("Start date must be before end date");
      return;
    }

    loadEvents(start, end);
  }, [loadEvents, startDate, endDate]);


  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#f44336",
        }}
      >
        <div style={{ marginBottom: "20px" }}>❌ Error loading replay data</div>
        {error && <div style={{ marginBottom: "20px" }}>{error}</div>}
        <div style={{ marginBottom: "20px", fontSize: "14px", color: "#666" }}>
          Please try again or check your date range.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          🔄 Refresh page
        </button>
      </div>
    );
  }

  // Only show "no data" message if we tried to load events but got none
  const hasTriedLoading = startDate && endDate && !loading;
  const showNoEventsMessage = events.length === 0 && hasTriedLoading && !error;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <NavigationHeader />

      <ReplayInfo events={events} displayedPixels={displayedPixels} />

      {events.length > 0 && !loading && (
        <ReplayCanvas 
          width={1000} 
          height={1000} 
          placedPixels={displayedPixels}
          currentEvent={events[currentEventIndex]}
          autoCenterOnPixel={true}
        />
      )}

      {showNoEventsMessage && <ReplayNoEventsMessage />}

      {loading && (
        <LoadingOverlay>
          <HUDPanel position="relative">
            <LoadingContent>🔄 Loading replay data...</LoadingContent>
            <LoadingSubtext>This might take a moment for large datasets</LoadingSubtext>
          </HUDPanel>
        </LoadingOverlay>
      )}

      <ReplayControlsContainer>
        <ReplayControls
          startDate={startDate}
          endDate={endDate}
          loading={loading}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onLoadEvents={handleLoadEvents}
          onLoadEventsWithDates={loadEvents}
          formatDateForInput={formatDateForInput}
        />

        {events.length > 0 && (
          <ReplayTimeline
            events={events}
            currentEventIndex={currentEventIndex}
            onEventIndexChange={handleEventIndexChange}
            onPlayPause={handlePlayPause}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onPlaybackSpeedChange={setPlaybackSpeed}
            onReset={handleReset}
          />
        )}
      </ReplayControlsContainer>
    </div>
  );
};

export default ReplayPage;
