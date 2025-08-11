import { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { LuTrendingUp, LuTrophy, LuPalette, LuZap } from "react-icons/lu";
import { colorIndexToHex } from "@redis-place/shared";
import { getBadgeTitle, getBadgeEmoji, getBadgeColor } from "../utils/badge";
import { formatUserId, formatTimestamp } from "../utils/pageUtils";
import { StatsGrid, PageLoader, ErrorPage } from "./layout";
import NavigationHeader from "./NavigationHeader";
import { theme } from "../styles/theme";

interface LeaderboardEntry {
  userId: string;
  score: number;
}

interface ActivityEntry {
  id: string;
  userId: string;
  type: "pixel" | "badge";
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
  recentActivity: ActivityEntry[];
  colorStats: ColorStat[];
  totalPixelsPlaced: number;
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

const ListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  margin-bottom: 5px;
  background-color: #3a3a3a;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.02);
    opacity: 0.9;
  }
`;

const LeaderboardItem = styled(ListItem)<{ $rank: number }>`
  background-color: ${(props) =>
    props.$rank === 0 ? "#FFD700" : props.$rank === 1 ? "#C0C0C0" : props.$rank === 2 ? "#CD7F32" : "#3a3a3a"};
  color: ${(props) => (props.$rank < 3 ? "#000" : "#fff")};
`;

function AnalyticsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/stats`);
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUserClick = (userId: string) => {
    const cleanUserId = userId.startsWith("user:") ? userId.substring(5) : userId;
    navigate(`/profile/${cleanUserId}`);
  };

  if (loading) {
    return (
      <>
        <NavigationHeader />
        <PageLoader message="Loading Analytics..." />
      </>
    );
  }

  if (error) {
    return <ErrorPage error={error} />;
  }

  if (!stats) {
    return (
      <>
        <NavigationHeader />
        <PageLoader message="No data available" />
      </>
    );
  }

  return (
    <>
      <NavigationHeader />
      <PageContainer>
        <ContentContainer>
          <Header>
            <Title>
              <LuTrendingUp style={{ fontSize: "1.5rem", marginRight: "0.5rem", verticalAlign: "middle" }} />
              Analytics
            </Title>
            <Subtitle>Real-time analytics powered by Redis • Updated every 10 seconds</Subtitle>
          </Header>

          <StatsGrid
            stats={[
              {
                value: stats.totalPixelsPlaced,
                label: "Total Pixels Placed (All Time)",
              },
              {
                value: stats.dailyVisitors,
                label: "Unique Visitors Today",
                description: "Resets daily at midnight",
              },
              {
                value: stats.topUsers.length,
                label: "Users Who Placed Pixels",
                description: "All time contributors",
              },
            ]}
            columns={3}
          />

          <Section>
            <SectionTitle>
              <LuTrophy /> Top Contributors (All Time)
            </SectionTitle>
            <SectionSubtitle>Ranked by total pixels placed since server started</SectionSubtitle>
            {stats.topUsers.slice(0, 10).map((user, index) => (
              <LeaderboardItem key={user.userId} $rank={index} onClick={() => handleUserClick(user.userId)}>
                <span>
                  #{index + 1} {formatUserId(user.userId.startsWith("user:") ? user.userId.substring(5) : user.userId)}
                </span>
                <strong>{user.score} pixels</strong>
              </LeaderboardItem>
            ))}
          </Section>

          <Section>
            <SectionTitle>
              <LuPalette /> Most Popular Colors
            </SectionTitle>
            <SectionSubtitle>Total usage count since server started • Top 10 colors</SectionSubtitle>
            {stats.colorStats.slice(0, 10).map((colorStat, index) => {
              const colorHex = colorIndexToHex(colorStat.color);
              return (
                <ListItem key={colorStat.color}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: colorHex,
                        borderRadius: "3px",
                        border: "1px solid #666",
                      }}
                    />
                    <span>#{index + 1}</span>
                  </div>
                  <strong>{colorStat.count} uses</strong>
                </ListItem>
              );
            })}
          </Section>

          <Section>
            <SectionTitle>
              <LuZap /> Recent Activity
            </SectionTitle>
            <SectionSubtitle>Last 20 activities (pixels & badges) • Live updates every 10 seconds</SectionSubtitle>
            {stats.recentActivity.map((activity) => {
              if (activity.type === "badge") {
                return (
                  <ListItem key={activity.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          backgroundColor: getBadgeColor(activity.badgeId!),
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                        }}
                      >
                        {getBadgeEmoji(activity.badgeId!)}
                      </div>
                      <span
                        style={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          color: "white",
                        }}
                        onClick={() => handleUserClick(activity.userId)}
                      >
                        {formatUserId(
                          activity.userId.startsWith("user:") ? activity.userId.substring(5) : activity.userId
                        )}
                      </span>
                      <span style={{ color: "#888" }}>earned {getBadgeTitle(activity.badgeId!)}</span>
                    </div>
                    <span style={{ color: "#bbb", fontSize: "12px" }}>{formatTimestamp(activity.timestamp)}</span>
                  </ListItem>
                );
              } else {
                const colorHex = colorIndexToHex(activity.color!);
                return (
                  <ListItem key={activity.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          backgroundColor: colorHex,
                          borderRadius: "2px",
                          border: "1px solid #666",
                        }}
                      />
                      <span
                        style={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          color: "white",
                        }}
                        onClick={() => handleUserClick(activity.userId)}
                      >
                        {formatUserId(
                          activity.userId.startsWith("user:") ? activity.userId.substring(5) : activity.userId
                        )}
                      </span>
                      <span style={{ color: "#888" }}>
                        ({activity.x}, {activity.y})
                      </span>
                    </div>
                    <span style={{ color: "#bbb", fontSize: "12px" }}>{formatTimestamp(activity.timestamp)}</span>
                  </ListItem>
                );
              }
            })}
          </Section>
        </ContentContainer>
      </PageContainer>
    </>
  );
}

export default AnalyticsPage;
