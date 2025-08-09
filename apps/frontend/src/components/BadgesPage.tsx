import { useState, useEffect } from "react";
import AuthService from "../services/authService";
import { getBadgeEmoji, getBadgeColor } from "../utils/badge";

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

const BadgesPage = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div
        style={{
          padding: "20px",
          color: "white",
          backgroundColor: "#1a1a1a",
          minHeight: "100vh",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>Loading Badges...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          color: "white",
          backgroundColor: "#1a1a1a",
          minHeight: "100vh",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>Error: {error}</h1>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const userBadges = userProfile?.badges || [];
  const earnedCount = userBadges.length;

  return (
    <div
      style={{
        padding: "20px",
        color: "white",
        backgroundColor: "#1a1a1a",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1>🏆 Badge Collection</h1>
        <div style={{ fontSize: "14px", color: "#888", marginBottom: "15px" }}>
          Earn badges by placing pixels and exploring the canvas • You have {earnedCount} of {badges.length} badges
          <br />
          Progress: {badges.length > 0 ? Math.round((earnedCount / badges.length) * 100) : 0}% complete
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => (window.location.hash = "")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            ← Back to Canvas
          </button>
          <button
            onClick={() => (window.location.hash = "analytics")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#FF9800",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            📊 Analytics
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        {/* Summary Stats */}
        <div style={{ backgroundColor: "#2a2a2a", padding: "20px", borderRadius: "10px" }}>
          <h2>📊 Badge Progress</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "14px" }}>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }}>{earnedCount}</div>
              <div style={{ color: "#888" }}>Badges Earned</div>
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }}>
                {badges.length - earnedCount}
              </div>
              <div style={{ color: "#888" }}>Badges Remaining</div>
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }}>
                {userProfile?.pixelsPlaced || 0}
              </div>
              <div style={{ color: "#888" }}>Total Pixels Placed</div>
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }}>
                {userProfile?.colorUsage?.length || 0}
              </div>
              <div style={{ color: "#888" }}>Colors Used</div>
            </div>
          </div>
        </div>

        {/* Badges List */}
        {badges.map((badge) => {
          const isEarned = userBadges.includes(badge.id);
          return (
            <div
              key={badge.id}
              style={{
                backgroundColor: isEarned ? "#2d4a2d" : "#2a2a2a",
                padding: "20px",
                borderRadius: "10px",
                border: isEarned ? "2px solid #4CAF50" : "1px solid #3a3a3a",
                position: "relative",
              }}
            >
              {isEarned && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  ✓ EARNED
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: getBadgeColor(badge.id),
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "15px",
                    fontSize: "1.5rem",
                    opacity: isEarned ? 1 : 0.5,
                  }}
                >
                  {getBadgeEmoji(badge.id)}
                </div>
                <div>
                  <h3
                    style={{
                      margin: "0 0 5px 0",
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: isEarned ? "#4CAF50" : "white",
                    }}
                  >
                    {badge.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#888",
                      opacity: isEarned ? 1 : 0.7,
                    }}
                  >
                    {badge.description}
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: isEarned ? "#1f3d1f" : "#1f1f1f",
                  padding: "10px",
                  borderRadius: "5px",
                  fontSize: "12px",
                  color: "#ccc",
                }}
              >
                <strong>How to earn:</strong> {badge.obtainMethod}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgesPage;
