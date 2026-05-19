import React from "react";

type StateKind = "loading" | "empty" | "error" | "denied";

interface Props {
  kind: StateKind;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const PageState: React.FC<Props> = ({
  kind,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className={`page-state ${kind}`}>
      <div className="page-state-icon">{iconOf(kind)}</div>
      <div>
        <div className="page-state-title">{title}</div>
        <div className="page-state-desc">{description}</div>
        {actionLabel && onAction && (
          <button className="h-btn" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

function iconOf(kind: StateKind): string {
  return {
    loading: "…",
    empty: "0",
    error: "!",
    denied: "×",
  }[kind];
}
