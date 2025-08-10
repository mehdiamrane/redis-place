import React from "react";
import styled from "styled-components";
import { theme } from "../styles/theme";

interface ReplayControlsContainerProps {
  children: React.ReactNode;
}

const Container = styled.div`
  position: fixed;
  bottom: ${theme.spacing.md};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${theme.zIndex.nav};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

const ReplayControlsContainer: React.FC<ReplayControlsContainerProps> = ({ children }) => {
  return <Container>{children}</Container>;
};

export default ReplayControlsContainer;