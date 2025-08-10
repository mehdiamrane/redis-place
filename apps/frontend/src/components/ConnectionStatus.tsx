import React from "react";
import { HUDPanel, HUDStatusDot } from './ui';
import { theme } from '../styles/theme';

interface ConnectionStatusProps {
  status: "connecting" | "connected" | "disconnected";
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          text: "Connected",
          color: theme.colors.connected,
          show: true,
        };
      case "connecting":
        return {
          text: "Connecting...",
          color: theme.colors.connecting,
          show: true,
        };
      case "disconnected":
        return {
          text: "Disconnected",
          color: theme.colors.disconnected,
          show: true,
        };
      default:
        return { show: false };
    }
  };

  const config = getStatusConfig();

  if (!config.show) return null;

  return (
    <HUDPanel
      position="relative"
      background="status"
      size="compact"
      shape="pill"
      layout="row"
      style={{ 
        color: config.color,
        fontWeight: 'bold',
        fontSize: theme.fontSize.md,
        width: 'fit-content'
      }}
    >
      <HUDStatusDot color={config.color || theme.colors.gray} />
      {config.text}
    </HUDPanel>
  );
};

export default ConnectionStatus;
