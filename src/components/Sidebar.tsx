import React from "react";
import { NavLink } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  count?: number;
}

const ANALYSIS: NavItem[] = [
  { to: "/dashboard", label: "대시보드", icon: "▣" },
  { to: "/reports", label: "접근성 제보", icon: "◎", count: 6 },
  { to: "/public-data", label: "공공데이터 비교", icon: "◇" },
  { to: "/analysis", label: "반복 문제", icon: "↗" },
  { to: "/help-requests", label: "도움 요청", icon: "!", count: 5 },
  { to: "/stories", label: "경험 피드", icon: "≡", count: 4 },
];

const OUTPUT: NavItem[] = [
  { to: "/demo-guide", label: "시연 가이드", icon: "?" },
  { to: "/workflow", label: "개선 워크플로우", icon: "→" },
  { to: "/monthly-report", label: "리포트", icon: "📄" },
];

const ACCOUNT: NavItem[] = [
  { to: "/settings", label: "설정", icon: "⚙" },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="lm"></div>
        <div className="name">
          ONDA<small>ADMIN</small>
        </div>
      </div>

      <div className="sb-section">분석</div>
      {ANALYSIS.map((item) => (
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
      {OUTPUT.map((item) => (
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
        <div className="av">박</div>
        <div>
          <div className="n">박주연</div>
          <div className="r">장애학생지원센터</div>
        </div>
      </div>
    </aside>
  );
};
