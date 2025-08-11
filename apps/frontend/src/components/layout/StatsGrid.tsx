import React from "react";
import styled from "styled-components";
import StatCard from "./StatCard";

interface StatData {
  value: string | number;
  label: string;
  description?: string;
  colorValue?: string | null;
}

interface StatsGridProps {
  stats: StatData[];
  columns?: number;
}

const GridContainer = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$columns}, 1fr);
  gap: 20px;
  max-width: 100%;
`;

const StatsGrid: React.FC<StatsGridProps> = ({ stats, columns = 2 }) => {
  return (
    <GridContainer $columns={columns}>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          value={stat.value}
          label={stat.label}
          description={stat.description}
          colorValue={stat.colorValue || undefined}
        />
      ))}
    </GridContainer>
  );
};

export default StatsGrid;
