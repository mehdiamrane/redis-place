import styled from 'styled-components';
import { theme } from '../../styles/theme';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'info' | 'success' | 'purple' | 'orange' | 'gray';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  className?: string;
}

const getButtonColors = (variant: ButtonProps['variant']) => {
  switch (variant) {
    case 'primary':
      return { bg: theme.colors.primary, hover: theme.colors.primaryHover };
    case 'secondary':
      return { bg: theme.colors.secondary, hover: theme.colors.secondaryHover };
    case 'danger':
      return { bg: theme.colors.danger, hover: theme.colors.dangerHover };
    case 'warning':
      return { bg: theme.colors.warning, hover: theme.colors.warningHover };
    case 'info':
      return { bg: theme.colors.info, hover: theme.colors.infoHover };
    case 'success':
      return { bg: theme.colors.success, hover: theme.colors.successHover };
    case 'purple':
      return { bg: theme.colors.purple, hover: theme.colors.purpleHover };
    case 'orange':
      return { bg: theme.colors.orange, hover: theme.colors.orangeHover };
    case 'gray':
      return { bg: theme.colors.lightestGray, hover: theme.colors.lighterGray, color: theme.colors.dark };
    default:
      return { bg: theme.colors.primary, hover: theme.colors.primaryHover };
  }
};

const getSizePadding = (size: ButtonProps['size']) => {
  switch (size) {
    case 'small':
      return '6px 12px';
    case 'large':
      return '12px 24px';
    default:
      return '8px 16px';
  }
};

const StyledButton = styled.button<ButtonProps>`
  padding: ${props => getSizePadding(props.size)};
  background-color: ${props => getButtonColors(props.variant).bg};
  color: ${props => getButtonColors(props.variant).color || theme.colors.white};
  border: ${props => props.variant === 'gray' ? `2px solid ${theme.colors.gray}` : 'none'};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${props => props.size === 'small' ? theme.fontSize.sm : theme.fontSize.base};
  font-weight: bold;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color ${theme.transitions.normal};
  opacity: ${props => props.disabled ? 0.6 : 1};
  
  &:hover:not(:disabled) {
    background-color: ${props => getButtonColors(props.variant).hover};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${props => getButtonColors(props.variant).bg}40;
  }
`;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};