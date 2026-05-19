import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { getHelpRequests, updateHelpRequestStatus } from "../services/api";
import type { HelpRequest, HelpRequestStatus } from "../types";
import { HelpStatusBadge } from "../components/StatusBadge";
import { ToastContext } from "../App";
import { ConfirmModal } from "../components/ConfirmModal";
import { OperationalStatus } from "../components/OperationalStatus";
import { PageState } from "../components/PageState";
import { SkeletonTable } from "../components/SkeletonTable";

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

type HelpSortKey = "createdAt" | "responderCount" | "location";
type SortDirection = "asc" | "desc";

const HELP_SORT_OPTIONS: { key: HelpSortKey; label: string }[] = [
  { key: "createdAt", label: "요청 시간" },
  { key: "responderCount", label: "응답자 수" },
  { key: "location", label: "위치" },
];

export const HelpRequestsPage: React.FC = () => {
  const { showToast } = useContext(ToastContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSelectedId = searchParams.get("selected");
  const [items, setItems] = useState<HelpRequest[]>([]);
  const [filter, setFilter] = useState<HelpRequestStatus | "all">(
    helpStatusFromParam(searchParams.get("status"))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [sortKey, setSortKey] = useState<HelpSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [detailOpen, setDetailOpen] = useState(true);
  const [detailPinned, setDetailPinned] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    confirmText: string;
    tone?: "default" | "danger";
    run: () => void;
  } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getHelpRequests({
      status: filter,
      query,
    }).then((requests) => {
      setItems(requests);
      const nextId = requests.some((item) => item.id === requestedSelectedId)
        ? requestedSelectedId
        : requests[0]?.id ?? null;
      setSelectedId(nextId);
      setIsLoading(false);
    });
  }, [filter, query, reloadKey, requestedSelectedId]);

  const filtered = useMemo(
    () => {
      const normalized = query.trim().toLowerCase();
      const rows = items.filter((item) => {
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
      return [...rows].sort((a, b) => {
        const left = helpSortValue(a, sortKey);
        const right = helpSortValue(b, sortKey);
        const result = left > right ? 1 : left < right ? -1 : 0;
        return sortDirection === "asc" ? result : -result;
      });
    },
    [filter, items, query, sortDirection, sortKey]
  );

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  const performStatusUpdate = async (status: HelpRequestStatus) => {
    if (!selected) return;
    const updated = await updateHelpRequestStatus(selected.id, status);
    if (updated) {
      setItems((cur) => cur.map((item) => (item.id === updated.id ? updated : item)));
      showToast(
        `도움 요청 상태가 "${helpStatusLabel(status)}"(으)로 변경되었습니다. Mock 상태입니다.`
      );
    }
  };

  const updateStatus = (status: HelpRequestStatus) => {
    if (!selected) return;
    if (status === "responded" || status === "cancelled") {
      setConfirmAction({
        title: `도움 요청을 "${helpStatusLabel(status)}" 상태로 바꿀까요?`,
        description:
          status === "cancelled"
            ? "취소 처리는 미응답/안전 이력과 연결될 수 있어 확인이 필요합니다."
            : "응답 완료 처리는 평균 응답 시간과 처리 로그에 반영될 작업입니다.",
        confirmText: helpStatusLabel(status),
        tone: status === "cancelled" ? "danger" : "default",
        run: () => void performStatusUpdate(status),
      });
      return;
    }
    void performStatusUpdate(status);
  };

  const updateQueryParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
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

        <OperationalStatus
          title="도움 요청 동기화 상태"
          onRetry={() => setReloadKey((key) => key + 1)}
        />

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
            onChange={(e) => {
              setQuery(e.target.value);
              updateQueryParam("q", e.target.value.trim() || null);
            }}
            placeholder="위치, 도움 유형, 메모, 센터 판단 검색"
          />
          <span className="small-muted">
            검색 결과 {filtered.length}건 · 실제 서버 검색은 백엔드 붙여야 함
          </span>
          <label className="filter select-filter">
            <span>정렬</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as HelpSortKey)}
            >
              {HELP_SORT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="h-btn"
            onClick={() =>
              setSortDirection((current) => (current === "desc" ? "asc" : "desc"))
            }
          >
            {sortDirection === "desc" ? "내림차순" : "오름차순"}
          </button>
        </div>

        <div className="row-flex" style={{ marginBottom: 12, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={"filter" + (filter === f.key ? " active" : "")}
              onClick={() => {
                setFilter(f.key);
                updateQueryParam("status", f.key);
              }}
              style={{ cursor: "pointer", border: 0 }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="split">
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? (
              <SkeletonTable rows={5} cols={6} />
            ) : (
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
                    onClick={() => {
                      setSelectedId(h.id);
                      setSearchParams({ selected: h.id });
                      setDetailOpen(true);
                    }}
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
            )}
            {!isLoading && filtered.length === 0 && (
              <PageState
                kind="empty"
                title="조건에 맞는 도움 요청이 없습니다"
                description="필터를 초기화하거나 다른 검색어를 입력해 주세요. 실제 서버 검색은 백엔드 붙여야 함."
                actionLabel="필터 초기화"
                onAction={() => {
                  setFilter("all");
                  setQuery("");
                  setSearchParams({}, { replace: true });
                }}
              />
            )}
          </div>

          {detailOpen ? (
          <div className={"detail" + (detailPinned ? " pinned" : "")}>
            {selected ? (
              <>
                <div className="detail-title-row">
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>
                      {selected.type}
                    </div>
                    <div className="small-muted">
                      {selected.location} · {selected.createdAt}
                    </div>
                  </div>
                  <div className="detail-actions">
                    <button
                      className="icon-mini-btn"
                      onClick={() => setDetailPinned((value) => !value)}
                      title={detailPinned ? "상세 패널 고정 해제" : "상세 패널 고정"}
                    >
                      {detailPinned ? "고정" : "해제"}
                    </button>
                    <button
                      className="icon-mini-btn"
                      onClick={() => setDetailOpen(false)}
                      title="상세 패널 닫기"
                    >
                      닫기
                    </button>
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
          ) : (
            <div className="detail-collapsed">
              <b>상세 패널이 닫혀 있습니다.</b>
              <span>도움 요청을 선택하면 다시 열립니다.</span>
              <button className="h-btn primary" onClick={() => setDetailOpen(true)}>
                상세 패널 열기
              </button>
            </div>
          )}
        </div>
      </main>
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        confirmText={confirmAction?.confirmText}
        tone={confirmAction?.tone}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          confirmAction?.run();
          setConfirmAction(null);
        }}
      />
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

function helpStatusFromParam(value: string | null): HelpRequestStatus | "all" {
  return ["requesting", "responded", "cancelled", "center_check"].includes(value ?? "")
    ? (value as HelpRequestStatus)
    : "all";
}

function helpSortValue(item: HelpRequest, key: HelpSortKey): string | number {
  if (key === "responderCount") return item.responderCount;
  if (key === "location") return item.location;
  return item.createdAt;
}
