import { useState, useEffect } from "react";
import styled from "styled-components";
import { LuTrophy, LuCheck } from "react-icons/lu";
import { StatsGrid, PageLoader, ErrorPage } from "./layout";
import NavigationHeader from "./NavigationHeader";
import AuthService from "../services/authService";
import { getBadgeEmoji, getBadgeColor } from "../utils/badge";
import { theme } from "../styles/theme";

interface Badge {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  obtainMethod: string;
}

interface BadgeStats {
  badges: Badge[];
  totalCount: number;
  lastUpdated: number;
}

interface UserProfile {
  pixelsPlaced: number;
  favoriteColor: number | null;
  firstPixelTime: number | null;
  lastPixelTime: number | null;
  colorUsage: Array<{ color: number; count: number }>;
  badges: string[];
}

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #1a1a1a;
  padding: 80px 20px 40px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const ContentContainer = styled.div`
  background-color: #2a2a2a;
  padding: 30px;
  border-radius: 12px;
  width: 520px;
  max-width: 90vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.lg};
`;

const Title = styled.h1`
  margin: 0 0 ${theme.spacing.sm} 0;
  color: white;
  font-size: 2rem;
`;

const Subtitle = styled.div`
  font-size: ${theme.fontSize.sm};
  color: #888;
  margin-bottom: ${theme.spacing.lg};
`;

const ProgressText = styled.div`
  font-size: ${theme.fontSize.sm};
  color: #888;
  margin-bottom: ${theme.spacing.lg};
`;

const BadgesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
`;

const BadgeItem = styled.div<{ $isEarned: boolean }>`
  background-color: ${(props) => (props.$isEarned ? "#2d4a2d" : "#1f1f1f")};
  padding: 15px;
  border-radius: 10px;
  border: ${(props) => (props.$isEarned ? "2px solid #4CAF50" : "1px solid #3a3a3a")};
  position: relative;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const EarnedBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #4caf50;
  color: white;
  padding: 3px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
`;

const BadgeHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const BadgeIcon = styled.div<{ $backgroundColor: string; $isEarned: boolean }>`
  width: 40px;
  height: 40px;
  background-color: ${(props) => props.$backgroundColor};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 1.2rem;
  opacity: ${(props) => (props.$isEarned ? 1 : 0.5)};
`;

const BadgeInfo = styled.div`
  flex: 1;
`;

const BadgeTitle = styled.h4<{ $isEarned: boolean }>`
  margin: 0 0 3px 0;
  font-size: 14px;
  font-weight: bold;
  color: ${(props) => (props.$isEarned ? "#4CAF50" : "white")};
`;

const BadgeDescription = styled.p<{ $isEarned: boolean }>`
  margin: 0;
  font-size: 12px;
  color: #888;
  opacity: ${(props) => (props.$isEarned ? 1 : 0.7)};
`;

const ObtainMethod = styled.div<{ $isEarned: boolean }>`
  background-color: ${(props) => (props.$isEarned ? "#1f3d1f" : "#1a1a1a")};
  padding: 8px;
  border-radius: 5px;
  font-size: 11px;
  color: #ccc;
`;

const BadgesPage = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Override body overflow for this page
  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "hidden";
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const username = AuthService.getUsername();
        const [badgesResponse, profileResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_SERVER_URL}/api/badges`),
          username ? fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/user:${username}`) : Promise.resolve(null),
        ]);

        if (!badgesResponse.ok || (profileResponse && !profileResponse.ok)) {
          throw new Error("Failed to fetch data");
        }

        const badgesData: BadgeStats = await badgesResponse.json();
        const profileData = profileResponse ? await profileResponse.json() : null;

        setBadges(badgesData.badges);
        setUserProfile(profileData?.profile || null);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load badges and profile");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <NavigationHeader />
        <PageLoader message="Loading Badges..." />
      </>
    );
  }

  if (error) {
    return <ErrorPage error={error} onRetry={() => window.location.reload()} />;
  }

  const userBadges = userProfile?.badges || [];
  const earnedCount = userBadges.length;

  return (
    <>
      <NavigationHeader />
      <PageContainer>
        <ContentContainer>
          <Header>
            <Title>
              <LuTrophy style={{ fontSize: "1.5rem", marginRight: "0.5rem", verticalAlign: "middle" }} />
              Badge Collection
            </Title>
            <Subtitle>Earn badges by placing pixels and exploring the canvas</Subtitle>
            <ProgressText>
              Progress: {badges.length > 0 ? Math.round((earnedCount / badges.length) * 100) : 0}% complete
            </ProgressText>
          </Header>

          <StatsGrid
            stats={[
              {
                value: `${earnedCount}/${badges.length}`,
                label: "Badges Earned",
              },
              {
                value: userProfile?.pixelsPlaced || 0,
                label: "Pixels Placed",
              },
              {
                value: userProfile?.colorUsage?.length || 0,
                label: "Colors Used",
              },
            ]}
            columns={3}
          />

          <BadgesGrid>
            {badges.map((badge) => {
              const isEarned = userBadges.includes(badge.id);
              return (
                <BadgeItem key={badge.id} $isEarned={isEarned}>
                  {isEarned && (
                    <EarnedBadge>
                      <LuCheck style={{ fontSize: "12px", marginRight: "3px", verticalAlign: "middle" }} />
                      EARNED
                    </EarnedBadge>
                  )}

                  <BadgeHeader>
                    <BadgeIcon $backgroundColor={getBadgeColor(badge.id)} $isEarned={isEarned}>
                      {getBadgeEmoji(badge.id)}
                    </BadgeIcon>
                    <BadgeInfo>
                      <BadgeTitle $isEarned={isEarned}>{badge.title}</BadgeTitle>
                      <BadgeDescription $isEarned={isEarned}>{badge.description}</BadgeDescription>
                    </BadgeInfo>
                  </BadgeHeader>

                  <ObtainMethod $isEarned={isEarned}>
                    <strong>How to earn:</strong> {badge.obtainMethod}
                  </ObtainMethod>
                </BadgeItem>
              );
            })}
          </BadgesGrid>
        </ContentContainer>
      </PageContainer>
    </>
  );
};

export default BadgesPage;
