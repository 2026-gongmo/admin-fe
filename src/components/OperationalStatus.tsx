import React from "react";

interface Props {
  title?: string;
  lastSync?: string;
  mode?: "Mock" | "API 준비";
  onRetry?: () => void;
}

export const OperationalStatus: React.FC<Props> = ({
  title = "운영 상태",
  lastSync = "2026.05.19 00:00",
  mode = "Mock",
  onRetry,
}) => {
  return (
    <div className="ops-status-bar">
      <div>
        <b>{title}</b>
        <span>
          현재 {mode} 데이터 기준 · 마지막 동기화 {lastSync} · 실제 저장/동기화는 백엔드 붙여야 함
        </span>
      </div>
      {onRetry && (
        <button className="h-btn" onClick={onRetry}>
          Mock 재시도
        </button>
      )}
    </div>
  );
};
