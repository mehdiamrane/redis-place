import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colorIndexToHex } from '@redis-place/shared';
import { getBadgeTitle, getBadgeEmoji, getBadgeColor } from '../utils/badge';
import { Modal, Button, Card } from './ui';
import { theme } from '../styles/theme';

interface UserProfileData {
  profile: {
    pixelsPlaced: number;
    favoriteColor: number | null;
    firstPixelTime: number | null;
    lastPixelTime: number | null;
    colorUsage: Array<{color: number, count: number}>;
    badges: string[];
  } | null;
  rank: number | null;
}

interface UserProfileProps {
  userId: string;
  onClose: () => void;
}

const ProfileGrid = styled.div`
  display: grid;
  gap: ${theme.spacing.md};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.md};
`;

const StatCard = styled(Card)`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${theme.fontSize.xl};
  font-weight: bold;
  margin-bottom: ${theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSize.md};
  color: ${theme.colors.lightGray};
`;

const ColorDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ColorSwatch = styled.div<{ color: string }>`
  width: 30px;
  height: 30px;
  background-color: ${props => props.color};
  border-radius: ${theme.borderRadius.md};
  border: 2px solid ${theme.colors.gray};
`;

const ColorUsageGrid = styled.div`
  display: grid;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
`;

const ColorUsageItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
`;

const ColorUsageLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const SmallColorSwatch = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  background-color: ${props => props.color};
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid ${theme.colors.gray};
`;

const BadgesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${theme.spacing.sm};
  max-height: 150px;
  overflow-y: auto;
`;

const Badge = styled.div<{ borderColor: string }>`
  display: flex;
  align-items: center;
  padding: ${theme.spacing.sm};
  background-color: ${theme.colors.cardBackground};
  border-radius: 6px;
  border: 2px solid ${props => props.borderColor};
  gap: ${theme.spacing.sm};
`;

const BadgeIcon = styled.div<{ backgroundColor: string }>`
  width: 24px;
  height: 24px;
  background-color: ${props => props.backgroundColor};
  border-radius: ${theme.borderRadius.round};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.fontSize.md};
`;

const BadgeInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const BadgeTitle = styled.div<{ color: string }>`
  font-size: ${theme.fontSize.md};
  font-weight: bold;
  color: ${props => props.color};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActivityGrid = styled.div`
  display: grid;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
`;

const ActivityRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const UserIdContainer = styled.div`
  margin-bottom: ${theme.spacing.lg};
  
  h3 {
    margin: 0 0 ${theme.spacing.sm} 0;
  }
`;

const UserIdText = styled.div`
  font-size: ${theme.fontSize.md};
  color: ${theme.colors.lightGray};
  font-family: monospace;
`;

const SectionTitle = styled.div`
  font-size: ${theme.fontSize.base};
  color: ${theme.colors.lightGray};
  margin-bottom: ${theme.spacing.sm};
`;

const CenterContainer = styled.div`
  text-align: center;
`;

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
      <Modal isOpen={true} onClose={onClose} title="Loading User Profile..." showCloseButton={false}>
        <CenterContainer>
          <p>Loading user profile...</p>
        </CenterContainer>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Error Loading Profile" showCloseButton={false}>
        <CenterContainer>
          <p>{error}</p>
          <Button variant="primary" onClick={onClose} style={{ marginTop: theme.spacing.lg }}>
            Close
          </Button>
        </CenterContainer>
      </Modal>
    );
  }

  if (!profileData?.profile) {
    return (
      <Modal isOpen={true} onClose={onClose} title="User Not Found" showCloseButton={false}>
        <CenterContainer>
          <p>This user hasn't placed any pixels yet.</p>
          <Button variant="primary" onClick={onClose} style={{ marginTop: theme.spacing.lg }}>
            Close
          </Button>
        </CenterContainer>
      </Modal>
    );
  }

  const { profile, rank } = profileData;

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title="👤 User Profile"
      maxWidth="500px"
    >
      <UserIdContainer>
        <h3>{formatUserId(userId)}</h3>
        <UserIdText>ID: {userId}</UserIdText>
      </UserIdContainer>

      <ProfileGrid>
        {/* Stats Grid */}
        <StatsGrid>
          <StatCard variant="darker" padding="medium">
            <StatValue>{profile.pixelsPlaced.toLocaleString()}</StatValue>
            <StatLabel>Pixels Placed</StatLabel>
          </StatCard>
          
          <StatCard variant="darker" padding="medium">
            <StatValue>{rank ? `#${rank}` : 'Unranked'}</StatValue>
            <StatLabel>Global Rank</StatLabel>
          </StatCard>
        </StatsGrid>

        {/* Favorite Color */}
        {profile.favoriteColor !== null && (
          <Card variant="darker" padding="medium">
            <SectionTitle>Favorite Color</SectionTitle>
            <ColorDisplay>
              <ColorSwatch color={colorIndexToHex(profile.favoriteColor) || 'transparent'} />
              <span style={{ fontWeight: 'bold' }}>
                {colorIndexToHex(profile.favoriteColor)}
              </span>
            </ColorDisplay>
          </Card>
        )}

        {/* Color Usage Breakdown */}
        {profile.colorUsage && profile.colorUsage.length > 0 && (
          <Card variant="darker" padding="medium">
            <SectionTitle>Color Usage Breakdown</SectionTitle>
            <ColorUsageGrid>
              {profile.colorUsage.map((usage, index) => (
                <ColorUsageItem key={usage.color}>
                  <ColorUsageLeft>
                    <SmallColorSwatch color={colorIndexToHex(usage.color) || 'transparent'} />
                    <span style={{ fontSize: theme.fontSize.sm }}>
                      {colorIndexToHex(usage.color)}
                      {index === 0 && ' ⭐'}
                    </span>
                  </ColorUsageLeft>
                  <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.lighterGray }}>
                    {usage.count} pixel{usage.count !== 1 ? 's' : ''}
                  </span>
                </ColorUsageItem>
              ))}
            </ColorUsageGrid>
          </Card>
        )}

        {/* Badges */}
        {profile.badges && profile.badges.length > 0 && (
          <Card variant="darker" padding="medium">
            <SectionTitle>Badges ({profile.badges.length})</SectionTitle>
            <BadgesGrid>
              {profile.badges.map((badgeId) => (
                <Badge key={badgeId} borderColor={getBadgeColor(badgeId)}>
                  <BadgeIcon backgroundColor={getBadgeColor(badgeId)}>
                    {getBadgeEmoji(badgeId)}
                  </BadgeIcon>
                  <BadgeInfo>
                    <BadgeTitle color={getBadgeColor(badgeId)}>
                      {getBadgeTitle(badgeId)}
                    </BadgeTitle>
                  </BadgeInfo>
                </Badge>
              ))}
            </BadgesGrid>
            <CenterContainer style={{ marginTop: theme.spacing.sm }}>
              <Button
                variant="purple"
                size="small"
                onClick={() => window.location.hash = 'badges'}
              >
                View All Badges
              </Button>
            </CenterContainer>
          </Card>
        )}

        {/* Activity Times */}
        <Card variant="darker" padding="medium">
          <SectionTitle>Activity</SectionTitle>
          <ActivityGrid>
            <ActivityRow>
              <span>First Pixel:</span>
              <span style={{ color: theme.colors.lighterGray }}>{formatDate(profile.firstPixelTime)}</span>
            </ActivityRow>
            <ActivityRow>
              <span>Last Pixel:</span>
              <span style={{ color: theme.colors.lighterGray }}>{getTimeSince(profile.lastPixelTime)}</span>
            </ActivityRow>
          </ActivityGrid>
        </Card>
      </ProfileGrid>

      <CenterContainer style={{ marginTop: theme.spacing.lg }}>
        <Button variant="primary" onClick={onClose}>
          Close Profile
        </Button>
      </CenterContainer>
    </Modal>
  );
}

export default UserProfile;