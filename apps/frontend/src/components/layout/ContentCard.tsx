import React from 'react';
import styled from 'styled-components';

interface ContentCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

const CardContainer = styled.div`
  background-color: #2a2a2a;
  padding: 20px;
  border-radius: 10px;
`;

const CardTitle = styled.h2`
  margin: 0 0 15px 0;
  font-size: 1.2rem;
`;

const CardSubtitle = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 15px;
  line-height: 1.4;
`;

const CardContent = styled.div<{ maxHeight?: string }>`
  ${props => props.maxHeight && `
    max-height: ${props.maxHeight};
    overflow-y: auto;
  `}
`;

const ContentCard: React.FC<ContentCardProps> = ({ 
  title, 
  subtitle, 
  children, 
  maxHeight 
}) => {
  return (
    <CardContainer>
      <CardTitle>{title}</CardTitle>
      {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
      <CardContent maxHeight={maxHeight}>{children}</CardContent>
    </CardContainer>
  );
};

export default ContentCard;