import styled from 'styled-components';
import { theme } from '../../styles/theme';

export interface CardProps {
  variant?: 'dark' | 'light' | 'darker';
  padding?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const getBackgroundColor = (variant?: CardProps['variant']) => {
  switch (variant) {
    case 'light':
      return theme.colors.lightestGray;
    case 'darker':
      return theme.colors.dark;
    default:
      return theme.colors.cardBackground;
  }
};

const getPadding = (padding?: CardProps['padding']) => {
  switch (padding) {
    case 'small':
      return theme.spacing.sm;
    case 'large':
      return theme.spacing.xl;
    default:
      return theme.spacing.md;
  }
};

const StyledCard = styled.div<CardProps>`
  background-color: ${props => getBackgroundColor(props.variant)};
  color: ${props => props.variant === 'light' ? theme.colors.dark : theme.colors.white};
  padding: ${props => getPadding(props.padding)};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${props => props.variant === 'light' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};
`;

export const Card: React.FC<CardProps> = ({ children, ...props }) => {
  return <StyledCard {...props}>{children}</StyledCard>;
};