import React from 'react';
import styled from 'styled-components';
import NavigationHeader from '../NavigationHeader';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

const PageContainer = styled.div`
  padding: 20px;
  color: white;
  background-color: #1a1a1a;
  min-height: 100vh;
  font-family: Arial, sans-serif;
`;

const PageContent = styled.div`
  margin-top: 80px;
`;

const PageHeader = styled.div`
  margin-bottom: 20px;
`;

const PageTitle = styled.h1`
  margin: 0 0 10px 0;
  font-size: 2rem;
`;

const PageSubtitle = styled.div`
  font-size: 14px;
  color: #888;
  margin-bottom: 15px;
  line-height: 1.4;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
`;

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  headerActions 
}) => {
  return (
    <PageContainer>
      <NavigationHeader />
      <PageContent>
        {(title || subtitle || headerActions) && (
          <PageHeader>
            {title && <PageTitle>{title}</PageTitle>}
            {subtitle && <PageSubtitle>{subtitle}</PageSubtitle>}
            {headerActions && <HeaderActions>{headerActions}</HeaderActions>}
          </PageHeader>
        )}
        {children}
      </PageContent>
    </PageContainer>
  );
};

export default PageLayout;