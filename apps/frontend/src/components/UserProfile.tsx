import { useState, useEffect } from 'react';
import { colorIndexToHex } from '@redis-place/shared';

interface UserProfileData {
  profile: {
    pixelsPlaced: number;
    favoriteColor: number | null;
    firstPixelTime: number | null;
    lastPixelTime: number | null;
    colorUsage: Array<{color: number, count: number}>;
  } | null;
  rank: number | null;
}

interface UserProfileProps {
  userId: string;
  onClose: () => void;
}

function UserProfile({ userId, onClose }: UserProfileProps) {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const formatUserId = (userId: string) => {
    const parts = userId.split('_');
    return parts.length > 2 ? `User ${parts[2].substring(0, 8)}...` : userId;
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const getTimeSince = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Recently';
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '40px',
          borderRadius: '10px',
          color: 'white'
        }}>
          <h2>Loading User Profile...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '40px',
          borderRadius: '10px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2>Error Loading Profile</h2>
          <p>{error}</p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!profileData?.profile) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '40px',
          borderRadius: '10px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2>User Not Found</h2>
          <p>This user hasn't placed any pixels yet.</p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { profile, rank } = profileData;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '30px',
        borderRadius: '10px',
        color: 'white',
        minWidth: '400px',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>👤 User Profile</h2>
          <button
            onClick={onClose}
            style={{
              padding: '5px 10px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>{formatUserId(userId)}</h3>
          <div style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>
            ID: {userId}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '15px' }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ backgroundColor: '#3a3a3a', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                {profile.pixelsPlaced.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>Pixels Placed</div>
            </div>
            
            <div style={{ backgroundColor: '#3a3a3a', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                {rank ? `#${rank}` : 'Unranked'}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>Global Rank</div>
            </div>
          </div>

          {/* Favorite Color */}
          {profile.favoriteColor !== null && (
            <div style={{ backgroundColor: '#3a3a3a', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>Favorite Color</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: colorIndexToHex(profile.favoriteColor),
                    borderRadius: '5px',
                    border: '2px solid #666'
                  }}
                />
                <span style={{ fontWeight: 'bold' }}>
                  {colorIndexToHex(profile.favoriteColor)}
                </span>
              </div>
            </div>
          )}

          {/* Color Usage Breakdown */}
          {profile.colorUsage && profile.colorUsage.length > 0 && (
            <div style={{ backgroundColor: '#3a3a3a', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>Color Usage Breakdown</div>
              <div style={{ display: 'grid', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                {profile.colorUsage.map((usage, index) => (
                  <div
                    key={usage.color}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: colorIndexToHex(usage.color),
                          borderRadius: '3px',
                          border: '1px solid #666'
                        }}
                      />
                      <span style={{ fontSize: '13px' }}>
                        {colorIndexToHex(usage.color)}
                        {index === 0 && ' ⭐'}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#bbb' }}>
                      {usage.count} pixel{usage.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Times */}
          <div style={{ backgroundColor: '#3a3a3a', padding: '15px', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>Activity</div>
            <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>First Pixel:</span>
                <span style={{ color: '#bbb' }}>{formatDate(profile.firstPixelTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Last Pixel:</span>
                <span style={{ color: '#bbb' }}>{getTimeSince(profile.lastPixelTime)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 30px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;