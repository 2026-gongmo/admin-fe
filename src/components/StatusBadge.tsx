import React from "react";
import type { ReportStatus, HelpRequestStatus, Story, Urgency } from "../types";

export const ReportStatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const map: Record<ReportStatus, { cls: string; label: string }> = {
    received: { cls: "recv", label: "접수" },
    checking: { cls: "check", label: "확인 중" },
    scheduled: { cls: "plan", label: "조치 예정" },
    resolved: { cls: "done", label: "해결됨" },
  };
  const v = map[status];
  return <span className={`status ${v.cls}`}>{v.label}</span>;
};

export const HelpStatusBadge: React.FC<{ status: HelpRequestStatus }> = ({ status }) => {
  const map: Record<HelpRequestStatus, { cls: string; label: string }> = {
    requesting: { cls: "req", label: "요청 중" },
    responded: { cls: "done", label: "응답 완료" },
    cancelled: { cls: "cancel", label: "취소됨" },
    center_check: { cls: "center", label: "센터 확인 필요" },
  };
  const v = map[status];
  return <span className={`status ${v.cls}`}>{v.label}</span>;
};

export const UrgencyBadge: React.FC<{ urgency: Urgency }> = ({ urgency }) => {
  const map: Record<Urgency, string> = {
    high: "높음",
    mid: "중간",
    low: "낮음",
  };
  return <span className={`urg ${urgency}`}>{map[urgency]}</span>;
};

export const VisibilityBadge: React.FC<{
  visibility: NonNullable<Story["visibility"]>;
}> = ({ visibility }) => {
  if (visibility === "public") return <span className="status public">공개</span>;
  if (visibility === "private") return <span className="status private">비공개</span>;
  return <span className="status center">센터 전용</span>;
};
