import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { colorIdToHex, isEmptyPixel } from "@redis-place/shared";
import { HUDPanel, HUDRow, HUDLabel, HUDValue, HUDSection, HUDGroup } from "./ui";
import { theme } from "../styles/theme";

interface PixelInfoData {
  x: number;
  y: number;
  currentColor: number;
  lastPlacement?: {
    userId: string;
    x: number;
    y: number;
    color: number;
    timestamp: number;
  } | null;
  message?: string;
  searchAttempts?: number;
}

interface PixelInfoHUDProps {
  selectedPixel: { x: number; y: number } | null;
}

const ColorSwatch = styled.div<{ color: string }>`
  width: 14px;
  height: 14px;
  background-color: ${(props) => props.color};
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid ${theme.colors.white};
  flex-shrink: 0;
`;

const PlacementInfo = styled.div`
  background-color: rgba(76, 175, 80, 0.15);
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid rgba(76, 175, 80, 0.3);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.xs};
  font-weight: bold;
`;

const TimeInfo = styled.div`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.lightGray};
`;

const PixelInfoHUD: React.FC<PixelInfoHUDProps> = ({ selectedPixel }) => {
  const [infoData, setInfoData] = useState<PixelInfoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pixel info when selected pixel changes
  useEffect(() => {
    if (!selectedPixel || selectedPixel.x < 0 || selectedPixel.y < 0) {
      setInfoData(null);
      setError(null);
      return;
    }

    const fetchInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/api/pixel-info/${selectedPixel.x}/${selectedPixel.y}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch pixel info");
        }

        const data = await response.json();
        setInfoData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pixel info");
        console.error("Error fetching pixel info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [selectedPixel]);

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return "now";
    }
  };

  return (
    <HUDPanel
      position="relative"
      title="📍 Pixel Info"
    >
      {/* Position Row - Always present */}
      <HUDGroup>
        <HUDRow>
          <HUDLabel>Position:</HUDLabel>
          <HUDValue>
            {selectedPixel ? `(${selectedPixel.x}, ${selectedPixel.y})` : "Select a pixel"}
          </HUDValue>
        </HUDRow>
      </HUDGroup>

      {/* Current Color Row - Always present */}
      <HUDGroup>
        <HUDRow
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            padding: theme.spacing.sm,
            borderRadius: theme.borderRadius.sm,
          }}
        >
          <ColorSwatch 
            color={
              loading ? "transparent" :
              error ? "transparent" :
              infoData ? (colorIdToHex(infoData.currentColor) || "transparent") :
              "transparent"
            } 
          />
          <HUDValue>
            {loading ? "🔍 Searching..." :
             error ? "❌ Error loading" :
             !selectedPixel ? "No pixel selected" :
             infoData ? (isEmptyPixel(infoData.currentColor) ? "Empty" : `Color ${infoData.currentColor}`) :
             "Loading..."}
          </HUDValue>
        </HUDRow>
      </HUDGroup>

      {/* Placement Info Section - Always present */}
      <HUDSection>
        {loading && selectedPixel ? (
          <>
            <HUDLabel>Last placed by:</HUDLabel>
            <PlacementInfo>
              <UserInfo>
                <ColorSwatch color="transparent" />
                <HUDValue>🔍 Searching...</HUDValue>
              </UserInfo>
              <TimeInfo>Loading placement data...</TimeInfo>
              <TimeInfo>Please wait</TimeInfo>
            </PlacementInfo>
          </>
        ) : error ? (
          <>
            <HUDLabel>Last placed by:</HUDLabel>
            <PlacementInfo style={{ backgroundColor: "rgba(220, 53, 69, 0.15)", borderColor: "rgba(220, 53, 69, 0.3)" }}>
              <UserInfo>
                <ColorSwatch color="transparent" />
                <HUDValue>❌ Error loading</HUDValue>
              </UserInfo>
              <TimeInfo>{error}</TimeInfo>
              <TimeInfo>Try selecting another pixel</TimeInfo>
            </PlacementInfo>
          </>
        ) : !selectedPixel ? (
          <>
            <HUDLabel>Last placed by:</HUDLabel>
            <PlacementInfo style={{ backgroundColor: "rgba(153, 153, 153, 0.15)", borderColor: "rgba(153, 153, 153, 0.3)" }}>
              <UserInfo>
                <ColorSwatch color="transparent" />
                <HUDValue>No pixel selected</HUDValue>
              </UserInfo>
              <TimeInfo>Select a pixel to view its info</TimeInfo>
              <TimeInfo>Click on the canvas</TimeInfo>
            </PlacementInfo>
          </>
        ) : infoData ? (
          isEmptyPixel(infoData.currentColor) ? (
            <>
              <HUDLabel>Last placed by:</HUDLabel>
              <PlacementInfo style={{ backgroundColor: "rgba(153, 153, 153, 0.15)", borderColor: "rgba(153, 153, 153, 0.3)" }}>
                <UserInfo>
                  <ColorSwatch color="transparent" />
                  <HUDValue>Nobody</HUDValue>
                </UserInfo>
                <TimeInfo>This pixel is empty</TimeInfo>
                <TimeInfo>No color has been placed</TimeInfo>
              </PlacementInfo>
            </>
          ) : infoData.lastPlacement ? (
            <>
              <HUDLabel>Last placed by:</HUDLabel>
              <PlacementInfo>
                <UserInfo>
                  <ColorSwatch color={colorIdToHex(infoData.lastPlacement.color) || "transparent"} />
                  <HUDValue>{infoData.lastPlacement.userId}</HUDValue>
                </UserInfo>
                <TimeInfo>{new Date(infoData.lastPlacement.timestamp).toLocaleString()}</TimeInfo>
                <TimeInfo>{getRelativeTime(infoData.lastPlacement.timestamp)}</TimeInfo>
              </PlacementInfo>
              {infoData.searchAttempts && infoData.searchAttempts > 1 && (
                <HUDLabel style={{ fontSize: theme.fontSize.xs, marginTop: theme.spacing.xs }}>
                  Found after searching {infoData.searchAttempts} batches
                </HUDLabel>
              )}
            </>
          ) : (
            <>
              <HUDLabel>Last placed by:</HUDLabel>
              <PlacementInfo style={{ backgroundColor: "rgba(153, 153, 153, 0.15)", borderColor: "rgba(153, 153, 153, 0.3)" }}>
                <UserInfo>
                  <ColorSwatch color="transparent" />
                  <HUDValue>Unknown</HUDValue>
                </UserInfo>
                <TimeInfo>{infoData.message || "No placement found"}</TimeInfo>
                <TimeInfo>Data may be archived</TimeInfo>
              </PlacementInfo>
            </>
          )
        ) : (
          <>
            <HUDLabel>Last placed by:</HUDLabel>
            <PlacementInfo>
              <UserInfo>
                <ColorSwatch color="transparent" />
                <HUDValue>Loading...</HUDValue>
              </UserInfo>
              <TimeInfo>Fetching placement data</TimeInfo>
              <TimeInfo>Please wait</TimeInfo>
            </PlacementInfo>
          </>
        )}
      </HUDSection>
    </HUDPanel>
  );
};

export default PixelInfoHUD;
