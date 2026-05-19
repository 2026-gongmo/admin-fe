import React, { useContext, useState } from "react";
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
  buildingFilter?: string;
  urgencyFilter?: string;
  onBuildingFilterChange?: (value: string) => void;
  onUrgencyFilterChange?: (value: string) => void;
}

export const Topbar: React.FC<Props> = ({
  period = "7d",
  onPeriodChange,
  rightExtras,
  buildingFilter,
  urgencyFilter,
  onBuildingFilterChange,
  onUrgencyFilterChange,
}) => {
  const { showToast } = useContext(ToastContext);
  const [localBuilding, setLocalBuilding] = useState("전체");
  const [localUrgency, setLocalUrgency] = useState("전체");

  const selectedBuilding = buildingFilter ?? localBuilding;
  const selectedUrgency = urgencyFilter ?? localUrgency;

  const changeBuilding = (value: string) => {
    if (onBuildingFilterChange) {
      onBuildingFilterChange(value);
    } else {
      setLocalBuilding(value);
      showToast(`건물 필터가 "${value}"(으)로 변경되었습니다. 현재는 Mock 필터입니다.`);
    }
  };

  const changeUrgency = (value: string) => {
    if (onUrgencyFilterChange) {
      onUrgencyFilterChange(value);
    } else {
      setLocalUrgency(value);
      showToast(`긴급도 필터가 "${value}"(으)로 변경되었습니다. 현재는 Mock 필터입니다.`);
    }
  };

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

      <label className="filter select-filter">
        <span>건물</span>
        <select value={selectedBuilding} onChange={(e) => changeBuilding(e.target.value)}>
          {["전체", "중앙도서관", "학생회관", "공학관", "인문관", "체육관"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="filter select-filter">
        <span>긴급도</span>
        <select value={selectedUrgency} onChange={(e) => changeUrgency(e.target.value)}>
          {["전체", "높음", "중간", "낮음"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

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
