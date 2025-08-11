import React from 'react';
import styled from 'styled-components';

interface ContentGridProps {
  children: React.ReactNode;
}

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const ContentGrid: React.FC<ContentGridProps> = ({ children }) => {
  return <GridContainer>{children}</GridContainer>;
};

export default ContentGrid;