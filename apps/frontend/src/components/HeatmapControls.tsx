import React from "react";
import styled from "styled-components";
import { LuFlame, LuRefreshCw } from "react-icons/lu";
import { HUDPanel, HUDSection, HUDGroup, Button } from "./ui";
import { theme } from "../styles/theme";

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
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
  }
`;

const LegendColorCircle = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  margin-right: ${theme.spacing.xs};
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  flex-shrink: 0;
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
    <HUDPanel position="relative" title="Activity Heatmap" titleIcon={<LuFlame />}>
      <HUDSection>
        <CheckboxLabel>
          <input type="checkbox" checked={showHeatmap} onChange={(e) => onToggleHeatmap(e.target.checked)} />
          Show Heatmap
        </CheckboxLabel>
      </HUDSection>

      <HUDGroup>
        <label
          style={{
            fontSize: theme.fontSize.base,
            fontWeight: 500,
            color: showHeatmap ? theme.colors.white : theme.colors.gray,
            opacity: showHeatmap ? 1 : 0.6,
          }}
        >
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
          style={{ width: "100%" }}
        >
          <LuRefreshCw style={{ marginRight: "6px" }} />
          Refresh (Skip Cache)
        </Button>
      </HUDGroup>

      <HUDSection>
        <LegendSection style={{ opacity: showHeatmap ? 0.8 : 0.4 }}>
          <div>
            <LegendColorCircle $color="#ff0000" />
            Hot zones (very active)
          </div>
          <div>
            <LegendColorCircle $color="#ff8800" />
            High activity
          </div>
          <div>
            <LegendColorCircle $color="#ffff00" />
            Moderate activity
          </div>
          <div>
            <LegendColorCircle $color="#4444ff" />
            Low activity
          </div>
        </LegendSection>
      </HUDSection>
    </HUDPanel>
  );
};

export default HeatmapControls;
