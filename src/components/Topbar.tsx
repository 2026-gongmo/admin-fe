import React, { useContext, useState } from "react";
import { AdminUiContext, AuthContext, ToastContext, type AdminRolePreview } from "../App";
import { getApiBaseUrl } from "../services/httpClient";
import { getModeLabel, isHttpMode } from "../services/api";

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
  const {
    rolePreview,
    setRolePreview,
    presentationMode,
    togglePresentationMode,
  } = useContext(AdminUiContext);
  const { admin, logout } = useContext(AuthContext);
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

  const changeRole = (role: AdminRolePreview) => {
    setRolePreview(role);
    showToast(
      isHttpMode()
        ? `${roleLabel(role)} 화면 미리보기입니다. 제한 API는 로그인 계정의 Spring Security 권한으로 검증됩니다.`
        : `${roleLabel(role)} 권한 미리보기입니다. HTTP 모드에서 백엔드 권한 정책과 연결됩니다.`,
      isHttpMode() ? "success" : "warning"
    );
  };

  const onLogout = async () => {
    await logout();
    showToast("관리자 세션을 종료했습니다.", "success");
  };

  return (
    <div className="topbar">
      <div className="school">
        <span className="dot"></span>{admin?.campusName ?? "베프 대학교"}
      </div>
      <div className={isHttpMode() ? "api-pill" : "mock-pill"} title={getApiBaseUrl()}>
        {getModeLabel()}
      </div>

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

      <label className="filter select-filter">
        <span>권한</span>
        <select
          value={rolePreview}
          onChange={(e) => changeRole(e.target.value as AdminRolePreview)}
          aria-label="관리자 권한 미리보기"
        >
          <option value="center">센터</option>
          <option value="facility">시설팀</option>
          <option value="super">슈퍼관리자</option>
        </select>
      </label>

      <div className="spacer" />

      {rightExtras}

      <div className="admin-session-pill">
        <b>{admin?.name ?? "박주연"}</b>
        <span>{admin?.email ?? "center@onda.test"}</span>
      </div>

      <button
        className="export-btn"
        aria-label="CSV 내보내기 Mock"
        onClick={() => showToast("CSV 내보내기 동작입니다. 현재는 Mock 데이터 기준입니다.")}
      >
        ⇩ 내보내기
      </button>
      <button
        className={"h-btn" + (presentationMode ? " primary" : "")}
        onClick={() => {
          togglePresentationMode();
          showToast(
            presentationMode ? "발표 모드를 종료했습니다." : "발표 모드입니다. 시연 화면을 더 넓게 정리합니다.",
            "success"
          );
        }}
      >
        발표 모드
      </button>
      <button className="h-btn" onClick={onLogout}>
        로그아웃
      </button>
    </div>
  );
};

function roleLabel(role: AdminRolePreview): string {
  return {
    center: "장애학생지원센터",
    facility: "시설관리팀",
    super: "슈퍼관리자",
  }[role];
}
