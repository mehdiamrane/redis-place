import styled from 'styled-components';
import { theme } from '../../styles/theme';

export interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

const SidebarContainer = styled.div`
  position: absolute;
  top: ${theme.spacing.md};
  left: ${theme.spacing.md};
  bottom: ${theme.spacing.md};
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  z-index: ${theme.zIndex.nav};
  pointer-events: none;
  
  > * {
    pointer-events: auto;
    flex-shrink: 0;
  }
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  flex: 1;
  pointer-events: none;
  
  > * {
    pointer-events: auto;
  }
`;

const SidebarBottom = styled.div`
  margin-top: auto;
  pointer-events: none;
  
  > * {
    pointer-events: auto;
  }
`;

export const Sidebar: React.FC<SidebarProps> = ({ children, className }) => {
  return (
    <SidebarContainer className={className}>
      {children}
    </SidebarContainer>
  );
};

export const SidebarMain: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <SidebarContent>{children}</SidebarContent>;
};

export const SidebarFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <SidebarBottom>{children}</SidebarBottom>;
};