import { useState, useEffect } from 'react';
import { colorIndexToHex } from '@redis-place/shared';
import UserProfile from './UserProfile';
import socketService from '../services/socketService';
import { getBadgeTitle, getBadgeEmoji, getBadgeColor } from '../utils/badge';

interface LeaderboardEntry {
  userId: string;
  score: number;
}

interface ActivityEntry {
  id: string;
  userId: string;
  type: 'pixel' | 'badge';
  timestamp: number;
  x?: number;
  y?: number;
  color?: number;
  badgeId?: string;
}

interface ColorStat {
  color: number;
  count: number;
}

interface DashboardStats {
  topUsers: LeaderboardEntry[];
  dailyVisitors: number;
  hourlyVisitors: number;
  recentActivity: ActivityEntry[];
  colorStats: ColorStat[];
  totalPixelsPlaced: number;
}

function AnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/stats`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUserId = (userId: string) => {
    // Extract the random part from user_timestamp_randompart
    const parts = userId.split('_');
    return parts.length > 2 ? `User ${parts[2].substring(0, 6)}...` : userId;
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };


  if (loading) {
    return (
      <div style={{ padding: '20px', color: 'white' }}>
        <h1>Loading Analytics...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'white' }}>
        <h1>Error: {error}</h1>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '20px', color: 'white' }}>
        <h1>No data available</h1>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      color: 'white',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>📊 Redis Place Analytics</h1>
        <div style={{ fontSize: '14px', color: '#888', marginBottom: '15px' }}>
          Real-time analytics powered by Redis • Updated every 10 seconds
          <br />
          Current time: {new Date().toLocaleString()} • Server timezone: UTC
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ← Back to Canvas
          </button>
          <button
            onClick={() => handleUserClick(socketService.getCurrentUserId())}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            👤 My Profile
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Summary Stats */}
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
          <h2>📈 Live Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                {stats.totalPixelsPlaced.toLocaleString()}
              </div>
              <div style={{ color: '#888' }}>Total Pixels Placed (All Time)</div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                {stats.dailyVisitors}
              </div>
              <div style={{ color: '#888' }}>Unique Visitors Today</div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                Resets daily at midnight UTC
              </div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                {stats.hourlyVisitors}
              </div>
              <div style={{ color: '#888' }}>Unique Visitors This Hour</div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                Current hour: {new Date().getHours()}:00 - {new Date().getHours()}:59
              </div>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                {stats.topUsers.length}
              </div>
              <div style={{ color: '#888' }}>Users Who Placed Pixels</div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                All time contributors
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
          <h2>🏆 Top Contributors (All Time)</h2>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
            Ranked by total pixels placed since server started
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {stats.topUsers.map((user, index) => (
              <div
                key={user.userId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px',
                  marginBottom: '5px',
                  backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#3a3a3a',
                  color: index < 3 ? '#000' : '#fff',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => handleUserClick(user.userId)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <span>#{index + 1} {formatUserId(user.userId)}</span>
                <strong>{user.score} pixels</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Color Usage */}
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
          <h2>🎨 Most Popular Colors</h2>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
            Total usage count since server started • Top 10 colors
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {stats.colorStats.slice(0, 10).map((colorStat, index) => {
              const colorHex = colorIndexToHex(colorStat.color);
              return (
                <div
                  key={colorStat.color}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px',
                    marginBottom: '5px',
                    backgroundColor: '#3a3a3a',
                    borderRadius: '5px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: colorHex,
                        borderRadius: '3px',
                        border: '1px solid #666'
                      }}
                    />
                    <span>#{index + 1}</span>
                  </div>
                  <strong>{colorStat.count} uses</strong>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
          <h2>⚡ Recent Activity</h2>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
            Last 20 activities (pixels & badges) • Live updates every 10 seconds
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {stats.recentActivity.map((activity) => {
              if (activity.type === 'badge') {
                // Render badge activity
                return (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px',
                      marginBottom: '5px',
                      backgroundColor: '#3a3a3a',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: getBadgeColor(activity.badgeId!),
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px'
                        }}
                      >
                        {getBadgeEmoji(activity.badgeId!)}
                      </div>
                      <span 
                        style={{ 
                          cursor: 'pointer', 
                          textDecoration: 'underline',
                          color: '#4CAF50'
                        }}
                        onClick={() => handleUserClick(activity.userId)}
                      >
                        {formatUserId(activity.userId)}
                      </span>
                      <span style={{ color: '#888' }}>
                        earned {getBadgeTitle(activity.badgeId!)}
                      </span>
                    </div>
                    <span style={{ color: '#bbb', fontSize: '12px' }}>
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                );
              } else {
                // Render pixel activity
                const colorHex = colorIndexToHex(activity.color!);
                return (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px',
                      marginBottom: '5px',
                      backgroundColor: '#3a3a3a',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: colorHex,
                          borderRadius: '2px',
                          border: '1px solid #666'
                        }}
                      />
                      <span 
                        style={{ 
                          cursor: 'pointer', 
                          textDecoration: 'underline',
                          color: '#4CAF50'
                        }}
                        onClick={() => handleUserClick(activity.userId)}
                      >
                        {formatUserId(activity.userId)}
                      </span>
                      <span style={{ color: '#888' }}>
                        ({activity.x}, {activity.y})
                      </span>
                    </div>
                    <span style={{ color: '#bbb', fontSize: '12px' }}>
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>
      
      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfile 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}
    </div>
  );
}

export default AnalyticsDashboard;