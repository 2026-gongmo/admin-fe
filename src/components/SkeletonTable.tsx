import React from "react";

interface Props {
  rows?: number;
  cols?: number;
}

export const SkeletonTable: React.FC<Props> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="skeleton-table" aria-label="데이터 로딩 중">
      {Array.from({ length: rows }).map((_, row) => (
        <div className="skeleton-row" key={row}>
          {Array.from({ length: cols }).map((__, col) => (
            <span className="skeleton-cell" key={`${row}-${col}`} />
          ))}
        </div>
      ))}
    </div>
  );
};
