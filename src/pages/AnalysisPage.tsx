import React, { useContext, useEffect, useState } from "react";
import { Topbar } from "../components/Topbar";
import { getReports } from "../services/api";
import type { AccessibilityReport } from "../types";
import { UrgencyBadge } from "../components/StatusBadge";
import { ToastContext } from "../App";
import { useNavigate } from "react-router-dom";

const TYPES = ["엘리베이터", "단차·계단", "키오스크", "화장실", "경사로"];
const TYPE_TO_KEY: Record<string, string> = {
  엘리베이터: "엘리베이터",
  강의실: "단차·계단",
  키오스크: "키오스크",
  화장실: "화장실",
  경사로: "경사로",
};

export const AnalysisPage: React.FC = () => {
  const [reports, setReports] = useState<AccessibilityReport[]>([]);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  useEffect(() => {
    getReports().then(setReports);
  }, []);

  // 문제 유형별 합계 (mock 보강 값 포함)
  const baseTypeCounts: Record<string, number> = {
    엘리베이터: 42,
    "단차·계단": 31,
    키오스크: 25,
    화장실: 18,
    경사로: 12,
  };
  reports.forEach((r) => {
    const key = TYPE_TO_KEY[r.problemType] ?? null;
    if (key && baseTypeCounts[key] !== undefined) {
      // 값을 그대로 유지하되, 데이터를 반영하려면 누적 가능. 여기서는 baseline 유지.
    }
  });
  const max = Math.max(...Object.values(baseTypeCounts));

  // 건물별 합계
  const byBuilding: { name: string; count: number }[] = [
    { name: "중앙도서관", count: 32 },
    { name: "학생회관", count: 25 },
    { name: "공학관", count: 18 },
    { name: "체육관", count: 14 },
    { name: "정문 / 외부", count: 11 },
    { name: "인문관", count: 9 },
  ];
  const buildingMax = Math.max(...byBuilding.map((b) => b.count));

  const top5 = [...reports]
    .sort((a, b) => b.reportCount - a.reportCount)
    .slice(0, 5);

  return (
    <>
      <Topbar period="30d" />
      <main className="page">
        <div className="page-h">
          <div>
            <h1>반복 문제 분석</h1>
            <div className="sub">최근 30일 · 총 제보 128건 · 반복 패턴 24건</div>
          </div>
          <div className="row-flex">
            <button
              className="h-btn primary"
              onClick={() => {
                showToast("리포트에 분석 결과가 추가되었습니다.");
                setTimeout(() => navigate("/monthly-report"), 600);
              }}
            >
              리포트로 보내기
            </button>
          </div>
        </div>

        <div className="summary-banner">
          <span className="badge">이번 달 핵심</span>
          <div>
            <div className="t">
              반복 제보가 가장 많은 건물은 <u>중앙도서관</u>입니다.
            </div>
            <div className="s">
              엘리베이터·진입 관련 제보가 4주 연속 누적되고 있습니다. 단기 조치 + 중장기 점검이 필요합니다.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr",
            gap: 12,
          }}
        >
          <div className="panel">
            <div className="panel-h">
              <h3>문제 유형별 분포</h3>
            </div>
            <div className="bars">
              {TYPES.map((t) => {
                const v = baseTypeCounts[t];
                const pct = Math.round((v / max) * 100);
                return (
                  <div className="bar" key={t}>
                    <div className="v">{v}</div>
                    <div className="fill" style={{ height: `${pct}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="bars-x">
              {TYPES.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>건물별 제보 수</h3>
            </div>
            <div className="hbars">
              {byBuilding.map((b, i) => {
                const pct = Math.round((b.count / buildingMax) * 100);
                const cls = i === 0 ? "red" : i < 3 ? "amber" : "";
                return (
                  <div className={`hbar ${cls}`} key={b.name}>
                    <div className="n">{b.name}</div>
                    <div className="b">
                      <div style={{ width: `${pct}%` }} />
                    </div>
                    <div className="c">{b.count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ai-box">
            <div className="head">💡 AI 요약</div>
            <div className="body">
              중앙도서관과 학생회관에서 <b>이동 접근성</b> 관련 제보가
              반복되고 있습니다. 단기적으로 안내문과 대체 경로 제공이 필요하며,
              중장기적으로 시설 점검이 필요합니다.
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              개선 우선순위 제안
            </div>
            <div className="pri">
              <span className="b">1. 도서관 엘베 보조 버튼</span>
            </div>
            <div className="pri">
              <span className="b">2. 식당 키오스크 높이 개선</span>
            </div>
            <div className="pri">
              <span className="b">3. 공학관 강의실 대체 배정</span>
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 14 }}>
          <div className="panel-h">
            <h3>반복 제보 TOP 5 · 공감 기준 개선 필요도</h3>
            <span className="more">상세 ›</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>장소 · 문제</th>
                <th style={{ width: 70, textAlign: "right" }}>제보</th>
                <th style={{ width: 70, textAlign: "right" }}>공감</th>
                <th style={{ width: 70 }}>긴급도</th>
                <th>AI 추천 조치</th>
              </tr>
            </thead>
            <tbody>
              {top5.map((r, i) => (
                <tr key={r.id}>
                  <td>
                    <span className="rank-circle">{i + 1}</span>
                  </td>
                  <td>
                    <b>{r.buildingName}</b> · {r.problemType}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 800 }}>
                    {r.reportCount}
                  </td>
                  <td style={{ textAlign: "right" }}>{r.empathyCount}</td>
                  <td>
                    <UrgencyBadge urgency={r.urgency} />
                  </td>
                  <td className="small-muted">{r.aiSuggestion ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
};
