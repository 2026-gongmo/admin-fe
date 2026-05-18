import React, { useContext, useEffect, useMemo, useState } from "react";
import { Topbar } from "../components/Topbar";
import {
  getImprovementTasks,
  updateImprovementTaskStage,
} from "../services/api";
import type { ImprovementTask, WorkflowStage } from "../types";
import { ToastContext } from "../App";

const STAGES: { key: WorkflowStage; label: string; desc: string }[] = [
  { key: "reported", label: "제보 접수", desc: "학생 제보와 공감이 모임" },
  { key: "reviewing", label: "센터 검토", desc: "중복·위험도·근거 확인" },
  { key: "sent_to_facility", label: "부서 전달", desc: "시설팀/교무처로 개선 요청" },
  { key: "scheduled", label: "조치 예정", desc: "예산·일정·담당자 확정" },
  { key: "resolved", label: "해결됨", desc: "현장 확인 후 종료" },
];

export const WorkflowPage: React.FC = () => {
  const { showToast } = useContext(ToastContext);
  const [tasks, setTasks] = useState<ImprovementTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    getImprovementTasks().then((items) => {
      setTasks(items);
      setSelectedId(items[0]?.id ?? null);
    });
  }, []);

  const selected = useMemo(
    () => tasks.find((task) => task.id === selectedId) ?? null,
    [tasks, selectedId]
  );

  const stageCounts = useMemo(
    () =>
      STAGES.map((stage) => ({
        ...stage,
        count: tasks.filter((task) => task.stage === stage.key).length,
      })),
    [tasks]
  );

  const setStage = async (stage: WorkflowStage) => {
    if (!selected) return;
    const updated = await updateImprovementTaskStage(selected.id, stage);
    if (!updated) return;
    setTasks((cur) => cur.map((task) => (task.id === updated.id ? updated : task)));
    showToast(`"${selected.title}" 상태가 "${labelOf(stage)}"(으)로 변경되었습니다.`);
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

        <div className="split mt-14">
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
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
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={task.id === selectedId ? "selected" : ""}
                    onClick={() => setSelectedId(task.id)}
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
            {tasks.length === 0 && (
              <div className="empty-state">
                등록된 개선 과제 샘플이 없습니다.
              </div>
            )}
          </div>

          <div className="detail">
            {selected ? (
              <>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>
                    {selected.title}
                  </div>
                  <div className="small-muted">
                    {selected.buildingName} · {selected.problemType} · {selected.owner}
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
        </div>
      </main>
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
