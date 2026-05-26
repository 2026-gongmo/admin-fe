import React from "react";
import { getModeLabel, isHttpMode } from "../services/api";

interface Props {
  title?: string;
  lastSync?: string;
  mode?: "Mock" | "API 준비" | "Spring Boot API";
  onRetry?: () => void;
}

export const OperationalStatus: React.FC<Props> = ({
  title = "운영 상태",
  lastSync = "2026.05.19 00:00",
  mode,
  onRetry,
}) => {
  const modeLabel = mode ?? getModeLabel();
  return (
    <div className="ops-status-bar">
      <div>
        <b>{title}</b>
        <span>
          현재 {modeLabel} 기준 · 마지막 동기화 {lastSync} ·{" "}
          {isHttpMode()
            ? "주요 목록/상태 변경은 실제 API 호출, PDF·파일·실시간 알림은 추가 예정"
            : "실제 저장/동기화는 아직 구현 안 됨 · 추가 예정"}
        </span>
      </div>
      {onRetry && (
        <button className="h-btn" onClick={onRetry}>
          다시 불러오기
        </button>
      )}
    </div>
  );
};
