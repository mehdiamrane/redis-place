import React from "react";
import styled from "styled-components";
import { HUDPanel, HUDSection, Button } from "./ui";
import { theme } from "../styles/theme";

interface ReplayControlsProps {
  startDate: string;
  endDate: string;
  loading: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onLoadEvents: () => void;
  onLoadEventsWithDates: (startDate: Date, endDate: Date) => void;
  formatDateForInput: (date: Date) => string;
}

const MainControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;
  justify-content: center;
`;

const DateInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

const DateInput = styled.input`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background-color: ${theme.colors.cardBackground};
  color: ${theme.colors.white};
  border: 1px solid ${theme.colors.gray};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.fontSize.sm};
  font-family: monospace;
  min-width: 160px;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
`;

const PresetButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  justify-content: center;
`;

const ReplayControls: React.FC<ReplayControlsProps> = ({
  startDate,
  endDate,
  loading,
  onStartDateChange,
  onEndDateChange,
  onLoadEvents,
  onLoadEventsWithDates,
  formatDateForInput,
}) => {
  return (
    <HUDPanel
      position="relative"
      title="📅 Date Range"
      style={{ width: "600px" }}
    >
      {/* Main controls row */}
      <HUDSection>
        <MainControls>
          <DateInputGroup>
            <label>From:</label>
            <DateInput
              type="datetime-local"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </DateInputGroup>

          <DateInputGroup>
            <label>To:</label>
            <DateInput
              type="datetime-local"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </DateInputGroup>

          <Button
            variant="success"
            size="small"
            onClick={onLoadEvents}
            disabled={loading || !startDate || !endDate}
          >
            🎬 Load Replay
          </Button>
        </MainControls>
      </HUDSection>

      {/* Quick load buttons row */}
      <HUDSection>
        <PresetButtons>
          {[
            { label: "Load Last 1h", hours: 1 },
            { label: "Load Last 6h", hours: 6 },
            { label: "Load Last 24h", hours: 24 },
            { label: "Load Last 7d", hours: 24 * 7 },
          ].map(({ label, hours }) => (
            <Button
              key={label}
              variant="gray"
              size="small"
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
                onStartDateChange(formatDateForInput(start));
                onEndDateChange(formatDateForInput(now));
                // Load data immediately with the calculated dates
                onLoadEventsWithDates(start, now);
              }}
            >
              {label}
            </Button>
          ))}
        </PresetButtons>
      </HUDSection>
    </HUDPanel>
  );
};

export default ReplayControls;
