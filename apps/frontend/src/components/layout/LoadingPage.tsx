import React from 'react';
import PageLayout from './PageLayout';

interface LoadingPageProps {
  message: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ message }) => {
  return (
    <PageLayout>
      <h1>{message}</h1>
    </PageLayout>
  );
};

export default LoadingPage;