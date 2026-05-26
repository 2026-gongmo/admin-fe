import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import {
  ApiError,
  getHelpRequests,
  isHttpMode,
  updateHelpRequestDecision,
  updateHelpRequestStatus,
} from "../services/api";
import type { HelpRequest, HelpRequestStatus } from "../types";
import { HelpStatusBadge } from "../components/StatusBadge";
import { ToastContext } from "../App";
import { ConfirmModal } from "../components/ConfirmModal";
import { OperationalStatus } from "../components/OperationalStatus";
import { PageState } from "../components/PageState";
import { SkeletonTable } from "../components/SkeletonTable";
import { ActionTimeline, type ActionTimelineItem } from "../components/ActionTimeline";
import { ApiFailureBanner } from "../components/ApiFailureBanner";

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
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sortKey, setSortKey] = useState<HelpSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [detailOpen, setDetailOpen] = useState(true);
  const [detailPinned, setDetailPinned] = useState(true);
  const [centerDecisionDraft, setCenterDecisionDraft] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    confirmText: string;
    tone?: "default" | "danger";
    run: () => void;
  } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setApiError(null);
    getHelpRequests({
      status: filter,
      query,
    })
      .then((requests) => {
        setItems(requests);
        const nextId = requests.some((item) => item.id === requestedSelectedId)
          ? requestedSelectedId
          : requests[0]?.id ?? null;
        setSelectedId(nextId);
      })
      .catch((error) => {
        setApiError(toApiError(error));
        setItems([]);
        setSelectedId(null);
      })
      .finally(() => setIsLoading(false));
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
  useEffect(() => {
    setCenterDecisionDraft(selected?.centerDecision ?? "");
  }, [selected?.id, selected?.centerDecision]);
  const selectedIndex = useMemo(
    () => filtered.findIndex((item) => item.id === selectedId),
    [filtered, selectedId]
  );

  const performStatusUpdate = async (status: HelpRequestStatus) => {
    if (!selected) return;
    try {
      const updated = await updateHelpRequestStatus(selected.id, status);
      if (updated) {
        setItems((cur) => cur.map((item) => (item.id === updated.id ? updated : item)));
        showToast(
          `도움 요청 상태가 "${helpStatusLabel(status)}"(으)로 변경되었습니다.${
            isHttpMode() ? " API에 반영되었습니다." : " Mock 상태입니다."
          }`
        );
      }
    } catch (error) {
      const apiError = toApiError(error);
      showToast(`저장 실패: ${apiError.message}`, "error");
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

  const saveCenterDecision = async () => {
    if (!selected) return;
    const content = centerDecisionDraft.trim();
    if (!content) {
      showToast("센터 판단 내용을 입력해 주세요.", "warning");
      return;
    }
    try {
      const updated = await updateHelpRequestDecision(selected.id, content);
      if (updated) {
        setItems((cur) => cur.map((item) => (item.id === updated.id ? updated : item)));
        showToast(isHttpMode() ? "센터 판단이 API에 저장되었습니다." : "센터 판단이 Mock 저장되었습니다.");
      }
    } catch (error) {
      const apiError = toApiError(error);
      showToast(`센터 판단 저장 실패: ${apiError.message}`, "error");
    }
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

  const selectHelpRequest = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("selected", id);
    setSelectedId(id);
    setSearchParams(next, { replace: true });
    setDetailOpen(true);
  };

  const moveSelection = (direction: -1 | 1) => {
    if (selectedIndex < 0 || filtered.length === 0) return;
    const nextIndex = Math.min(Math.max(selectedIndex + direction, 0), filtered.length - 1);
    selectHelpRequest(filtered[nextIndex].id);
  };

  const resetFilters = () => {
    setFilter("all");
    setQuery("");
    setSortKey("createdAt");
    setSortDirection("desc");
    setSearchParams({}, { replace: true });
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
        {apiError && (
          <ApiFailureBanner
            message={apiError.message}
            code={`${apiError.code}${apiError.status ? ` · HTTP ${apiError.status}` : ""}`}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        )}

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
            검색 결과 {filtered.length}건 · {isHttpMode() ? "서버 query parameter 적용" : "실제 서버 검색은 아직 구현 안 됨 · 추가 예정"}
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
          <button className="h-btn" onClick={resetFilters}>
            필터 초기화
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
            ) : apiError ? (
              <PageState
                kind="error"
                title="도움 요청 목록을 불러오지 못했습니다"
                description="실시간 요청 API 실패 시 관리자에게 재시도와 센터 확인 필요 상태를 분리해서 보여줘야 합니다. 현재는 Mock 실패 시뮬레이션입니다."
                actionLabel="다시 불러오기"
                onAction={() => setReloadKey((key) => key + 1)}
              />
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
                    onClick={() => selectHelpRequest(h.id)}
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
                description="필터를 초기화하거나 다른 검색어를 입력해 주세요. 실제 서버 검색은 아직 구현 안 됨 · 추가 예정."
                actionLabel="필터 초기화"
                onAction={() => {
                  resetFilters();
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
                      {selectedIndex >= 0 && ` · ${selectedIndex + 1} / ${filtered.length}`}
                    </div>
                  </div>
                  <div className="detail-actions">
                    <button
                      className="icon-mini-btn"
                      onClick={() => moveSelection(-1)}
                      disabled={selectedIndex <= 0}
                      aria-label="이전 도움 요청 보기"
                    >
                      이전
                    </button>
                    <button
                      className="icon-mini-btn"
                      onClick={() => moveSelection(1)}
                      disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1}
                      aria-label="다음 도움 요청 보기"
                    >
                      다음
                    </button>
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
                  <span className="backend-needed">실시간 알림은 아직 구현 안 됨 · 추가 예정</span>
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
                  <textarea
                    className="memo-input"
                    value={centerDecisionDraft}
                    onChange={(e) => setCenterDecisionDraft(e.target.value)}
                    placeholder="센터 직접 확인 내용, 학생 안내 내용, 시설팀 전달 판단을 기록하세요"
                  />
                  <div className="row-flex" style={{ justifyContent: "space-between", marginTop: 8 }}>
                    <span className={isHttpMode() ? "status done" : "backend-needed"}>
                      {isHttpMode() ? "센터 판단 API 저장" : "센터 판단 저장은 아직 구현 안 됨 · 추가 예정"}
                    </span>
                    <button className="h-btn primary" onClick={saveCenterDecision}>
                      센터 판단 저장
                    </button>
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
                  <ActionTimeline items={helpHistory(selected)} />
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

function helpHistory(item: HelpRequest): ActionTimelineItem[] {
  const base: ActionTimelineItem[] = [
    {
      time: item.createdAt,
      actor: "시스템",
      action: "도움 요청 접수",
      note: `${item.location}에서 "${item.type}" 요청이 생성되었습니다.`,
    },
  ];
  if (item.status === "requesting") {
    return [
      ...base,
      {
        time: "진행 중",
        actor: "근처 도움 가능 학생",
        action: "응답 대기",
        note: `${item.responderCount}명에게 알림을 보낸 상태입니다. 실시간 알림은 아직 구현 안 됨 · 추가 예정.`,
        tone: "warning",
      },
      {
        time: "센터",
        actor: "장애학생지원센터",
        action: "모니터링 유지",
        note: "미응답 시간이 길어지면 센터 확인 필요 상태로 전환합니다.",
      },
    ];
  }
  if (item.status === "responded") {
    return [
      ...base,
      {
        time: item.avgResponseTime ?? "응답 완료",
        actor: "응답 학생",
        action: "도움 응답 완료",
        note: "응답자 배정, 이동 완료 확인, 평균 응답 시간 저장은 아직 구현 안 됨 · 추가 예정.",
        tone: "success",
      },
    ];
  }
  if (item.status === "center_check") {
    return [
      ...base,
      {
        time: "확인 필요",
        actor: "장애학생지원센터",
        action: "센터 직접 확인으로 전환",
        note: item.centerDecision ?? "응답자 없음. 센터 직접 확인 필요.",
        tone: "danger",
      },
    ];
  }
  return [
    ...base,
    {
      time: "취소",
      actor: "요청자",
      action: "도움 요청 취소",
      note: "취소 사유와 안전 확인 저장은 아직 구현 안 됨 · 추가 예정.",
      tone: "warning",
    },
  ];
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError("UNKNOWN_ERROR", "알 수 없는 API 오류가 발생했습니다.");
}
