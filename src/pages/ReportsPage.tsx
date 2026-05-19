import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import {
  getPublicDataComparisons,
  getReports,
  updateReportStatus,
} from "../services/api";
import type {
  AccessibilityReport,
  PublicDataComparison,
  PublicDataCoverage,
  Urgency,
  ReportStatus,
} from "../types";
import {
  ReportStatusBadge,
  UrgencyBadge,
} from "../components/StatusBadge";
import { ToastContext } from "../App";
import { ConfirmModal } from "../components/ConfirmModal";
import { OperationalStatus } from "../components/OperationalStatus";
import { PageState } from "../components/PageState";
import { SkeletonTable } from "../components/SkeletonTable";

const STATUSES: { key: ReportStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "received", label: "접수" },
  { key: "checking", label: "확인 중" },
  { key: "scheduled", label: "조치 예정" },
  { key: "resolved", label: "해결됨" },
];

const ASSIGNEES = ["박주연", "김도현", "이수민", "미배정"];
const URGENCIES: { key: Urgency; label: string }[] = [
  { key: "high", label: "높음" },
  { key: "mid", label: "중간" },
  { key: "low", label: "낮음" },
];

type SortKey = "createdAt" | "reportCount" | "empathyCount" | "urgency";
type SortDirection = "asc" | "desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "createdAt", label: "등록일" },
  { key: "reportCount", label: "제보 수" },
  { key: "empathyCount", label: "공감 수" },
  { key: "urgency", label: "긴급도" },
];

const URGENCY_WEIGHT: Record<Urgency, number> = {
  high: 3,
  mid: 2,
  low: 1,
};

const PROCESS_REASONS = [
  "현장 확인 완료",
  "시설팀 전달 완료",
  "예산 검토 필요",
  "학생 안내 완료",
  "중복 제보 병합",
];

const DEPARTMENTS = [
  "장애학생지원센터",
  "시설관리팀",
  "교무처",
  "학생처",
];

const RESOLUTION_CHECKS = [
  "현장 확인",
  "당사자 안내",
  "사진/자료 첨부",
  "재발 방지 조치",
  "리포트 반영",
];

const ATTACHMENTS = [
  { name: "제보 사진", file: "report-photo.jpg", status: "Mock 파일" },
  { name: "시설팀 답변서", file: "facility-reply.pdf", status: "백엔드 붙여야 함" },
  { name: "개선 요청 공문", file: "request-draft.docx", status: "백엔드 붙여야 함" },
  { name: "현장 확인 사진", file: "field-check.jpg", status: "Mock 파일" },
];

const COVERAGE_LABEL: Record<PublicDataCoverage, string> = {
  matched: "일치",
  missing: "공공데이터 누락",
  outdated: "현장과 불일치",
  field_only: "현장 제보만 존재",
};

const COVERAGE_CLASS: Record<PublicDataCoverage, string> = {
  matched: "done",
  missing: "check",
  outdated: "center",
  field_only: "recv",
};

export const ReportsPage: React.FC = () => {
  const { showToast } = useContext(ToastContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSelectedId = searchParams.get("selected");
  const [reports, setReports] = useState<AccessibilityReport[]>([]);
  const [comparisons, setComparisons] = useState<PublicDataComparison[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "all">(
    statusFromParam(searchParams.get("status"))
  );
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("reportCount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [detailOpen, setDetailOpen] = useState(true);
  const [detailPinned, setDetailPinned] = useState(true);
  const [processMemo, setProcessMemo] = useState("");
  const [processReason, setProcessReason] = useState(PROCESS_REASONS[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [resolutionChecks, setResolutionChecks] = useState<Record<string, boolean>>({
    "현장 확인": true,
    "당사자 안내": false,
    "사진/자료 첨부": false,
    "재발 방지 조치": false,
    "리포트 반영": true,
  });
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    confirmText: string;
    tone?: "default" | "danger";
    run: () => void;
  } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getReports({
      status: filterStatus,
      query,
    }).then((r) => {
      setReports(r);
      const nextId = r.some((item) => item.id === requestedSelectedId)
        ? requestedSelectedId
        : r[0]?.id ?? null;
      setSelectedId(nextId);
      setIsLoading(false);
    });
    getPublicDataComparisons().then(setComparisons);
  }, [filterStatus, query, reloadKey, requestedSelectedId]);

  const selected = useMemo(
    () => reports.find((r) => r.id === selectedId) ?? null,
    [reports, selectedId]
  );

  const filtered = useMemo(
    () => {
      const normalized = query.trim().toLowerCase();
      const rows = reports.filter((r) => {
        const statusMatched = filterStatus === "all" || r.status === filterStatus;
        const queryMatched =
          normalized.length === 0 ||
          [r.buildingName, r.problemType, r.content, r.assignee ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        return statusMatched && queryMatched;
      });
      return [...rows].sort((a, b) => {
        const left = sortValue(a, sortKey);
        const right = sortValue(b, sortKey);
        const result = left > right ? 1 : left < right ? -1 : 0;
        return sortDirection === "asc" ? result : -result;
      });
    },
    [filterStatus, query, reports, sortDirection, sortKey]
  );

  const selectedComparison = useMemo(
    () =>
      selected
        ? comparisons.find((item) => item.buildingName === selected.buildingName) ??
          null
        : null,
    [comparisons, selected]
  );
  const similarReports = useMemo(() => {
    if (!selected) return [];
    const strict = reports.filter(
      (report) =>
        report.id !== selected.id &&
        (report.buildingName === selected.buildingName ||
          report.problemType === selected.problemType)
    );
    return (strict.length > 0 ? strict : reports.filter((report) => report.id !== selected.id))
      .slice(0, 3);
  }, [reports, selected]);

  const performStatusChange = async (status: ReportStatus) => {
    if (!selected) return;
    const updated = await updateReportStatus(selected.id, status);
    if (updated) {
      setReports((cur) => cur.map((r) => (r.id === updated.id ? updated : r)));
      showToast(`상태가 "${labelOf(status)}"(으)로 변경되었습니다.`);
    }
  };

  const onStatusChange = (status: ReportStatus) => {
    if (!selected) return;
    if (status === "scheduled" || status === "resolved") {
      setConfirmAction({
        title: `"${labelOf(status)}" 상태로 변경할까요?`,
        description:
          status === "resolved"
            ? "해결됨 처리는 리포트와 감사 로그에 남아야 하는 작업입니다."
            : "조치 예정 처리는 시설팀 전달 흐름과 연결되는 작업입니다.",
        confirmText: `${labelOf(status)} 처리`,
        tone: status === "resolved" ? "danger" : "default",
        run: () => void performStatusChange(status),
      });
      return;
    }
    void performStatusChange(status);
  };

  const onAssigneeChange = (assignee: string) => {
    if (!selected) return;
    const value = assignee === "미배정" ? undefined : assignee;
    setReports((cur) =>
      cur.map((r) => (r.id === selected.id ? { ...r, assignee: value } : r))
    );
    showToast(`담당자가 "${assignee}"(으)로 변경되었습니다. 실제 저장은 백엔드 붙여야 함.`);
  };

  const onUrgencyChange = (urgency: Urgency) => {
    if (!selected) return;
    setReports((cur) =>
      cur.map((r) => (r.id === selected.id ? { ...r, urgency } : r))
    );
    showToast(`우선순위가 "${urgencyLabel(urgency)}"(으)로 변경되었습니다. 실제 저장은 백엔드 붙여야 함.`);
  };

  const toggleResolutionCheck = (item: string) => {
    setResolutionChecks((cur) => ({ ...cur, [item]: !cur[item] }));
  };

  const saveProcessMemo = () => {
    showToast("처리 메모 저장은 Mock 동작입니다. 실제 저장은 백엔드 붙여야 함.");
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

  return (
    <>
      <Topbar />
      <main className="page">
        <div className="page-h">
          <div>
            <h1>접근성 제보 관리</h1>
            <div className="sub">
              총 {reports.length}건 · 미해결{" "}
              {reports.filter((r) => r.status !== "resolved").length}건
            </div>
          </div>
          <div className="row-flex">
            <button
              className="h-btn"
              onClick={() => showToast("일괄 상태 변경 다이얼로그 (Mock)")}
            >
              일괄 상태 변경
            </button>
            <button
              className="h-btn primary"
              onClick={() => showToast("신규 제보 발행 폼 (Mock)")}
            >
              + 신규 제보 발행
            </button>
          </div>
        </div>

        <OperationalStatus
          title="제보 목록 동기화 상태"
          onRetry={() => setReloadKey((key) => key + 1)}
        />

        <div className="toolbar">
          <input
            className="search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateQueryParam("q", e.target.value.trim() || null);
            }}
            placeholder="건물명, 문제유형, 제보 내용, 담당자 검색"
          />
          <span className="small-muted">
            검색 결과 {filtered.length}건 · 실제 서버 검색은 백엔드 붙여야 함
          </span>
          <label className="filter select-filter">
            <span>정렬</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((option) => (
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

        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {STATUSES.map((s) => (
            <button
              key={s.key}
              className={"filter" + (filterStatus === s.key ? " active" : "")}
              onClick={() => {
                setFilterStatus(s.key);
                updateQueryParam("status", s.key);
              }}
              style={{ cursor: "pointer", border: 0 }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="split">
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? (
              <SkeletonTable rows={6} cols={8} />
            ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>장소</th>
                  <th>문제</th>
                  <th>내용</th>
                  <th style={{ width: 60, textAlign: "right" }}>제보</th>
                  <th style={{ width: 60, textAlign: "right" }}>공감</th>
                  <th style={{ width: 60 }}>긴급</th>
                  <th style={{ width: 70 }}>담당</th>
                  <th style={{ width: 90 }}>등록일</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={r.id === selectedId ? "selected" : ""}
                    onClick={() => {
                      setSelectedId(r.id);
                      setSearchParams({ selected: r.id });
                      setDetailOpen(true);
                    }}
                  >
                    <td>
                      <ReportStatusBadge status={r.status} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{r.buildingName}</div>
                    </td>
                    <td>{r.problemType}</td>
                    <td
                      style={{
                        maxWidth: 260,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.content}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 800 }}>
                      {r.reportCount}
                    </td>
                    <td style={{ textAlign: "right" }}>{r.empathyCount}</td>
                    <td>
                      <UrgencyBadge urgency={r.urgency} />
                    </td>
                    <td className="small-muted">{r.assignee ?? "—"}</td>
                    <td className="small-muted">{r.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
            {!isLoading && filtered.length === 0 && (
              <PageState
                kind="empty"
                title="검색 조건에 맞는 제보가 없습니다"
                description="필터를 초기화하거나 다른 검색어를 입력해 주세요. 서버 검색은 백엔드 붙여야 함."
                actionLabel="필터 초기화"
                onAction={() => {
                  setFilterStatus("all");
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>
                      {selected.buildingName} · {selected.problemType}
                    </div>
                    <div className="small-muted">
                      제보 #{selected.id.toUpperCase()} · {selected.createdAt}
                    </div>
                  </div>
                  <div className="detail-actions">
                    <ReportStatusBadge status={selected.status} />
                    <button
                      className="icon-mini-btn"
                      onClick={() => setDetailPinned((value) => !value)}
                      title={detailPinned ? "상세 패널 고정 해제" : "상세 패널 고정"}
                      aria-label={detailPinned ? "상세 패널 고정 해제" : "상세 패널 고정"}
                    >
                      {detailPinned ? "고정" : "해제"}
                    </button>
                    <button
                      className="icon-mini-btn"
                      onClick={() => setDetailOpen(false)}
                      title="상세 패널 닫기"
                      aria-label="상세 패널 닫기"
                    >
                      닫기
                    </button>
                  </div>
                </div>

                <div className="imgs">
                  <div className="img-slot">photo.jpg</div>
                  <div className="img-slot">photo.jpg</div>
                </div>

                <div>
                  <div className="field-l">제보 원문</div>
                  <div className="field-v quote">{selected.content}</div>
                </div>

                <div>
                  <div className="field-l">관련 데이터</div>
                  <div className="field-v">
                    제보 {selected.reportCount}건 · 공감 {selected.empathyCount}명
                    {selected.assignee && ` · 담당 ${selected.assignee}`}
                  </div>
                </div>

                <div className="ops-grid">
                  <div>
                    <div className="field-l">담당자 배정</div>
                    <div className="seg-control">
                      {ASSIGNEES.map((assignee) => (
                        <button
                          key={assignee}
                          className={
                            (selected.assignee ?? "미배정") === assignee ? "on" : ""
                          }
                          onClick={() => onAssigneeChange(assignee)}
                        >
                          {assignee}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="field-l">우선순위</div>
                    <div className="seg-control">
                      {URGENCIES.map((urgency) => (
                        <button
                          key={urgency.key}
                          className={selected.urgency === urgency.key ? "on" : ""}
                          onClick={() => onUrgencyChange(urgency.key)}
                        >
                          {urgency.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="backend-needed">배정/우선순위 저장은 백엔드 붙여야 함</span>
                </div>

                <div className="public-link-card">
                  <div className="field-l">공공데이터 연결</div>
                  {selectedComparison ? (
                    <>
                      <div className="public-link-row">
                        <span>공공데이터 기준</span>
                        <b>{selectedComparison.publicRecord}</b>
                      </div>
                      <div className="public-link-row">
                        <span>ONDA 현장 제보</span>
                        <b>{selectedComparison.fieldReport}</b>
                      </div>
                      <div className="public-link-row">
                        <span>판정</span>
                        <span className={`status ${COVERAGE_CLASS[selectedComparison.coverage]}`}>
                          {COVERAGE_LABEL[selectedComparison.coverage]}
                        </span>
                      </div>
                      <div className="small-muted">{selectedComparison.action}</div>
                    </>
                  ) : (
                    <div className="small-muted">
                      연결된 공공데이터 비교 항목이 없습니다. 백엔드 붙여야 함.
                    </div>
                  )}
                </div>

                {selected.aiSuggestion && (
                  <div className="ai-suggest">
                    <div className="l">💡 AI 추천 조치</div>
                    <div className="v">{selected.aiSuggestion}</div>
                  </div>
                )}

                <div className="ops-grid">
                  <div className="field-l">중복/유사 제보 후보</div>
                  {similarReports.map((item) => (
                    <div className="similar-card" key={item.id}>
                      <div>
                        <b>{item.buildingName} · {item.problemType}</b>
                        <span>{item.reportCount}건 · 공감 {item.empathyCount}명</span>
                      </div>
                      <div className="row-flex">
                        <button
                          className="h-btn"
                          onClick={() =>
                            showToast("중복 제보 병합은 Mock 동작입니다. 실제 병합 저장은 백엔드 붙여야 함.")
                          }
                        >
                          병합
                        </button>
                        <button
                          className="h-btn"
                          onClick={() =>
                            showToast("대표 제보 지정은 Mock 동작입니다. 실제 저장은 백엔드 붙여야 함.")
                          }
                        >
                          대표 지정
                        </button>
                      </div>
                    </div>
                  ))}
                  <span className="backend-needed">중복 판정/병합 저장은 백엔드 붙여야 함</span>
                </div>

                <div className="draft-card">
                  <div className="field-l">개선 요청서 초안</div>
                  <div className="draft-title">
                    {selected.buildingName} {selected.problemType} 개선 요청
                  </div>
                  <div className="draft-body">
                    <b>근거</b>
                    <span>
                      최근 30일간 관련 제보 {selected.reportCount}건, 공감{" "}
                      {selected.empathyCount}명 누적
                    </span>
                  </div>
                  <div className="draft-body">
                    <b>요청 조치</b>
                    <span>{draftAction(selected)}</span>
                  </div>
                  <div className="row-flex" style={{ justifyContent: "space-between" }}>
                    <span className="backend-needed">문서 저장/전송은 백엔드 붙여야 함</span>
                    <button
                      className="h-btn"
                      onClick={() =>
                        showToast("개선 요청서 초안 생성 동작입니다. 현재는 Mock 상태입니다.")
                      }
                    >
                      초안 생성
                    </button>
                  </div>
                </div>

                <div className="ops-grid">
                  <div className="field-l">운영 처리 입력</div>
                  <textarea
                    className="memo-input"
                    value={processMemo}
                    onChange={(e) => setProcessMemo(e.target.value)}
                    placeholder="시설팀 전달 내용, 현장 확인 결과, 학생 안내 내용을 기록하세요"
                  />

                  <div>
                    <div className="field-l">상태 변경 사유</div>
                    <div className="seg-control">
                      {PROCESS_REASONS.map((reason) => (
                        <button
                          key={reason}
                          className={processReason === reason ? "on" : ""}
                          onClick={() => setProcessReason(reason)}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="field-l">담당 부서</div>
                    <div className="seg-control">
                      {DEPARTMENTS.map((item) => (
                        <button
                          key={item}
                          className={department === item ? "on" : ""}
                          onClick={() => setDepartment(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="field-l">해결 완료 체크리스트</div>
                    <div className="check-grid">
                      {RESOLUTION_CHECKS.map((item) => (
                        <label className="check-item" key={item}>
                          <input
                            type="checkbox"
                            checked={Boolean(resolutionChecks[item])}
                            onChange={() => toggleResolutionCheck(item)}
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="field-l">첨부파일 Mock 영역</div>
                    <div className="attach-grid">
                      {ATTACHMENTS.map((item) => (
                        <div className="attach-card" key={item.name}>
                          <b>{item.name}</b>
                          <span>{item.file}</span>
                          <em>{item.status}</em>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="row-flex" style={{ justifyContent: "space-between" }}>
                    <span className="backend-needed">처리 메모/첨부 저장은 백엔드 붙여야 함</span>
                    <button className="h-btn primary" onClick={saveProcessMemo}>
                      처리 내용 저장
                    </button>
                  </div>
                </div>

                <div>
                  <div className="field-l">관리자 처리 이력</div>
                  <div className="timeline">
                    {reportHistory(selected).map((item) => (
                      <div className="timeline-item" key={item}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="field-l" style={{ marginTop: 6 }}>
                  상태 변경
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(["received", "checking", "scheduled", "resolved"] as ReportStatus[]).map(
                    (s) => (
                      <button
                        key={s}
                        className={
                          "h-btn" + (selected.status === s ? " primary" : "")
                        }
                        onClick={() => onStatusChange(s)}
                      >
                        {labelOf(s)}
                      </button>
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="small-muted">제보를 선택해 주세요.</div>
            )}
          </div>
          ) : (
            <div className="detail-collapsed">
              <b>상세 패널이 닫혀 있습니다.</b>
              <span>목록에서 제보를 선택하거나 버튼을 눌러 다시 열 수 있습니다.</span>
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

function labelOf(s: ReportStatus): string {
  return {
    received: "접수",
    checking: "확인 중",
    scheduled: "조치 예정",
    resolved: "해결됨",
  }[s];
}

function statusFromParam(value: string | null): ReportStatus | "all" {
  return ["received", "checking", "scheduled", "resolved"].includes(value ?? "")
    ? (value as ReportStatus)
    : "all";
}

function sortValue(report: AccessibilityReport, key: SortKey): string | number {
  if (key === "createdAt") return report.createdAt;
  if (key === "reportCount") return report.reportCount;
  if (key === "empathyCount") return report.empathyCount;
  return URGENCY_WEIGHT[report.urgency];
}

function urgencyLabel(urgency: Urgency): string {
  return {
    high: "높음",
    mid: "중간",
    low: "낮음",
  }[urgency];
}

function draftAction(report: AccessibilityReport): string {
  if (report.problemType === "엘리베이터") {
    return "승강기 버튼 높이 현장 점검, 보조 버튼 설치 검토, 임시 안내문 부착";
  }
  if (report.problemType === "키오스크") {
    return "저상 키오스크 도입 검토, 대체 주문 창구 안내, 직원 호출 동선 표시";
  }
  if (report.problemType === "강의실") {
    return "강의실 대체 배정 기준 마련, 계단식 강의실 수강 접근성 사전 점검";
  }
  if (report.problemType === "화장실") {
    return "장애인 화장실 적치물 제거, 정기 점검 체크리스트 반영";
  }
  return "현장 확인, 단기 안내 조치, 중장기 시설 개선 검토";
}

function reportHistory(report: AccessibilityReport): string[] {
  const base = [`${report.createdAt} 제보 접수`];
  if (report.status === "received") {
    return [...base, "센터 검토 대기", "담당자 배정은 백엔드 붙여야 함"];
  }
  if (report.status === "checking") {
    return [
      ...base,
      "센터 검토 시작",
      `${report.assignee ?? "담당자"} 확인 중`,
      "시설팀 전달 전 근거 정리",
    ];
  }
  if (report.status === "scheduled") {
    return [...base, "시설관리팀 전달", "조치 예정 등록", "리포트 반영 가능"];
  }
  return [...base, "조치 완료", "현장 재확인 필요", "2주 후 재점검 예정"];
}
