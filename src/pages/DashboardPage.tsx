import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import {
  getBuildings,
  getStats,
  getReports,
  getHelpRequests,
  getStoriesForAdmin,
  getModeLabel,
  isHttpMode,
} from "../services/api";
import {
  ReportStatusBadge,
  UrgencyBadge,
  HelpStatusBadge,
} from "../components/StatusBadge";
import { OperationalStatus } from "../components/OperationalStatus";
import { PageState } from "../components/PageState";
import type {
  AdminStats,
  AccessibilityReport,
  Building,
  HelpRequest,
  Story,
} from "../types";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [reports, setReports] = useState<AccessibilityReport[]>([]);
  const [help, setHelp] = useState<HelpRequest[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "semester">("7d");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    Promise.all([
      getStats(),
      getBuildings(),
      getReports(),
      getHelpRequests(),
      getStoriesForAdmin(),
    ]).then(([s, b, r, h, st]) => {
      setStats(s);
      setBuildings(b);
      setReports(r);
      setHelp(h);
      setStories(st);
    });
  }, [reloadKey]);

  const top5 = [...reports]
    .sort((a, b) => b.reportCount - a.reportCount)
    .slice(0, 5);

  const recentHelp = help.slice(0, 3);
  const topStories = [...stories]
    .sort((a, b) => b.empathyCount - a.empathyCount)
    .slice(0, 3);
  const todoItems = [
    {
      title: "미응답 도움 요청",
      count: help.filter((item) => item.status === "center_check").length,
      desc: "센터 확인 필요 상태",
      to: `/help-requests${help[0] ? `?selected=${help[0].id}` : ""}`,
      tone: "danger",
    },
    {
      title: "담당자 미배정 제보",
      count: reports.filter((item) => !item.assignee).length,
      desc: "담당자 배정 필요",
      to: "/reports",
      tone: "warning",
    },
    {
      title: "AI 익명화 검수 필요",
      count: stories.filter((item) => item.aiReview?.anonymized !== "완료").length,
      desc: "공개 전 검수 필요",
      to: "/stories",
      tone: "warning",
    },
    {
      title: "고위험 미해결 제보",
      count: reports.filter((item) => item.urgency === "high" && item.status !== "resolved").length,
      desc: "시설팀 전달 우선",
      to: `/reports${top5[0] ? `?selected=${top5[0].id}` : ""}`,
      tone: "danger",
    },
  ];

  return (
    <>
      <Topbar period={period} onPeriodChange={setPeriod} />
      <main className="page">
        <div className="page-h">
          <div>
            <h1>ONDA 관리자 대시보드</h1>
            <div className="sub">
              {periodLabel(period)} · {getModeLabel()} 기준 ·{" "}
              {isHttpMode() ? "일부 API 연결됨" : "API 연동 예정"}
            </div>
          </div>
        </div>

        <OperationalStatus
          title="대시보드 동기화 상태"
          onRetry={() => setReloadKey((key) => key + 1)}
        />

        {!stats ? (
          <PageState
            kind="loading"
            title="대시보드 샘플 데이터를 불러오는 중입니다"
            description="현재는 Mock service layer 기준입니다. 실제 API 실패/재시도 처리는 백엔드 붙여야 함."
          />
        ) : (
          <div className="kpis">
            <div className="kpi">
              <div className="l">📥 신규 제보</div>
              <div className="v">{stats.newReports}</div>
              <div className="delta">▲ 3 (지난주 대비)</div>
            </div>
            <div className="kpi">
              <div className="l">🤝 총 공감</div>
              <div className="v">{stats.totalEmpathy}</div>
              <div className="delta">▲ 22%</div>
            </div>
            <div className="kpi amber">
              <div className="l">✋ 도움 요청</div>
              <div className="v">{stats.helpRequests}</div>
              <div className="delta neu">동일</div>
            </div>
            <div className="kpi">
              <div className="l">⏱ 평균 응답</div>
              <div className="v">{stats.avgResponseTime}</div>
              <div className="delta">▼ 0:45 빨라짐</div>
            </div>
            <div className="kpi red">
              <div className="l">🔴 미해결 제보</div>
              <div className="v">{stats.unresolved}</div>
              <div className="delta down">▲ 1</div>
            </div>
          </div>
        )}

        <div className="dash-grid">
          <div className="panel">
            <div className="panel-h">
              <h3>캠퍼스 제보 밀도</h3>
              <span className="more">건물별 보기 ›</span>
            </div>
            <div className="mini-map">
              {buildings.map((b) => (
                <React.Fragment key={b.id}>
                  <div
                    className="pin-w"
                    style={{
                      left: `${b.position.x}%`,
                      top: `${b.position.y}%`,
                      background: pinColor(b.status),
                    }}
                  />
                  <div
                    className="label-w"
                    style={{ left: `${b.position.x}%`, top: `${b.position.y}%` }}
                  >
                    {b.name} · {b.reportCount}
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className="panel-h" style={{ marginTop: 18, marginBottom: 8 }}>
              <h3>반복 제보 TOP 5</h3>
              <span className="more">전체 보기 ›</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th>
                  <th>장소 · 문제</th>
                  <th style={{ width: 60, textAlign: "right" }}>제보</th>
                  <th style={{ width: 60, textAlign: "right" }}>공감</th>
                  <th style={{ width: 70 }}>긴급도</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((r, i) => (
                  <tr key={r.id}>
                    <td>
                      <span className="rank-circle">{i + 1}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{r.buildingName}</div>
                      <div className="small-muted">{r.content.slice(0, 28)}…</div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 800 }}>
                      {r.reportCount}
                    </td>
                    <td style={{ textAlign: "right" }}>{r.empathyCount}</td>
                    <td>
                      <UrgencyBadge urgency={r.urgency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="panel">
              <div className="panel-h">
                <h3>오늘 처리할 일</h3>
                <span className="more">Mock 운영 큐</span>
              </div>
              <div className="todo-list">
                {todoItems.map((item) => (
                  <button
                    className="todo-item"
                    key={item.title}
                    onClick={() => navigate(item.to)}
                  >
                    <span className={`todo-count ${item.tone}`}>{item.count}</span>
                    <span>
                      <b>{item.title}</b>
                      <em>{item.desc}</em>
                    </span>
                    <span className="todo-arrow">›</span>
                  </button>
                ))}
              </div>
              <div className="small-muted mt-10">
                실제 업무 배정/알림 저장은 백엔드 붙여야 함.
              </div>
            </div>

            <div className="ai-box">
              <div className="head">AI 우선 조치 추천</div>
              <div className="decision-card">
                <div>
                  <span className="field-l">1순위 개선 과제</span>
                  <b>중앙도서관 5층 승강기</b>
                </div>
                <div>
                  <span className="field-l">판단 근거</span>
                  <span>제보 32건 · 공감 140명 · 긴급도 높음</span>
                </div>
                <div>
                  <span className="field-l">공공데이터 차이</span>
                  <span>승강기 있음으로 기록되어 있으나 버튼 높이 문제 반복</span>
                </div>
                <div>
                  <span className="field-l">추천 조치</span>
                  <span>보조 버튼 설치, 현장 점검 요청, 시설관리팀 전달</span>
                </div>
                <div>
                  <span className="field-l">연동 상태</span>
                  <span className="backend-needed">백엔드 붙여야 함</span>
                </div>
              </div>
              <div className="row-flex" style={{ flexWrap: "wrap" }}>
                <button className="h-btn primary" onClick={() => navigate("/workflow")}>
                  개선 과제로 보기
                </button>
                <button className="h-btn" onClick={() => navigate("/public-data")}>
                  공공데이터와 비교
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-h">
                <h3>최근 도움 요청</h3>
                <span className="more">현황 ›</span>
              </div>
              {recentHelp.map((h) => (
                <div className="help-row" key={h.id}>
                  <HelpStatusBadge status={h.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t">{h.type}</div>
                    <div className="m">
                      {h.location} · {h.createdAt}
                    </div>
                  </div>
                  <div className="small-muted">
                    {h.status === "responded"
                      ? `${h.avgResponseTime ?? ""}`
                      : h.responderCount > 0
                      ? `응답 ${h.responderCount}명`
                      : h.memo ?? ""}
                  </div>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="panel-h">
                <h3>공감이 많이 쌓인 이야기</h3>
              </div>
              {topStories.map((s) => (
                <div className="topstory" key={s.id}>
                  <div className="em">
                    <div className="n">{s.empathyCount}</div>
                    <div className="l">공감</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="t">{s.title}</div>
                    <div className="meta">
                      {s.buildingName} · {s.category} ·{" "}
                      {s.reactions.must_change}명 "바뀌어야"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

function pinColor(status: string) {
  switch (status) {
    case "warning":
      return "#F59E0B";
    case "blocked":
      return "#DC2626";
    case "accessible":
      return "#16A34A";
    default:
      return "#94A3B8";
  }
}

function periodLabel(p: "today" | "7d" | "30d" | "semester") {
  switch (p) {
    case "today":
      return "오늘";
    case "7d":
      return "최근 7일";
    case "30d":
      return "최근 30일";
    case "semester":
      return "이번 학기";
  }
}
