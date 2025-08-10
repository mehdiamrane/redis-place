import React from 'react';
import styled from 'styled-components';
import { Sidebar, SidebarMain, SidebarFooter } from './ui';
import InfoHUD from './InfoHUD';
import PixelInfoHUD from './PixelInfoHUD';
import HeatmapControls from './HeatmapControls';
import ConnectionStatus from './ConnectionStatus';

const CompactWrapper = styled.div`
  align-self: flex-start;
`;

const FullWidthWrapper = styled.div`
  width: 100%;
`;

interface LeftSidebarProps {
  // InfoHUD props
  pixelX: number;
  pixelY: number;
  zoom: number;
  cursorPosition: { x: number; y: number } | null;
  
  // PixelInfoHUD props
  selectedPixel: { x: number; y: number } | null;
  
  // HeatmapControls props
  showHeatmap: boolean;
  onToggleHeatmap: (show: boolean) => void;
  timeRange: number;
  onTimeRangeChange: (hours: number) => void;
  onRefreshData: () => void;
  
  // ConnectionStatus props
  connectionStatus: "connecting" | "connected" | "disconnected";
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  pixelX,
  pixelY,
  zoom,
  cursorPosition,
  selectedPixel,
  showHeatmap,
  onToggleHeatmap,
  timeRange,
  onTimeRangeChange,
  onRefreshData,
  connectionStatus,
}) => {
  return (
    <Sidebar>
      <SidebarMain>
        <CompactWrapper>
          <InfoHUD
            pixelX={pixelX}
            pixelY={pixelY}
            zoom={zoom}
            cursorPosition={cursorPosition}
          />
        </CompactWrapper>
        <FullWidthWrapper>
          <PixelInfoHUD selectedPixel={selectedPixel} />
        </FullWidthWrapper>
        <FullWidthWrapper>
          <HeatmapControls
            showHeatmap={showHeatmap}
            onToggleHeatmap={onToggleHeatmap}
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
            onRefreshData={onRefreshData}
          />
        </FullWidthWrapper>
      </SidebarMain>
      <SidebarFooter>
        <CompactWrapper>
          <ConnectionStatus status={connectionStatus} />
        </CompactWrapper>
      </SidebarFooter>
    </Sidebar>
  );
};

export default LeftSidebar;