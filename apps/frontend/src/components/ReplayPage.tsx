import React, { useState, useEffect, useCallback } from 'react';
import ReplayCanvas from './ReplayCanvas';
import ReplayTimeline from './ReplayTimeline';
import { colorIdToHex } from '@redis-place/shared';

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
  const [playbackSpeed, setPlaybackSpeed] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Load replay events from API
  const loadEvents = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      setError(null);
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/replay?start=${startTime}&end=${endTime}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load replay data');
      }
      
      const data = await response.json();
      setEvents(data.events || []);
      setCurrentEventIndex(0);
      setDisplayedPixels([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load replay data');
      console.error('Error loading replay data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set default date range (last 24 hours)
  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    setStartDate(yesterday.toISOString().slice(0, 16)); // YYYY-MM-DDTHH:MM format
    setEndDate(now.toISOString().slice(0, 16));
  }, []);

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
    
    eventsToDisplay.forEach(event => {
      const key = `${event.x}:${event.y}`;
      const hexColor = colorIdToHex(event.color);
      if (hexColor) { // Only add pixels that have a valid color (not empty)
        pixelMap.set(key, {
          x: event.x,
          y: event.y,
          color: hexColor,
          timestamp: event.timestamp
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
      setCurrentEventIndex(prev => {
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

  const handleEventIndexChange = useCallback((index: number) => {
    setCurrentEventIndex(Math.max(0, Math.min(events.length - 1, index)));
  }, [events.length]);

  const handleLoadEvents = useCallback(() => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      setError('Start date must be before end date');
      return;
    }
    
    loadEvents(start, end);
  }, [loadEvents, startDate, endDate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#333'
      }}>
        <div>
          <div style={{ marginBottom: '10px' }}>🔄 Loading replay data...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            This might take a moment for large datasets
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#f44336'
      }}>
        <div style={{ marginBottom: '20px' }}>❌ {error}</div>
        <button
          onClick={handleLoadEvents}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  // Only show "no data" message if we tried to load events but got none
  const hasTriedLoading = startDate && endDate && !loading;
  if (events.length === 0 && hasTriedLoading && !error) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        {/* Top Right Controls */}
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => window.location.hash = ''}
            style={{
              padding: '10px 15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🎨 Back to Canvas
          </button>
        </div>

        {/* Date Range Controls */}
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '8px',
          fontSize: '12px',
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label>From:</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#333',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '3px',
                fontSize: '11px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label>To:</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#333',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '3px',
                fontSize: '11px'
              }}
            />
          </div>
          
          <button
            onClick={handleLoadEvents}
            disabled={loading || !startDate || !endDate}
            style={{
              padding: '6px 12px',
              backgroundColor: loading ? '#666' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            {loading ? '⏳ Loading...' : '🎬 Load Replay'}
          </button>
          
          {/* Quick preset buttons */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {[
              { label: '1h', hours: 1 },
              { label: '6h', hours: 6 },
              { label: '24h', hours: 24 },
              { label: '7d', hours: 24 * 7 }
            ].map(({ label, hours }) => (
              <button
                key={label}
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
                  setStartDate(start.toISOString().slice(0, 16));
                  setEndDate(now.toISOString().slice(0, 16));
                }}
                style={{
                  padding: '3px 6px',
                  backgroundColor: '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '9px'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          <div style={{ marginBottom: '20px' }}>📭 No events found in selected date range</div>
          <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
            No pixel placement events found in the selected time range. 
            Try a different date range or place some pixels first!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Top Right Controls */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => window.location.hash = ''}
          style={{
            padding: '10px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🎨 Back to Canvas
        </button>
      </div>

      {/* Top Left Info - only show when we have events */}
      {events.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '5px',
          fontSize: '14px',
          fontFamily: 'monospace'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🎬 Canvas Replay</div>
          <div>Events: {events.length}</div>
          <div>Pixels: {displayedPixels.length}</div>
          {events[0] && events[events.length - 1] && (
            <div style={{ fontSize: '12px', marginTop: '5px', color: '#ccc' }}>
              {new Date(events[0].timestamp).toLocaleDateString()} - {new Date(events[events.length - 1].timestamp).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Date Range Controls */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '8px',
        fontSize: '12px',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label>From:</label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: '4px 8px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '3px',
              fontSize: '11px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label>To:</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: '4px 8px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '3px',
              fontSize: '11px'
            }}
          />
        </div>
        
        <button
          onClick={handleLoadEvents}
          disabled={loading || !startDate || !endDate}
          style={{
            padding: '6px 12px',
            backgroundColor: loading ? '#666' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Loading...' : '🎬 Load Replay'}
        </button>
        
        {/* Quick preset buttons */}
        <div style={{ display: 'flex', gap: '5px' }}>
          {[
            { label: '1h', hours: 1 },
            { label: '6h', hours: 6 },
            { label: '24h', hours: 24 },
            { label: '7d', hours: 24 * 7 }
          ].map(({ label, hours }) => (
            <button
              key={label}
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
                setStartDate(start.toISOString().slice(0, 16));
                setEndDate(now.toISOString().slice(0, 16));
              }}
              style={{
                padding: '3px 6px',
                backgroundColor: '#555',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '9px'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Show welcome message when no events loaded yet */}
      {events.length === 0 && !loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#666',
          fontSize: '16px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎬</div>
          <div style={{ marginBottom: '10px' }}>Welcome to Canvas Replay!</div>
          <div style={{ fontSize: '14px' }}>
            Select a date range above to load pixel events and watch the canvas evolve over time
          </div>
        </div>
      )}

      {events.length > 0 && (
        <>
          <ReplayCanvas
            width={1000}
            height={1000}
            placedPixels={displayedPixels}
          />

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
        </>
      )}
    </div>
  );
};

export default ReplayPage;