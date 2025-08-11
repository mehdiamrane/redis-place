import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";

interface PageLoaderProps {
  message?: string;
}

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #1a1a1a;
  padding: 80px 20px 40px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const LoaderContainer = styled.div`
  background-color: #2a2a2a;
  padding: 30px;
  border-radius: 12px;
  width: 520px;
  max-width: 90vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #3a3a3a;
  border-top: 4px solid #888;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: ${theme.spacing.md};
`;

const LoadingText = styled.div`
  color: white;
  font-size: ${theme.fontSize.md};
  text-align: center;
`;

const PageLoader: React.FC<PageLoaderProps> = ({ message = "Loading..." }) => {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!showLoader) {
    return null;
  }

  return (
    <PageContainer>
      <LoaderContainer>
        <Spinner />
        <LoadingText>{message}</LoadingText>
      </LoaderContainer>
    </PageContainer>
  );
};

export default PageLoader;
