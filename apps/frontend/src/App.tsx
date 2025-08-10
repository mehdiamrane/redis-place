import { useState, useEffect, useCallback } from 'react'
import Canvas from './components/Canvas'
import InfoHUD from './components/InfoHUD'
import PlacementHUD from './components/PlacementHUD'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import BadgesPage from './components/BadgesPage'
import ReplayPage from './components/ReplayPage'
import UserProfile from './components/UserProfile'
import HeatmapOverlay from './components/HeatmapOverlay'
import HeatmapControls from './components/HeatmapControls'
import AuthModal from './components/AuthModal'
import PixelInfoHUD from './components/PixelInfoHUD'
import socketService from './services/socketService'
import AuthService from './services/authService'
import './App.css'

interface PlacedPixel {
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

function App() {
  const [currentView, setCurrentView] = useState<'canvas' | 'analytics' | 'badges' | 'replay'>('canvas');
  const [hoveredPixel, setHoveredPixel] = useState({ x: -1, y: -1 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [placedPixels, setPlacedPixels] = useState<PlacedPixel[]>([]);
  const [selectedPixel, setSelectedPixel] = useState<{ x: number; y: number } | null>(null);
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapTimeRange, setHeatmapTimeRange] = useState(24);
  const [heatmapData, setHeatmapData] = useState<{ x: number; y: number; intensity: number }[]>([]);
  const [maxHeatmapIntensity, setMaxHeatmapIntensity] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isCanvasLoading, setIsCanvasLoading] = useState(true);

  // Simple routing based on URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove #
      if (hash === 'analytics') {
        setCurrentView('analytics');
      } else if (hash === 'badges') {
        setCurrentView('badges');
      } else if (hash === 'replay') {
        setCurrentView('replay');
      } else {
        setCurrentView('canvas');
      }
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // Check authentication status on app load
    const checkAuth = async () => {
      const storedAuth = AuthService.getStoredAuth();
      if (storedAuth) {
        const authStatus = await AuthService.verifyAuth();
        if (authStatus.valid) {
          setIsAuthenticated(true);
          setUsername(authStatus.username || null);
        } else {
          setIsAuthenticated(false);
          setUsername(null);
        }
      }
    };

    checkAuth();

    socketService.connect();

    // Set up authentication required handler
    socketService.onAuthRequired((message) => {
      setAuthMessage(message);
      setShowAuthModal(true);
    });

    const loadInitialCanvas = async () => {
      try {
        setIsCanvasLoading(true);
        const pixels = await socketService.loadCanvas();
        setPlacedPixels(pixels);
      } catch (error) {
        console.error('Error loading canvas:', error);
      } finally {
        setIsCanvasLoading(false);
      }
    };

    loadInitialCanvas();

    socketService.onPixelUpdate((data) => {
      const newPixel: PlacedPixel = {
        x: data.x,
        y: data.y,
        color: socketService.colorIdToHex(data.color) || '#ffffff', // Default to white for empty pixels
        timestamp: data.timestamp
      };

      setPlacedPixels(prev => {
        const filtered = prev.filter(pixel => !(pixel.x === data.x && pixel.y === data.y));
        return [...filtered, newPixel];
      });
    });

    return () => {
      socketService.disconnect();
      socketService.removeAuthRequiredCallback();
    };
  }, []);

  const handlePixelHover = (x: number, y: number) => {
    setHoveredPixel({ x, y });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handlePanChange = useCallback((newPan: { x: number; y: number }) => {
    setPan(newPan);
  }, []);

  // Heatmap data fetching logic
  const fetchHeatmapData = useCallback(async (skipCache = false, timeRange?: number, forceEnabled = false) => {
    if (!forceEnabled && !showHeatmap) return;
    
    const hoursToUse = timeRange ?? heatmapTimeRange;
    
    try {
      const cacheParam = skipCache ? '&nocache=true' : '';
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/heatmap?hours=${hoursToUse}${cacheParam}`);
      const data: { x: number; y: number; intensity: number }[] = await response.json();
      setHeatmapData(data);
      
      // Calculate max intensity for normalization
      const max = Math.max(...data.map(d => d.intensity));
      setMaxHeatmapIntensity(max);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    }
  }, [showHeatmap, heatmapTimeRange]);

  const handleToggleHeatmap = (show: boolean) => {
    setShowHeatmap(show);
    if (show) {
      // Fetch data when heatmap is enabled (force enabled since state hasn't updated yet)
      fetchHeatmapData(false, undefined, true);
    }
  };

  const handleHeatmapTimeRangeChange = (hours: number) => {
    setHeatmapTimeRange(hours);
    // Fetch data with new time range (pass the new value directly)
    fetchHeatmapData(false, hours);
  };

  const handleHeatmapRefresh = () => {
    fetchHeatmapData(true); // Skip cache
  };

  const handlePixelClick = (x: number, y: number) => {
    setSelectedPixel({ x, y });
    // Update cursor position to match clicked pixel for continuity
    setCursorPosition({ x, y });
  };


  const handleDeselectPixel = () => {
    setSelectedPixel(null);
    setPreviewColor(null);
    setCursorPosition(null); // Clear cursor position
  };

  const handleColorPreview = (color: string | null) => {
    setPreviewColor(color);
  };

  const handleCooldownChange = (active: boolean) => {
    setCooldownActive(active);
  };

  // Handle global keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys and Space for navigation (not when typing in color picker)
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        return;
      }

      // Arrow key navigation (when cursor position is active)
      if (e.key.startsWith('Arrow') && cursorPosition) {
        e.preventDefault();
        
        setCursorPosition(prev => {
          if (!prev) return null; // Safety check
          let newX = prev.x;
          let newY = prev.y;

          switch (e.key) {
            case 'ArrowUp':
              newY = Math.max(0, prev.y - 1);
              break;
            case 'ArrowDown':
              newY = Math.min(999, prev.y + 1);
              break;
            case 'ArrowLeft':
              newX = Math.max(0, prev.x - 1);
              break;
            case 'ArrowRight':
              newX = Math.min(999, prev.x + 1);
              break;
          }

          const newPos = { x: newX, y: newY };
          // Auto-select the new cursor position (allowed even during cooldown)
          setSelectedPixel(newPos);
          return newPos;
        });
      }
      
      // Space bar for pixel selection (allowed even during cooldown, but needs active cursor)
      if (e.key === ' ' && cursorPosition) {
        e.preventDefault();
        setSelectedPixel({ x: cursorPosition.x, y: cursorPosition.y });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cursorPosition, selectedPixel, cooldownActive]);

  const handlePlacePixel = (color: string) => {
    console.log('handlePlacePixel called with:', { color, selectedPixel });
    if (!selectedPixel) {
      console.log('No selected pixel, returning');
      return;
    }
    
    // Check if authenticated
    if (!isAuthenticated) {
      setAuthMessage('You need to sign in to place pixels!');
      setShowAuthModal(true);
      return;
    }
    
    // Optimistic update: Add pixel immediately for instant feedback
    const optimisticPixel = {
      x: selectedPixel.x,
      y: selectedPixel.y,
      color: color,
      timestamp: Date.now()
    };
    
    setPlacedPixels(prev => {
      const filtered = prev.filter(pixel => !(pixel.x === selectedPixel.x && pixel.y === selectedPixel.y));
      return [...filtered, optimisticPixel];
    });
    
    const colorId = socketService.hexToColorId(color);
    console.log('Color converted to ID:', colorId);
    socketService.placePixel(selectedPixel.x, selectedPixel.y, colorId);
    
    // After painting: close interface but keep cursor position for further navigation
    setSelectedPixel(null);
    // Cursor position stays the same so user can continue moving with arrow keys
  };

  const handleAuthSuccess = async () => {
    const authStatus = await AuthService.verifyAuth();
    if (authStatus.valid) {
      setIsAuthenticated(true);
      setUsername(authStatus.username || null);
      setShowAuthModal(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    setUsername(null);
  };

  // Show analytics dashboard
  if (currentView === 'analytics') {
    return <AnalyticsDashboard />;
  }

  // Show badges page
  if (currentView === 'badges') {
    return <BadgesPage />;
  }

  // Show replay page
  if (currentView === 'replay') {
    return <ReplayPage />;
  }

  // Show canvas (default)
  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden'
    }}>
      {/* Canvas Loading Screen */}
      {isCanvasLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            🎨
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #333',
            borderTop: '4px solid #666',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <h2 style={{ 
            margin: '0 0 20px 0',
            fontSize: '24px',
            fontWeight: 'normal'
          }}>
            Loading Canvas...
          </h2>
          <p style={{ 
            margin: '0 0 10px 0',
            fontSize: '16px',
            color: '#888',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            Reading 1 million pixels from Redis bitfield
          </p>
          <p style={{ 
            margin: '0',
            fontSize: '14px',
            color: '#666',
            textAlign: 'center'
          }}>
            This may take a few seconds on first load...
          </p>
        </div>
      )}
      {/* Top Right Buttons */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        {isAuthenticated ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ 
              color: '#333', 
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '5px 10px',
              borderRadius: '5px'
            }}>
              👋 {username}
            </span>
            <button
              onClick={() => setShowUserProfile(true)}
              style={{
                padding: '10px 15px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              👤 Profile
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 15px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🚪 Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setAuthMessage('Sign in to access your profile and place pixels!');
              setShowAuthModal(true);
            }}
            style={{
              padding: '10px 15px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔑 Sign In
          </button>
        )}
        <button
          onClick={() => window.location.hash = 'badges'}
          style={{
            padding: '10px 15px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🏆 Badges
        </button>
        <button
          onClick={() => window.location.hash = 'analytics'}
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
          📊 Analytics
        </button>
        <button
          onClick={() => window.location.hash = 'replay'}
          style={{
            padding: '10px 15px',
            backgroundColor: '#FF5722',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🎬 Replay
        </button>
      </div>

      <Canvas
        width={1000}
        height={1000}
        onPixelHover={handlePixelHover}
        onZoomChange={handleZoomChange}
        onPanChange={handlePanChange}
        onPixelClick={handlePixelClick}
        selectedPixel={selectedPixel}
        onDeselectPixel={handleDeselectPixel}
        previewColor={previewColor}
        placedPixels={placedPixels}
      />
      <HeatmapOverlay
        width={1000}
        height={1000}
        zoom={zoom}
        pan={pan}
        showHeatmap={showHeatmap}
        heatmapData={heatmapData}
        maxIntensity={maxHeatmapIntensity}
      />
      <InfoHUD
        pixelX={hoveredPixel.x}
        pixelY={hoveredPixel.y}
        zoom={zoom}
        cursorPosition={cursorPosition}
      />
      <PixelInfoHUD
        selectedPixel={selectedPixel}
      />
      <PlacementHUD
        selectedPixel={selectedPixel}
        onPlacePixel={handlePlacePixel}
        onColorPreview={handleColorPreview}
        onCooldownChange={handleCooldownChange}
      />
      <HeatmapControls
        showHeatmap={showHeatmap}
        onToggleHeatmap={handleToggleHeatmap}
        timeRange={heatmapTimeRange}
        onTimeRangeChange={handleHeatmapTimeRangeChange}
        onRefreshData={handleHeatmapRefresh}
      />
      
      {/* User Profile Modal */}
      {showUserProfile && isAuthenticated && username && (
        <UserProfile 
          userId={`user:${username}`} 
          onClose={() => setShowUserProfile(false)} 
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authMessage}
        onAuthSuccess={handleAuthSuccess}
      />

    </div>
  )
}

export default App
