import React from "react";

interface ReplayEvent {
  id: string;
  userId: string;
  x: number;
  y: number;
  color: number;
  timestamp: number;
}

interface ReplayTimelineProps {
  events: ReplayEvent[];
  currentEventIndex: number;
  onEventIndexChange: (index: number) => void;
  onPlayPause: () => void;
  isPlaying: boolean;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  onReset: () => void;
}

const ReplayTimeline: React.FC<ReplayTimelineProps> = ({
  events,
  currentEventIndex,
  onEventIndexChange,
  onPlayPause,
  isPlaying,
  playbackSpeed,
  onPlaybackSpeedChange,
  onReset,
}) => {

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    onEventIndexChange(index);
  };


  const speedOptions = [0.5, 1, 2, 5, 10];

  const progress = events.length > 0 ? (currentEventIndex / (events.length - 1)) * 100 : 0;
  const currentEvent = events[currentEventIndex];
  const startTime = events[0]?.timestamp || 0;
  const endTime = events[events.length - 1]?.timestamp || 0;
  const currentTime = currentEvent?.timestamp || startTime;
  const totalDuration = endTime - startTime;
  const elapsedDuration = currentTime - startTime;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "15px 25px",
        borderRadius: "10px",
        minWidth: "600px",
        zIndex: 1000,
        fontFamily: "monospace",
      }}
    >
      {/* Progress Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          fontSize: "12px",
        }}
      >
        <div>
          Event {currentEventIndex + 1} of {events.length}
        </div>
        <div>
          {formatDuration(elapsedDuration)} / {formatDuration(totalDuration)}
        </div>
      </div>

      {/* Timeline Slider */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="range"
          min={0}
          max={Math.max(0, events.length - 1)}
          value={currentEventIndex}
          onChange={handleSliderChange}
          style={{
            width: "100%",
            height: "8px",
            borderRadius: "4px",
            background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${progress}%, #333 ${progress}%, #333 100%)`,
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
            cursor: "pointer",
          }}
        />
      </div>

      {/* Current Event Info */}
      {currentEvent && (
        <div
          style={{
            fontSize: "11px",
            color: "#ccc",
            marginBottom: "15px",
            textAlign: "center",
          }}
        >
          User: {currentEvent.userId} • Pixel ({currentEvent.x}, {currentEvent.y}) •{" "}
          {formatTimestamp(currentEvent.timestamp)}
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        {/* Reset Button */}
        <button
          onClick={onReset}
          style={{
            padding: "8px 12px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          ⏮ Reset
        </button>

        {/* Step Backward */}
        <button
          onClick={() => onEventIndexChange(Math.max(0, currentEventIndex - 1))}
          disabled={currentEventIndex === 0}
          style={{
            padding: "8px 12px",
            backgroundColor: currentEventIndex === 0 ? "#666" : "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: currentEventIndex === 0 ? "not-allowed" : "pointer",
            fontSize: "12px",
          }}
        >
          ⏪ Step
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={onPlayPause}
          disabled={events.length === 0}
          style={{
            padding: "10px 20px",
            backgroundColor: events.length === 0 ? "#666" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: events.length === 0 ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        {/* Step Forward */}
        <button
          onClick={() => onEventIndexChange(Math.min(events.length - 1, currentEventIndex + 1))}
          disabled={currentEventIndex === events.length - 1}
          style={{
            padding: "8px 12px",
            backgroundColor: currentEventIndex === events.length - 1 ? "#666" : "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: currentEventIndex === events.length - 1 ? "not-allowed" : "pointer",
            fontSize: "12px",
          }}
        >
          Step ⏩
        </button>

        {/* Speed Control */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px" }}>Speed:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => onPlaybackSpeedChange(parseFloat(e.target.value))}
            style={{
              padding: "4px 8px",
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #555",
              borderRadius: "3px",
              fontSize: "12px",
            }}
          >
            {speedOptions.map((speed) => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReplayTimeline;
