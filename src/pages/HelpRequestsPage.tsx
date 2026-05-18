import React, { useContext, useEffect, useMemo, useState } from "react";
import { Topbar } from "../components/Topbar";
import { getHelpRequests } from "../services/api";
import type { HelpRequest, HelpRequestStatus } from "../types";
import { HelpStatusBadge } from "../components/StatusBadge";
import { ToastContext } from "../App";

const FILTERS: { key: HelpRequestStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "requesting", label: "요청 중" },
  { key: "responded", label: "응답 완료" },
  { key: "center_check", label: "센터 확인 필요" },
  { key: "cancelled", label: "취소됨" },
];

const STATUS_ACTIONS: HelpRequestStatus[] = [
  "requesting",
  "center_check",
  "responded",
  "cancelled",
];

export const HelpRequestsPage: React.FC = () => {
  const { showToast } = useContext(ToastContext);
  const [items, setItems] = useState<HelpRequest[]>([]);
  const [filter, setFilter] = useState<HelpRequestStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getHelpRequests().then((requests) => {
      setItems(requests);
      setSelectedId(requests[0]?.id ?? null);
    });
  }, []);

  const filtered = useMemo(
    () => {
      const normalized = query.trim().toLowerCase();
      return items.filter((item) => {
        const statusMatched = filter === "all" || item.status === filter;
        const queryMatched =
          normalized.length === 0 ||
          [
            item.location,
            item.type,
            item.memo ?? "",
            item.centerDecision ?? "",
            item.linkedReport ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        return statusMatched && queryMatched;
      });
    },
    [items, filter, query]
  );

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  const updateStatus = (status: HelpRequestStatus) => {
    if (!selected) return;
    setItems((cur) =>
      cur.map((item) => (item.id === selected.id ? { ...item, status } : item))
    );
    showToast(
      `도움 요청 상태가 "${helpStatusLabel(status)}"(으)로 변경되었습니다. Mock 상태입니다.`
    );
  };

  const trend = [4, 6, 5, 8, 9, 7, 12];
  const trendMax = Math.max(...trend);

  return (
    <>
      <Topbar />
      <main className="page">
        <div className="page-h">
          <div>
            <h1>도움 요청</h1>
            <div className="sub">
              요청 {items.length}건 · 진행 중{" "}
              {items.filter((i) => i.status === "requesting").length}건 · 미응답{" "}
              {items.filter((i) => i.status === "center_check").length}건
            </div>
          </div>
        </div>

        <div className="help-kpi-grid">
          <div className="kpi">
            <div className="l">오늘 요청</div>
            <div className="v">{items.length}</div>
            <div className="delta">▲ 3 vs 어제</div>
          </div>
          <div className="kpi">
            <div className="l">평균 응답 시간</div>
            <div className="v">2:18</div>
            <div className="delta">▼ 0:30 빨라짐</div>
          </div>
          <div className="panel" style={{ padding: 14 }}>
            <div className="panel-h" style={{ marginBottom: 8 }}>
              <h3>오늘 도움 요청 추이</h3>
            </div>
            <div className="bars" style={{ height: 90, padding: "16px 0 0" }}>
              {trend.map((v, i) => (
                <div className="bar" key={i}>
                  <div
                    className="fill"
                    style={{ height: `${Math.round((v / trendMax) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="bars-x" style={{ paddingTop: 6 }}>
              {["08", "10", "12", "14", "16", "18", "20"].map((h) => (
                <span key={h}>{h}시</span>
              ))}
            </div>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="위치, 도움 유형, 메모, 센터 판단 검색"
          />
          <span className="small-muted">
            검색 결과 {filtered.length}건 · 실제 서버 검색은 백엔드 붙여야 함
          </span>
        </div>

        <div className="row-flex" style={{ marginBottom: 12, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={"filter" + (filter === f.key ? " active" : "")}
              onClick={() => setFilter(f.key)}
              style={{ cursor: "pointer", border: 0 }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="split">
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>요청 시간</th>
                  <th>위치</th>
                  <th>도움 유형</th>
                  <th style={{ width: 130 }}>상태</th>
                  <th style={{ width: 80, textAlign: "right" }}>응답자</th>
                  <th style={{ width: 100, textAlign: "right" }}>평균 응답</th>
                  <th>메모</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr
                    key={h.id}
                    className={h.id === selectedId ? "selected" : ""}
                    onClick={() => setSelectedId(h.id)}
                  >
                    <td className="small-muted">{h.createdAt}</td>
                    <td>
                      <b>{h.location}</b>
                    </td>
                    <td>{h.type}</td>
                    <td>
                      <HelpStatusBadge status={h.status} />
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {h.responderCount}
                    </td>
                    <td style={{ textAlign: "right" }} className="small-muted">
                      {h.avgResponseTime ?? "—"}
                    </td>
                    <td className="small-muted">{h.memo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">해당 상태의 도움 요청이 없습니다.</div>
            )}
          </div>

          <div className="detail">
            {selected ? (
              <>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>
                    {selected.type}
                  </div>
                  <div className="small-muted">
                    {selected.location} · {selected.createdAt}
                  </div>
                </div>

                <div className="row-flex" style={{ justifyContent: "space-between" }}>
                  <HelpStatusBadge status={selected.status} />
                  <span className="backend-needed">실시간 알림은 백엔드 붙여야 함</span>
                </div>

                <div className="public-link-card">
                  <div className="field-l">요청 상세</div>
                  <div className="public-link-row">
                    <span>응답자</span>
                    <b>{selected.responderCount}명</b>
                  </div>
                  <div className="public-link-row">
                    <span>평균 응답</span>
                    <b>{selected.avgResponseTime ?? "응답 대기"}</b>
                  </div>
                  <div className="public-link-row">
                    <span>메모</span>
                    <b>{selected.memo ?? "별도 메모 없음"}</b>
                  </div>
                </div>

                <div>
                  <div className="field-l">센터 판단</div>
                  <div className="field-v quote">
                    {selected.centerDecision ?? "센터 판단 기준은 백엔드 연결 후 저장됩니다."}
                  </div>
                </div>

                <div>
                  <div className="field-l">접근성 제보 연결</div>
                  <div className="field-v">{selected.linkedReport ?? "연결 후보 없음"}</div>
                </div>

                <div>
                  <div className="field-l">상태 변경</div>
                  <div className="stage-actions">
                    {STATUS_ACTIONS.map((status) => (
                      <button
                        key={status}
                        className={"h-btn" + (selected.status === status ? " primary" : "")}
                        onClick={() => updateStatus(status)}
                      >
                        {helpStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="field-l">관리자 처리 이력</div>
                  <div className="timeline">
                    {(selected.history ?? ["처리 이력은 백엔드 붙여야 함"]).map((item) => (
                      <div className="timeline-item" key={item}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="small-muted">도움 요청을 선택해 주세요.</div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

function helpStatusLabel(status: HelpRequestStatus): string {
  return {
    requesting: "요청 중",
    responded: "응답 완료",
    cancelled: "취소됨",
    center_check: "센터 확인 필요",
  }[status];
}
