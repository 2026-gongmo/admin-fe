import React, { useContext } from "react";
import { ToastContext } from "../App";

type Period = "today" | "7d" | "30d" | "semester";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "7d", label: "7일" },
  { key: "30d", label: "30일" },
  { key: "semester", label: "이번 학기" },
];

interface Props {
  period?: Period;
  onPeriodChange?: (p: Period) => void;
  rightExtras?: React.ReactNode;
}

export const Topbar: React.FC<Props> = ({
  period = "7d",
  onPeriodChange,
  rightExtras,
}) => {
  const { showToast } = useContext(ToastContext);

  return (
    <div className="topbar">
      <div className="school">
        <span className="dot"></span>ONDA 대학교
      </div>
      <div className="mock-pill">Mock 데이터</div>

      <div className="segment" role="tablist">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className={"seg" + (period === p.key ? " on" : "")}
            onClick={() => onPeriodChange?.(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="filter">건물: 전체 ▾</div>
      <div className="filter">긴급도: 전체 ▾</div>

      <div className="spacer" />

      {rightExtras}

      <button
        className="export-btn"
        onClick={() => showToast("CSV 내보내기 동작입니다. 현재는 Mock 데이터 기준입니다.")}
      >
        ⇩ 내보내기
      </button>
    </div>
  );
};
