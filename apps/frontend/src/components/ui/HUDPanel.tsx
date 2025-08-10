import styled from 'styled-components';
import { theme } from '../../styles/theme';

export interface HUDPanelProps {
  position?: 'fixed' | 'absolute' | 'relative';
  placement?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'top-center' | 'bottom-center';
  offset?: string;
  background?: 'dark' | 'darker' | 'transparent' | 'status';
  size?: 'compact' | 'normal' | 'large';
  shape?: 'rounded' | 'pill' | 'square';
  layout?: 'column' | 'row';
  interactive?: boolean;
  title?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const getPlacementStyles = (placement?: HUDPanelProps['placement'], offset = '20px') => {
  switch (placement) {
    case 'top-left':
      return { top: offset, left: offset };
    case 'top-right':
      return { top: offset, right: offset };
    case 'bottom-left':
      return { bottom: offset, left: offset };
    case 'bottom-right':
      return { bottom: offset, right: offset };
    case 'top-center':
      return { top: offset, left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-center':
      return { bottom: offset, left: '50%', transform: 'translateX(-50%)' };
    case 'center':
      return { 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)' 
      };
    default:
      return {};
  }
};

const getBackgroundColor = (background?: HUDPanelProps['background']) => {
  switch (background) {
    case 'dark':
      return theme.colors.overlay;
    case 'darker':
      return theme.colors.modalBackground;
    case 'transparent':
      return 'transparent';
    case 'status':
      return theme.colors.lightOverlay;
    default:
      return theme.colors.hudBackground;
  }
};

const getPadding = (size?: HUDPanelProps['size']) => {
  switch (size) {
    case 'compact':
      return `${theme.spacing.xs} ${theme.spacing.sm}`;
    case 'large':
      return `${theme.spacing.lg} ${theme.spacing.xl}`;
    default:
      return `${theme.spacing.md}`;
  }
};

const getBorderRadius = (shape?: HUDPanelProps['shape']) => {
  switch (shape) {
    case 'pill':
      return theme.borderRadius.pill;
    case 'square':
      return '0';
    default:
      return theme.borderRadius.xl;
  }
};

const StyledHUDPanel = styled.div<HUDPanelProps>`
  position: ${props => props.position || 'absolute'};
  ${props => {
    const placement = getPlacementStyles(props.placement, props.offset);
    return Object.entries(placement)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n  ');
  }}
  background: ${props => getBackgroundColor(props.background)};
  color: ${theme.colors.white};
  padding: ${props => getPadding(props.size)};
  border-radius: ${props => getBorderRadius(props.shape)};
  font-family: monospace;
  font-size: ${theme.fontSize.base};
  z-index: ${theme.zIndex.nav};
  pointer-events: ${props => props.interactive === false ? 'none' : 'auto'};
  display: flex;
  flex-direction: ${props => props.layout === 'row' ? 'row' : 'column'};
  align-items: ${props => props.layout === 'row' ? 'center' : 'stretch'};
  gap: ${props => props.size === 'compact' ? theme.spacing.xs : theme.spacing.sm};
`;

const HUDTitle = styled.h3`
  margin: 0;
  font-size: ${theme.fontSize.base};
  font-weight: bold;
  color: ${theme.colors.white};
  font-family: monospace;
`;

const HUDContent = styled.div<{ layout?: 'row' | 'column' }>`
  display: flex;
  flex-direction: ${props => props.layout === 'row' ? 'row' : 'column'};
  align-items: ${props => props.layout === 'row' ? 'center' : 'stretch'};
  gap: inherit;
`;

export const HUDPanel: React.FC<HUDPanelProps> = ({ children, title, layout, ...props }) => {
  return (
    <StyledHUDPanel layout={layout} {...props}>
      {title && <HUDTitle>{title}</HUDTitle>}
      <HUDContent layout={layout}>{children}</HUDContent>
    </StyledHUDPanel>
  );
};

// Additional HUD-specific components
export const HUDRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

export const HUDLabel = styled.span`
  color: ${theme.colors.lighterGray};
  font-size: ${theme.fontSize.md};
`;

export const HUDValue = styled.span`
  color: ${theme.colors.white};
  font-weight: bold;
  font-size: ${theme.fontSize.md};
`;

export const HUDStatusDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: ${theme.borderRadius.round};
  background-color: ${props => props.color};
  flex-shrink: 0;
`;

export const HUDGrid = styled.div<{ columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns || 2}, 1fr);
  gap: ${theme.spacing.sm};
`;

export const HUDSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  
  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.gray};
    padding-bottom: ${theme.spacing.sm};
  }
`;

export const HUDGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;