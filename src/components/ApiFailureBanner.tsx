import React from "react";

interface Props {
  title?: string;
  message: string;
  code?: string;
  onRetry?: () => void;
}

export const ApiFailureBanner: React.FC<Props> = ({
  title = "API 응답 실패",
  message,
  code,
  onRetry,
}) => {
  return (
    <div className="api-failure-banner">
      <div>
        <b>{title}</b>
        <span>{message}</span>
        {code && <code>{code}</code>}
      </div>
      {onRetry && (
        <button className="h-btn danger" onClick={onRetry}>
          재시도
        </button>
      )}
    </div>
  );
};
