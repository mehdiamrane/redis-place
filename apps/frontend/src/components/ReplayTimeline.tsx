import React from "react";
import styled from "styled-components";
import { LuSkipBack, LuSkipForward, LuPlay, LuPause, LuRotateCcw, LuClock } from "react-icons/lu";
import { HUDPanel, HUDRow, HUDLabel, HUDValue, Button } from "./ui";
import { theme } from "../styles/theme";

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

const TimelineSlider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
`;

const CurrentEventInfo = styled.div`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.lightGray};
  text-align: center;
`;

const ControlsGrid = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

const SpeedControl = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

const SpeedSelect = styled.select`
  padding: ${theme.spacing.xs};
  background-color: ${theme.colors.cardBackground};
  color: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.fontSize.sm};
  font-family: monospace;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
`;

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

  const speedOptions = [1, 2, 5, 10];

  const progress = events.length > 0 ? (currentEventIndex / (events.length - 1)) * 100 : 0;
  const currentEvent = events[currentEventIndex];
  const startTime = events[0]?.timestamp || 0;
  const endTime = events[events.length - 1]?.timestamp || 0;
  const currentTime = currentEvent?.timestamp || startTime;
  const totalDuration = endTime - startTime;
  const elapsedDuration = currentTime - startTime;

  return (
    <HUDPanel position="relative" title="Timeline Controls" titleIcon={<LuClock />} style={{ minWidth: "600px" }}>
      {/* Progress Info and Current Event Info - Combined */}
      <HUDRow>
        <HUDValue>
          Event {currentEventIndex + 1} of {events.length}
        </HUDValue>
        <HUDValue>
          {formatDuration(elapsedDuration)} / {formatDuration(totalDuration)}
        </HUDValue>
      </HUDRow>

      {/* Current Event Details */}
      {currentEvent && (
        <CurrentEventInfo>
          User: {currentEvent.userId.startsWith("user:") ? currentEvent.userId.substring(5) : currentEvent.userId} •
          Pixel ({currentEvent.x}, {currentEvent.y}) • {formatTimestamp(currentEvent.timestamp)}
        </CurrentEventInfo>
      )}

      {/* Timeline Slider */}
      <TimelineSlider
        type="range"
        min={0}
        max={Math.max(0, events.length - 1)}
        value={currentEventIndex}
        onChange={handleSliderChange}
        style={{
          background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${progress}%, #333 ${progress}%, #333 100%)`,
          margin: `${theme.spacing.sm} 0`,
        }}
      />

      {/* Controls */}
      <ControlsGrid>
        <Button variant="danger" size="small" onClick={onReset} leftElement={<LuRotateCcw />}>
          Reset
        </Button>

        <Button
          variant={currentEventIndex === 0 ? "gray" : "secondary"}
          size="small"
          onClick={() => onEventIndexChange(Math.max(0, currentEventIndex - 1))}
          disabled={currentEventIndex === 0}
          leftElement={<LuSkipBack />}
        >
          Step
        </Button>

        <Button
          variant={events.length === 0 ? "gray" : "success"}
          size="small"
          onClick={onPlayPause}
          disabled={events.length === 0}
          leftElement={isPlaying ? <LuPause /> : <LuPlay />}
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>

        <Button
          variant={currentEventIndex === events.length - 1 ? "gray" : "secondary"}
          size="small"
          onClick={() => onEventIndexChange(Math.min(events.length - 1, currentEventIndex + 1))}
          disabled={currentEventIndex === events.length - 1}
          rightElement={<LuSkipForward />}
        >
          Step
        </Button>

        <SpeedControl>
          <HUDLabel>Speed:</HUDLabel>
          <SpeedSelect value={playbackSpeed} onChange={(e) => onPlaybackSpeedChange(parseFloat(e.target.value))}>
            {speedOptions.map((speed) => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </SpeedSelect>
        </SpeedControl>
      </ControlsGrid>
    </HUDPanel>
  );
};

export default ReplayTimeline;
