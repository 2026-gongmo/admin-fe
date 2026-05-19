import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AdminUiContext, AuthContext, type AdminRolePreview } from "../App";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  count?: number;
  roles?: AdminRolePreview[];
}

const ANALYSIS: NavItem[] = [
  { to: "/dashboard", label: "대시보드", icon: "▣" },
  { to: "/reports", label: "접근성 제보", icon: "◎", count: 6 },
  { to: "/public-data", label: "공공데이터 비교", icon: "◇" },
  { to: "/analysis", label: "반복 문제", icon: "↗" },
  { to: "/help-requests", label: "도움 요청", icon: "!", count: 5 },
  { to: "/stories", label: "경험 피드", icon: "≡", count: 4, roles: ["center", "super"] },
];

const OUTPUT: NavItem[] = [
  { to: "/demo-guide", label: "시연 가이드", icon: "?" },
  { to: "/workflow", label: "개선 워크플로우", icon: "→" },
  { to: "/monthly-report", label: "리포트", icon: "📄", roles: ["center", "super"] },
];

const ACCOUNT: NavItem[] = [
  { to: "/settings", label: "설정", icon: "⚙" },
];

export const Sidebar: React.FC = () => {
  const { rolePreview, presentationMode } = useContext(AdminUiContext);
  const { admin } = useContext(AuthContext);
  const canSee = (item: NavItem) => !item.roles || item.roles.includes(rolePreview);
  const analysisItems = ANALYSIS.filter(canSee);
  const outputItems = OUTPUT.filter(canSee);

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="lm"></div>
        <div className="name">
          ONDA<small>ADMIN</small>
        </div>
      </div>

      <div className="role-preview-pill">
        {roleLabel(rolePreview)}
        {presentationMode && <span>발표 모드</span>}
      </div>

      <div className="sb-section">분석</div>
      {analysisItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => "sb-item" + (isActive ? " active" : "")}
        >
          <span style={{ width: 16, textAlign: "center", fontSize: 13 }}>
            {item.icon}
          </span>
          <span>{item.label}</span>
          {item.count !== undefined && <span className="count">{item.count}</span>}
        </NavLink>
      ))}

      <div className="sb-section">출력</div>
      {outputItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => "sb-item" + (isActive ? " active" : "")}
        >
          <span style={{ width: 16, textAlign: "center", fontSize: 13 }}>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}

      <div className="sb-section">계정</div>
      {ACCOUNT.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => "sb-item" + (isActive ? " active" : "")}
        >
          <span style={{ width: 16, textAlign: "center", fontSize: 13 }}>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}

      <div className="sb-foot">
        <div className="av">{(admin?.name ?? "박주연").slice(0, 1)}</div>
        <div>
          <div className="n">{admin?.name ?? "박주연"}</div>
          <div className="r">{roleLabel(rolePreview)}</div>
        </div>
      </div>
    </aside>
  );
};

function roleLabel(role: AdminRolePreview): string {
  return {
    center: "장애학생지원센터",
    facility: "시설관리팀 미리보기",
    super: "슈퍼관리자 미리보기",
  }[role];
}
