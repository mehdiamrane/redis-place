import React from "react";
import styled from "styled-components";

interface StatCardProps {
  value: string | number;
  label: string;
  description?: string;
  colorValue?: string;
}

const CardContainer = styled.div`
  background-color: #3a3a3a;
  padding: 8px;
  border-radius: 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60px;
  aspect-ratio: 1;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const StatValue = styled.div`
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 4px;
  color: white;
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 10px;
  color: #888;
  font-weight: 500;
  margin-bottom: 2px;
  text-align: center;
  line-height: 1.3;
`;

const StatDescription = styled.div`
  color: #666;
  font-size: 12px;
  text-align: center;
  line-height: 1.2;
`;

const ColorSquare = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  background-color: ${(props) => props.color};
  border-radius: 6px;
  border: 2px solid #666;
  margin: 0 auto 4px auto;
  flex-shrink: 0;
`;

const StatCard: React.FC<StatCardProps> = ({ value, label, description, colorValue }) => {
  return (
    <CardContainer>
      {colorValue ? (
        <ColorSquare color={colorValue} />
      ) : (
        <StatValue>{typeof value === "number" ? value.toLocaleString() : value}</StatValue>
      )}
      <StatLabel>{label}</StatLabel>
      {description && <StatDescription>{description}</StatDescription>}
    </CardContainer>
  );
};

export default StatCard;
