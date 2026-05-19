import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import {
  getImprovementTasks,
  updateImprovementTaskStage,
} from "../services/api";
import type { ImprovementTask, WorkflowStage } from "../types";
import { ToastContext } from "../App";
import { ConfirmModal } from "../components/ConfirmModal";
import { OperationalStatus } from "../components/OperationalStatus";
import { PageState } from "../components/PageState";
import { SkeletonTable } from "../components/SkeletonTable";

const STAGES: { key: WorkflowStage; label: string; desc: string }[] = [
  { key: "reported", label: "제보 접수", desc: "학생 제보와 공감이 모임" },
  { key: "reviewing", label: "센터 검토", desc: "중복·위험도·근거 확인" },
  { key: "sent_to_facility", label: "부서 전달", desc: "시설팀/교무처로 개선 요청" },
  { key: "scheduled", label: "조치 예정", desc: "예산·일정·담당자 확정" },
  { key: "resolved", label: "해결됨", desc: "현장 확인 후 종료" },
];

type WorkflowSortKey = "dueDate" | "owner" | "buildingName" | "stage";
type SortDirection = "asc" | "desc";

const WORKFLOW_SORT_OPTIONS: { key: WorkflowSortKey; label: string }[] = [
  { key: "dueDate", label: "기한순" },
  { key: "owner", label: "담당자순" },
  { key: "buildingName", label: "장소순" },
  { key: "stage", label: "단계순" },
];

const STAGE_WEIGHT: Record<WorkflowStage, number> = {
  reported: 1,
  reviewing: 2,
  sent_to_facility: 3,
  scheduled: 4,
  resolved: 5,
};

export const WorkflowPage: React.FC = () => {
  const { showToast } = useContext(ToastContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSelectedId = searchParams.get("selected");
  const [tasks, setTasks] = useState<ImprovementTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<WorkflowStage | "all">(
    workflowStageFromParam(searchParams.get("stage"))
  );
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sortKey, setSortKey] = useState<WorkflowSortKey>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [detailOpen, setDetailOpen] = useState(true);
  const [detailPinned, setDetailPinned] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    confirmText: string;
    tone?: "default" | "danger";
    run: () => void;
  } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getImprovementTasks({
      stage: stageFilter,
      query,
    }).then((items) => {
      setTasks(items);
      const nextId = items.some((item) => item.id === requestedSelectedId)
        ? requestedSelectedId
        : items[0]?.id ?? null;
      setSelectedId(nextId);
      setIsLoading(false);
    });
  }, [query, reloadKey, requestedSelectedId, stageFilter]);

  const selected = useMemo(
    () => tasks.find((task) => task.id === selectedId) ?? null,
    [tasks, selectedId]
  );

  const sortedTasks = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...tasks].sort((a, b) => {
      const aValue = workflowSortValue(a, sortKey);
      const bValue = workflowSortValue(b, sortKey);
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return a.title.localeCompare(b.title, "ko");
    });
  }, [sortDirection, sortKey, tasks]);

  const stageCounts = useMemo(
    () =>
      STAGES.map((stage) => ({
        ...stage,
        count: tasks.filter((task) => task.stage === stage.key).length,
      })),
    [tasks]
  );

  const performStageChange = async (stage: WorkflowStage) => {
    if (!selected) return;
    const updated = await updateImprovementTaskStage(selected.id, stage);
    if (!updated) return;
    setTasks((cur) => cur.map((task) => (task.id === updated.id ? updated : task)));
    showToast(`"${selected.title}" 상태가 "${labelOf(stage)}"(으)로 변경되었습니다.`);
  };

  const setStage = (stage: WorkflowStage) => {
    if (!selected) return;
    setConfirmAction({
      title: `개선 과제를 "${labelOf(stage)}" 단계로 변경할까요?`,
      description: "워크플로우 단계 변경은 시설팀 전달, 일정 등록, 완료 이력과 연결되는 작업입니다.",
      confirmText: labelOf(stage),
      tone: stage === "resolved" ? "danger" : "default",
      run: () => void performStageChange(stage),
    });
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
            <h1>개선 워크플로우</h1>
            <div className="sub">
              제보가 학교 개선 요청으로 넘어가는 과정을 관리자 화면에서 추적합니다.
            </div>
          </div>
        </div>

        <OperationalStatus
          title="개선 워크플로우 동기화 상태"
          onRetry={() => setReloadKey((key) => key + 1)}
        />

        <div className="workflow-steps">
          {stageCounts.map((stage, i) => (
            <div className="workflow-step" key={stage.key}>
              <div className="num">{i + 1}</div>
              <div>
                <b>{stage.label}</b>
                <span>{stage.desc}</span>
              </div>
              <em>{stage.count}</em>
            </div>
          ))}
        </div>

        <div className="toolbar mt-14">
          <input
            className="search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateQueryParam("q", e.target.value.trim() || null);
            }}
            placeholder="개선 과제, 장소, 담당, 근거, 다음 조치 검색"
          />
          <span className="small-muted">
            검색 결과 {tasks.length}건 · 실제 서버 검색은 백엔드 붙여야 함
          </span>
          <label className="filter select-filter">
            <span>정렬</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as WorkflowSortKey)}
              aria-label="개선 과제 정렬 기준"
            >
              {WORKFLOW_SORT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="h-btn"
            onClick={() =>
              setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
            }
            aria-label="개선 과제 정렬 방향 변경"
          >
            {sortDirection === "asc" ? "오름차순" : "내림차순"}
          </button>
        </div>

        <div className="row-flex" style={{ marginBottom: 12, flexWrap: "wrap" }}>
          {[{ key: "all" as const, label: "전체" }, ...STAGES].map((stage) => (
            <button
              key={stage.key}
              className={"filter" + (stageFilter === stage.key ? " active" : "")}
              onClick={() => {
                setStageFilter(stage.key);
                updateQueryParam("stage", stage.key);
              }}
              style={{ cursor: "pointer", border: 0 }}
            >
              {stage.label}
            </button>
          ))}
        </div>

        <div className="split mt-14">
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? (
              <SkeletonTable rows={4} cols={5} />
            ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>개선 과제</th>
                  <th style={{ width: 110 }}>장소</th>
                  <th style={{ width: 110 }}>담당</th>
                  <th style={{ width: 110 }}>기한</th>
                  <th style={{ width: 110 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={task.id === selectedId ? "selected" : ""}
                    onClick={() => {
                      setSelectedId(task.id);
                      setSearchParams({ selected: task.id });
                      setDetailOpen(true);
                    }}
                  >
                    <td>
                      <b>{task.title}</b>
                      <div className="small-muted">{task.evidence}</div>
                    </td>
                    <td>{task.buildingName}</td>
                    <td className="small-muted">{task.owner}</td>
                    <td className="small-muted">{task.dueDate}</td>
                    <td>
                      <span className={`status ${stageClass(task.stage)}`}>
                        {labelOf(task.stage)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
            {!isLoading && tasks.length === 0 && (
              <PageState
                kind="empty"
                title="조건에 맞는 개선 과제가 없습니다"
                description="단계 필터를 초기화하거나 검색어를 바꿔 주세요. 실제 서버 검색은 백엔드 붙여야 함."
                actionLabel="필터 초기화"
                onAction={() => {
                  setStageFilter("all");
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
                      {selected.title}
                    </div>
                    <div className="small-muted">
                      {selected.buildingName} · {selected.problemType} · {selected.owner}
                    </div>
                  </div>
                  <div className="detail-actions">
                    <span className={`status ${stageClass(selected.stage)}`}>
                      {labelOf(selected.stage)}
                    </span>
                    <button
                      className="icon-mini-btn"
                      onClick={() => setDetailPinned((current) => !current)}
                      aria-label={detailPinned ? "상세 패널 고정 해제" : "상세 패널 고정"}
                    >
                      {detailPinned ? "고정" : "해제"}
                    </button>
                    <button
                      className="icon-mini-btn"
                      onClick={() => setDetailOpen(false)}
                      aria-label="상세 패널 닫기"
                    >
                      닫기
                    </button>
                  </div>
                </div>

                <div>
                  <div className="field-l">근거 데이터</div>
                  <div className="field-v quote">{selected.evidence}</div>
                </div>

                <div>
                  <div className="field-l">다음 조치</div>
                  <div className="field-v">{selected.nextAction}</div>
                </div>

                <div>
                  <div className="field-l">처리 단계 변경</div>
                  <div className="stage-actions">
                    {STAGES.map((stage) => (
                      <button
                        key={stage.key}
                        className={
                          "h-btn" + (selected.stage === stage.key ? " primary" : "")
                        }
                        onClick={() => setStage(stage.key)}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ai-suggest">
                  <div className="l">관리자 메모</div>
                  <div className="v">
                    백엔드 연결 전에는 화면 상태만 변경됩니다. 추후 Spring Boot API에서는
                    이 단계가 `PATCH /api/admin/improvement-tasks/:id/stage`로
                    연결되면 됩니다.
                  </div>
                </div>
              </>
            ) : (
              <div className="small-muted">개선 과제를 선택해 주세요.</div>
            )}
          </div>
          ) : (
            <button
              className="detail-collapsed"
              onClick={() => setDetailOpen(true)}
              type="button"
            >
              상세 패널 열기
              <span>선택한 개선 과제의 근거와 처리 단계를 다시 확인합니다.</span>
            </button>
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

function labelOf(stage: WorkflowStage): string {
  return {
    reported: "제보 접수",
    reviewing: "센터 검토",
    sent_to_facility: "부서 전달",
    scheduled: "조치 예정",
    resolved: "해결됨",
  }[stage];
}

function stageClass(stage: WorkflowStage): string {
  return {
    reported: "recv",
    reviewing: "check",
    sent_to_facility: "public",
    scheduled: "plan",
    resolved: "done",
  }[stage];
}

function workflowStageFromParam(value: string | null): WorkflowStage | "all" {
  return ["reported", "reviewing", "sent_to_facility", "scheduled", "resolved"].includes(
    value ?? ""
  )
    ? (value as WorkflowStage)
    : "all";
}

function workflowSortValue(task: ImprovementTask, key: WorkflowSortKey): string | number {
  if (key === "stage") return STAGE_WEIGHT[task.stage];
  return task[key];
}
