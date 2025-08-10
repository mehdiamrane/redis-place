import React from "react";
import styled from 'styled-components';
import { HUDPanel, HUDSection, HUDGroup, Button } from './ui';
import { theme } from '../styles/theme';

interface HeatmapControlsProps {
  showHeatmap: boolean;
  onToggleHeatmap: (show: boolean) => void;
  timeRange: number;
  onTimeRangeChange: (hours: number) => void;
  onRefreshData: () => void;
}

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  color: ${theme.colors.white};
  
  input {
    margin-right: ${theme.spacing.sm};
  }
`;

const TimeRangeGrid = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
`;

const LegendSection = styled.div`
  font-size: ${theme.fontSize.md};
  opacity: 0.8;
  border-top: 1px solid ${theme.colors.gray};
  padding-top: ${theme.spacing.sm};
  
  > div {
    margin-bottom: ${theme.spacing.xs};
  }
`;

const HeatmapControls: React.FC<HeatmapControlsProps> = ({
  showHeatmap,
  onToggleHeatmap,
  timeRange,
  onTimeRangeChange,
  onRefreshData,
}) => {
  const timeRangeOptions = [
    { value: 1, label: "1h" },
    { value: 6, label: "6h" },
    { value: 24, label: "24h" },
    { value: 168, label: "7d" },
  ];

  return (
    <HUDPanel
      position="relative"
      title="🔥 Activity Heatmap"
    >
      <HUDSection>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => onToggleHeatmap(e.target.checked)}
          />
          Show Heatmap
        </CheckboxLabel>
      </HUDSection>

      <HUDGroup>
        <label style={{ 
          fontSize: theme.fontSize.base, 
          fontWeight: 500, 
          color: showHeatmap ? theme.colors.white : theme.colors.gray,
          opacity: showHeatmap ? 1 : 0.6
        }}>
          Time Range:
        </label>
        <TimeRangeGrid>
          {timeRangeOptions.map((option) => (
            <Button
              key={option.value}
              size="small"
              variant={timeRange === option.value ? "primary" : "gray"}
              onClick={() => onTimeRangeChange(option.value)}
              disabled={!showHeatmap}
            >
              {option.label}
            </Button>
          ))}
        </TimeRangeGrid>
      </HUDGroup>

      <HUDGroup>
        <Button
          variant="warning"
          size="small"
          onClick={onRefreshData}
          disabled={!showHeatmap}
          style={{ width: '100%' }}
        >
          🔄 Refresh (Skip Cache)
        </Button>
      </HUDGroup>

      <HUDSection>
        <LegendSection style={{ opacity: showHeatmap ? 0.8 : 0.4 }}>
          <div>🔵 Cold zones (low activity)</div>
          <div>🟢 Moderate activity</div>
          <div>🟡 High activity</div>
          <div>🔴 Hot zones (very active)</div>
        </LegendSection>
      </HUDSection>
    </HUDPanel>
  );
};

export default HeatmapControls;
