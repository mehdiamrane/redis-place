import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { LuUser, LuTrophy, LuPalette, LuZap } from "react-icons/lu";
import { IoStar } from "react-icons/io5";
import { colorIdToHex, colorIndexToHex } from "@redis-place/shared";
import { getBadgeTitle, getBadgeEmoji, getBadgeColor } from "../utils/badge";
import { formatUserId, formatDate, getTimeSince } from "../utils/pageUtils";
import { StatsGrid, PageLoader, ErrorPage } from "./layout";
import NavigationHeader from "./NavigationHeader";
import { theme } from "../styles/theme";

interface UserProfileData {
  profile: {
    pixelsPlaced: number;
    favoriteColor: number | null;
    firstPixelTime: number | null;
    lastPixelTime: number | null;
    colorUsage: Array<{ color: number; count: number }>;
    badges: string[];
  } | null;
  rank: number | null;
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

const Section = styled.div`
  margin-top: ${theme.spacing.lg};
`;

const SectionTitle = styled.h3`
  margin: 0 0 ${theme.spacing.sm} 0;
  color: white;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

const SectionSubtitle = styled.div`
  font-size: ${theme.fontSize.sm};
  color: #888;
  margin-bottom: ${theme.spacing.md};
`;

const ColorUsageItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  margin-bottom: 5px;
  background-color: #3a3a3a;
  border-radius: 5px;
`;

const ColorUsageLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const SmallColorSwatch = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  background-color: ${(props) => props.color};
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid ${theme.colors.gray};
`;

const Badge = styled.div<{ $borderColor: string }>`
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #1f1f1f;
  border-radius: 10px;
  border: 2px solid ${(props) => props.$borderColor};
  gap: ${theme.spacing.sm};
  margin-bottom: 10px;
`;

const BadgeIcon = styled.div<{ $backgroundColor: string }>`
  width: 40px;
  height: 40px;
  background-color: ${(props) => props.$backgroundColor};
  border-radius: ${theme.borderRadius.round};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const BadgeInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const BadgeTitle = styled.div<{ $color: string }>`
  font-size: 14px;
  font-weight: bold;
  color: ${(props) => props.$color};
  margin-bottom: 3px;
`;

const BadgeDescription = styled.div`
  font-size: 12px;
  color: #888;
`;

const ActivityRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px;
  margin-bottom: 5px;
  background-color: #3a3a3a;
  border-radius: 5px;
`;

const ViewBadgesButton = styled.button`
  padding: 12px 24px;
  background-color: #9c27b0;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-top: ${theme.spacing.md};
  display: block;
  margin-left: auto;
  margin-right: auto;

  &:hover {
    background-color: #7b1fa2;
  }
`;

function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
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
    if (!userId) {
      setError("No user ID provided");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/user:${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <>
        <NavigationHeader />
        <PageLoader message="Loading User Profile..." />
      </>
    );
  }

  if (error) {
    return <ErrorPage error={error} onRetry={() => navigate("/")} />;
  }

  if (!profileData?.profile) {
    return (
      <>
        <NavigationHeader />
        <PageContainer>
          <ContentContainer>
            <Header>
              <Title>
                <LuUser style={{ fontSize: "1.5rem", marginRight: "0.5rem", verticalAlign: "middle" }} />
                User Not Found
              </Title>
              <Subtitle style={{ fontSize: "16px" }}>This user doesn't exist or hasn't placed any pixels yet.</Subtitle>
            </Header>
          </ContentContainer>
        </PageContainer>
      </>
    );
  }

  const { profile, rank } = profileData;

  return (
    <>
      <NavigationHeader />
      <PageContainer>
        <ContentContainer>
          <Header>
            <Title>
              <LuUser style={{ fontSize: "1.5rem", marginRight: "0.5rem", verticalAlign: "middle" }} />
              {formatUserId(userId || "")}
            </Title>
          </Header>

          <StatsGrid
            stats={[
              {
                value: profile.pixelsPlaced,
                label: "Pixels Placed",
              },
              {
                value: rank ? `#${rank}` : "Unranked",
                label: "Global Rank",
              },
              ...(profile.favoriteColor !== null && profile.favoriteColor !== undefined
                ? [
                    {
                      value: "",
                      label: "Favorite Color",
                      colorValue: colorIdToHex(profile.favoriteColor),
                    },
                  ]
                : []),
            ]}
            columns={3}
          />

          {profile.badges && profile.badges.length > 0 && (
            <Section>
              <SectionTitle>
                <LuTrophy /> Badges ({profile.badges.length})
              </SectionTitle>
              {profile.badges.map((badgeId) => (
                <Badge key={badgeId} $borderColor={getBadgeColor(badgeId)}>
                  <BadgeIcon $backgroundColor={getBadgeColor(badgeId)}>{getBadgeEmoji(badgeId)}</BadgeIcon>
                  <BadgeInfo>
                    <BadgeTitle $color={getBadgeColor(badgeId)}>{getBadgeTitle(badgeId)}</BadgeTitle>
                    <BadgeDescription>Earned badge</BadgeDescription>
                  </BadgeInfo>
                </Badge>
              ))}
              <ViewBadgesButton onClick={() => navigate("/badges")}>View All Badges</ViewBadgesButton>
            </Section>
          )}

          {profile.colorUsage && profile.colorUsage.length > 0 && (
            <Section>
              <SectionTitle>
                <LuPalette /> Color Usage Breakdown
              </SectionTitle>
              <SectionSubtitle>{profile.colorUsage.length} different colors used</SectionSubtitle>
              {profile.colorUsage.map((usage, index) => (
                <ColorUsageItem key={usage.color}>
                  <ColorUsageLeft>
                    <SmallColorSwatch color={colorIndexToHex(usage.color) || "transparent"} />
                    <span style={{ fontSize: theme.fontSize.sm, display: "flex", alignItems: "center" }}>
                      {index === 0 && (
                        <>
                          <IoStar style={{ fontSize: "12px", marginRight: "4px", verticalAlign: "middle" }} />
                          Most Used
                        </>
                      )}
                    </span>
                  </ColorUsageLeft>
                  <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.lighterGray }}>
                    {usage.count} pixel{usage.count !== 1 ? "s" : ""}
                  </span>
                </ColorUsageItem>
              ))}
            </Section>
          )}

          <Section>
            <SectionTitle>
              <LuZap /> Activity Timeline
            </SectionTitle>
            <ActivityRow>
              <span>First Pixel:</span>
              <span style={{ color: theme.colors.lighterGray }}>{formatDate(profile.firstPixelTime)}</span>
            </ActivityRow>
            <ActivityRow>
              <span>Last Pixel:</span>
              <span style={{ color: theme.colors.lighterGray }}>{getTimeSince(profile.lastPixelTime)}</span>
            </ActivityRow>
          </Section>
        </ContentContainer>
      </PageContainer>
    </>
  );
}

export default ProfilePage;
