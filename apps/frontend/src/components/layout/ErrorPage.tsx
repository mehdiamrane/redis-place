import React from 'react';
import styled from 'styled-components';
import PageLayout from './PageLayout';

interface ErrorPageProps {
  error: string;
  onRetry?: () => void;
}

const ErrorContainer = styled.div`
  text-align: center;
`;

const RetryButton = styled.button`
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 15px;
  
  &:hover {
    background-color: #45a049;
  }
`;

const ErrorPage: React.FC<ErrorPageProps> = ({ error, onRetry }) => {
  return (
    <PageLayout>
      <ErrorContainer>
        <h1>Error: {error}</h1>
        {onRetry && (
          <RetryButton onClick={onRetry}>
            Retry
          </RetryButton>
        )}
      </ErrorContainer>
    </PageLayout>
  );
};

export default ErrorPage;