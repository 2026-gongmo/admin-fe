import React, { useEffect, useMemo, useState } from "react";
import { Topbar } from "../components/Topbar";
import {
  getPublicDataComparisons,
  getPublicDataSources,
} from "../services/api";
import type {
  PublicDataComparison,
  PublicDataCoverage,
  PublicDataSource,
} from "../types";
import { UrgencyBadge } from "../components/StatusBadge";

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

export const PublicDataPage: React.FC = () => {
  const [sources, setSources] = useState<PublicDataSource[]>([]);
  const [comparisons, setComparisons] = useState<PublicDataComparison[]>([]);
  const [category, setCategory] = useState<PublicDataSource["category"] | "전체">(
    "전체"
  );

  useEffect(() => {
    getPublicDataSources().then(setSources);
    getPublicDataComparisons().then(setComparisons);
  }, []);

  const categories = useMemo(
    () => ["전체", ...Array.from(new Set(sources.map((s) => s.category)))] as const,
    [sources]
  );

  const filteredSources = useMemo(
    () => (category === "전체" ? sources : sources.filter((s) => s.category === category)),
    [sources, category]
  );

  const mismatchCount = comparisons.filter((c) => c.coverage !== "matched").length;

  return (
    <>
      <Topbar />
      <main className="page">
        <div className="page-h">
          <div>
            <h1>공공데이터 비교</h1>
            <div className="sub">
              공공데이터는 초기 지도 레이어로 쓰고, 실제 이용 가능성은 ONDA 제보로 보완합니다.
            </div>
          </div>
        </div>

        <div className="summary-banner">
          <span className="badge">데이터 전략</span>
          <div>
            <div className="t">
              공공데이터 {sources.length}종 중 {mismatchCount}개 이슈가 현장 제보와 차이를 보입니다.
            </div>
            <div className="s">
              “시설이 있다”와 “장애학생이 실제로 쓸 수 있다”는 다르므로, 관리자 웹에서 차이를 추적합니다.
            </div>
          </div>
        </div>

        <div className="data-grid">
          <div className="panel">
            <div className="panel-h">
              <h3>활용 공공데이터</h3>
              <span className="more">백엔드 연동 전 샘플 기준</span>
            </div>

            <div className="row-flex" style={{ marginBottom: 12, flexWrap: "wrap" }}>
              {categories.map((c) => (
                <button
                  key={c}
                  className={"filter" + (category === c ? " active" : "")}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="source-list">
              {filteredSources.map((source) => (
                <div className="source-card" key={source.id}>
                  <div>
                    <div className="source-title">{source.name}</div>
                    <div className="small-muted">
                      {source.provider} · {source.category} · 갱신 {source.updateCycle}
                    </div>
                    <div className="source-use">{source.useCase}</div>
                  </div>
                  <span className={`status ${source.status === "확인 필요" ? "check" : "done"}`}>
                    {source.status}
                  </span>
                </div>
              ))}
              {filteredSources.length === 0 && (
                <div className="empty-state">
                  선택한 분류에 해당하는 공공데이터 샘플이 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>데이터 품질 요약</h3>
            </div>
            <div className="quality-list">
              <div>
                <b>초기 위치 정보</b>
                <span>대학알리미·편의시설 데이터로 시작 가능</span>
              </div>
              <div>
                <b>운영 상태</b>
                <span>엘리베이터 고장, 적치물, 버튼 높이는 현장 제보 필요</span>
              </div>
              <div>
                <b>AI 활용 지점</b>
                <span>공공데이터와 제보 차이를 분류하고 개선 우선순위를 추천</span>
              </div>
              <div>
                <b>발표 포인트</b>
                <span>공공데이터 + 당사자 데이터 결합 구조를 보여줌</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel mt-14" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>건물</th>
                <th>공공데이터 기록</th>
                <th>ONDA 현장 제보</th>
                <th style={{ width: 130 }}>판정</th>
                <th style={{ width: 70 }}>위험</th>
                <th>관리자 조치</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((item) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.buildingName}</b>
                  </td>
                  <td className="small-muted">{item.publicRecord}</td>
                  <td>{item.fieldReport}</td>
                  <td>
                    <span className={`status ${COVERAGE_CLASS[item.coverage]}`}>
                      {COVERAGE_LABEL[item.coverage]}
                    </span>
                  </td>
                  <td>
                    <UrgencyBadge urgency={item.risk} />
                  </td>
                  <td className="small-muted">{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {comparisons.length === 0 && (
            <div className="empty-state">
              비교할 공공데이터 샘플이 없습니다.
            </div>
          )}
        </div>
      </main>
    </>
  );
};
