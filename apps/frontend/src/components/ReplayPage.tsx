import React, { useState, useEffect, useCallback } from 'react';
import ReplayCanvas from './ReplayCanvas';
import ReplayTimeline from './ReplayTimeline';
import { colorIndexToHex } from '@redis-place/shared';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedEventCount, setLoadedEventCount] = useState(1000);

  // Load replay events from API
  const loadEvents = useCallback(async (count: number = 1000) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/replay?count=${count}`);
      
      if (!response.ok) {
        throw new Error('Failed to load replay data');
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

  // Initial load
  useEffect(() => {
    loadEvents(loadedEventCount);
  }, [loadEvents, loadedEventCount]);

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
      pixelMap.set(key, {
        x: event.x,
        y: event.y,
        color: colorIndexToHex(event.color),
        timestamp: event.timestamp
      });
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

  const handleLoadMoreEvents = useCallback((count: number) => {
    setLoadedEventCount(count);
    loadEvents(count);
  }, [loadEvents]);

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
          onClick={() => loadEvents(loadedEventCount)}
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

  if (events.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        <div style={{ marginBottom: '20px' }}>📭 No replay data available</div>
        <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
          No pixel placement events found in the activity stream. 
          Place some pixels first, then return to see the replay!
        </div>
        <button
          onClick={() => window.location.hash = ''}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🎨 Go to Canvas
        </button>
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

      {/* Top Left Info */}
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

      {/* Load More Controls */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '5px',
        fontSize: '12px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <span>Load:</span>
        {[1000, 5000, 10000].map(count => (
          <button
            key={count}
            onClick={() => handleLoadMoreEvents(count)}
            disabled={loading}
            style={{
              padding: '5px 10px',
              backgroundColor: loadedEventCount === count ? '#4CAF50' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '11px'
            }}
          >
            {count.toLocaleString()} events
          </button>
        ))}
      </div>

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
    </div>
  );
};

export default ReplayPage;