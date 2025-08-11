import React from "react";
import styled from "styled-components";
import { LuVideo } from "react-icons/lu";
import { HUDPanel, HUDRow, HUDLabel, HUDValue, HUDSection } from "./ui";
import { theme } from "../styles/theme";

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

interface ReplayInfoProps {
  events: ReplayEvent[];
  displayedPixels: PlacedPixel[];
}

const InfoContainer = styled.div`
  position: fixed;
  top: ${theme.spacing.md};
  left: ${theme.spacing.md};
  z-index: ${theme.zIndex.nav};
`;

const DateRange = styled.div`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.lightGray};
  text-align: center;
`;

const ReplayInfo: React.FC<ReplayInfoProps> = ({ events, displayedPixels }) => {
  if (events.length === 0) return null;

  return (
    <InfoContainer>
      <HUDPanel position="relative" title="Canvas Replay" titleIcon={<LuVideo />}>
        <HUDRow>
          <HUDLabel>Events:</HUDLabel>
          <HUDValue>{events.length}</HUDValue>
        </HUDRow>
        <HUDRow>
          <HUDLabel>Pixels:</HUDLabel>
          <HUDValue>{displayedPixels.length}</HUDValue>
        </HUDRow>
        {events[0] && events[events.length - 1] && (
          <HUDSection>
            <DateRange>
              {new Date(events[0].timestamp).toLocaleDateString()} -{" "}
              {new Date(events[events.length - 1].timestamp).toLocaleDateString()}
            </DateRange>
          </HUDSection>
        )}
      </HUDPanel>
    </InfoContainer>
  );
};

export default ReplayInfo;
