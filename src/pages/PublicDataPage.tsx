import React, { useContext, useEffect, useMemo, useState } from "react";
import { Topbar } from "../components/Topbar";
import {
  getModeLabel,
  getPublicDataComparisons,
  getPublicDataDatasetStatuses,
  getPublicDataProviderStatus,
  getPublicDataNormalization,
  getPublicDataNormalizedRecords,
  getPublicDataRawRecords,
  getPublicDataSources,
  syncAllPublicDataPages,
  syncAllPublicDataSources,
} from "../services/api";
import { ToastContext } from "../App";
import type {
  PublicDataComparison,
  PublicDataCoverage,
  PublicDataDatasetStatus,
  PublicDataNormalizedRecord,
  PublicDataRawRecord,
  PublicDataSource,
} from "../types";
import { UrgencyBadge } from "../components/StatusBadge";

type PublicDataSyncResult = Awaited<
  ReturnType<typeof syncAllPublicDataSources>
>["results"][number];

interface PublicDataLayerPoint {
  id: string;
  label: string;
  datasetKey: string;
  kind: "accessibility" | "safety" | "transport" | "emergency" | "facility";
  left: number;
  top: number;
  exact: boolean;
}

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

const LAYER_LABEL: Record<PublicDataLayerPoint["kind"], string> = {
  accessibility: "접근성",
  safety: "안전",
  transport: "교통",
  emergency: "응급",
  facility: "시설",
};

export const PublicDataPage: React.FC = () => {
  const { showToast } = useContext(ToastContext);
  const [sources, setSources] = useState<PublicDataSource[]>([]);
  const [comparisons, setComparisons] = useState<PublicDataComparison[]>([]);
  const [providerMessage, setProviderMessage] = useState("");
  const [syncSummary, setSyncSummary] = useState("");
  const [syncResults, setSyncResults] = useState<PublicDataSyncResult[]>([]);
  const [datasetStatuses, setDatasetStatuses] = useState<PublicDataDatasetStatus[]>([]);
  const [rawRecords, setRawRecords] = useState<PublicDataRawRecord[]>([]);
  const [normalizedRecords, setNormalizedRecords] = useState<PublicDataNormalizedRecord[]>([]);
  const [selectedDatasetKey, setSelectedDatasetKey] = useState("");
  const [rawLoading, setRawLoading] = useState(false);
  const [normalizationSummary, setNormalizationSummary] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [category, setCategory] = useState<PublicDataSource["category"] | "전체">(
    "전체"
  );

  useEffect(() => {
    getPublicDataSources().then(setSources);
    getPublicDataComparisons().then(setComparisons);
    getPublicDataDatasetStatuses().then(setDatasetStatuses);
    getPublicDataProviderStatus().then((status) => setProviderMessage(status.message));
    getPublicDataNormalization().then((result) =>
      setNormalizationSummary(
        `정규화 필드 ${result.fields.length}개 · 출처 ${result.sourceCount}종 · 비교 ${result.comparisonCount}건`
      )
    );
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
  const configuredDatasetCount = datasetStatuses.filter((item) => item.endpointConfigured).length;
  const missingDatasetCount = Math.max(datasetStatuses.length - configuredDatasetCount, 0);
  const layerPoints = useMemo(
    () => buildLayerPoints(normalizedRecords, rawRecords),
    [normalizedRecords, rawRecords]
  );
  const layerCounts = useMemo(
    () =>
      layerPoints.reduce<Record<PublicDataLayerPoint["kind"], number>>(
        (acc, point) => {
          acc[point.kind] += 1;
          return acc;
        },
        { accessibility: 0, safety: 0, transport: 0, emergency: 0, facility: 0 }
      ),
    [layerPoints]
  );

  const reloadPublicData = async () => {
    const [nextSources, nextComparisons, status] = await Promise.all([
      getPublicDataSources(),
      getPublicDataComparisons(),
      getPublicDataProviderStatus(),
    ]);
    setSources(nextSources);
    setComparisons(nextComparisons);
    setProviderMessage(status.message);
  };

  const loadRawRecords = async (datasetKey?: string) => {
    const nextKey = datasetKey ?? "";
    setSelectedDatasetKey(nextKey);
    setRawLoading(true);
    try {
      const [records, normalized] = await Promise.all([
        getPublicDataRawRecords(nextKey || undefined),
        getPublicDataNormalizedRecords(nextKey || undefined),
      ]);
      setRawRecords(records);
      setNormalizedRecords(normalized);
      showToast(
        records.length > 0
          ? `원본 데이터 ${records.length}건을 불러왔습니다.`
          : "저장된 원본 데이터가 없습니다. 먼저 실제 동기화를 실행하세요.",
        records.length > 0 ? "success" : "warning"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "원본 데이터 조회에 실패했습니다.";
      showToast(message, "error");
    } finally {
      setRawLoading(false);
    }
  };

  const syncPublicData = async () => {
    setSyncing(true);
    try {
      const result = await syncAllPublicDataSources();
      await reloadPublicData();
      setSyncResults(result.results);
      setSyncSummary(
        `마지막 동기화: 실제 호출 ${result.attemptedDatasets}개 · 성공 ${result.successDatasets}개 · 설정 필요/실패 ${result.skippedDatasets + (result.attemptedDatasets - result.successDatasets)}개`
      );
      showToast(
        result.successDatasets > 0
          ? `공공데이터 ${result.successDatasets}/${result.totalDatasets}개 동기화 완료`
          : `공공데이터 실제 연동은 아직 적용 안 됨: ${result.skippedDatasets}개 데이터셋 설정 필요`,
        result.successDatasets > 0 ? "success" : "warning"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "공공데이터 동기화에 실패했습니다.";
      showToast(message, "error");
    } finally {
      setSyncing(false);
    }
  };

  const syncFullPublicData = async () => {
    setSyncing(true);
    try {
      const result = await syncAllPublicDataPages();
      await reloadPublicData();
      setSyncResults(result.results);
      setSyncSummary(
        `전체 수집: 실제 호출 ${result.attemptedDatasets}개 · 성공 ${result.successDatasets}개 · 설정 필요/실패 ${result.skippedDatasets + (result.attemptedDatasets - result.successDatasets)}개`
      );
      showToast(
        result.successDatasets > 0
          ? `공공데이터 전체 수집 ${result.successDatasets}/${result.totalDatasets}개 완료`
          : "전체 수집은 실행됐지만 인증키/endpoint 설정이 더 필요합니다.",
        result.successDatasets > 0 ? "success" : "warning"
      );
      const firstDatasetKey = result.results.find(
        (item) => item.success && item.datasetKey && (item.rawRecordCount ?? 0) > 0
      )?.datasetKey;
      if (firstDatasetKey) {
        await loadRawRecords(firstDatasetKey);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "공공데이터 전체 수집에 실패했습니다.";
      showToast(message, "error");
    } finally {
      setSyncing(false);
    }
  };

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
          <div className="row-flex">
            <button className="h-btn" onClick={syncPublicData} disabled={syncing}>
              {syncing ? "동기화 확인 중..." : "샘플 동기화"}
            </button>
            <button className="h-btn primary" onClick={syncFullPublicData} disabled={syncing}>
              전체 페이지 배치 수집
            </button>
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
              <span className="more">{getModeLabel()} 기준</span>
            </div>
            {providerMessage && (
              <div className="small-muted" style={{ marginBottom: 12 }}>
                {providerMessage}
              </div>
            )}
            {syncSummary && (
              <div className="sync-summary" style={{ marginBottom: 12 }}>
                {syncSummary}
              </div>
            )}
            {normalizationSummary && (
              <div className="sync-summary" style={{ marginBottom: 12 }}>
                {normalizationSummary} · endpoint 설정 {configuredDatasetCount}/
                {datasetStatuses.length || 68}개
              </div>
            )}

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
                  <div className="source-actions">
                    <span className={`status ${source.status === "확인 필요" ? "check" : "done"}`}>
                      {source.status}
                    </span>
                    {source.datasetKey && (
                      <button
                        className="mini-btn"
                        onClick={() => loadRawRecords(source.datasetKey)}
                        disabled={rawLoading}
                      >
                        원본 보기
                      </button>
                    )}
                  </div>
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
                <b>정기 스케줄러</b>
                <span>백엔드에서 PUBLIC_DATA_SCHEDULER_ENABLED=true일 때 cron 기반 전체 수집 실행</span>
              </div>
              <div>
                <b>발표 포인트</b>
                <span>공공데이터 + 당사자 데이터 결합 구조를 보여줌</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel mt-14">
          <div className="panel-h">
            <h3>공공데이터 지도 레이어</h3>
            <span className="more">
              {selectedDatasetKey || "원본 데이터 선택 전"} · {layerPoints.length}개 후보
            </span>
          </div>
          <div className="layer-map-wrap">
            <div className="public-layer-map" aria-label="공공데이터 지도 레이어 미리보기">
              <div className="layer-campus-core">
                <b>ONDA 캠퍼스</b>
                <span>현장 제보 + 공공데이터 후보 레이어</span>
              </div>
              {layerPoints.map((point) => (
                <div
                  className={`layer-pin ${point.kind}`}
                  key={point.id}
                  style={{ left: `${point.left}%`, top: `${point.top}%` }}
                  title={`${point.label} · ${point.exact ? "좌표 후보" : "데이터셋 후보"}`}
                >
                  <span>{LAYER_LABEL[point.kind]}</span>
                  <b>{point.label}</b>
                </div>
              ))}
              {layerPoints.length === 0 && (
                <div className="layer-empty">
                  원본 보기를 누르면 수집된 공공데이터를 지도 레이어 후보로 표시합니다.
                </div>
              )}
            </div>
            <div className="layer-legend">
              {Object.entries(layerCounts).map(([kind, count]) => (
                <div key={kind}>
                  <span className={`legend-dot ${kind}`} />
                  <b>{LAYER_LABEL[kind as PublicDataLayerPoint["kind"]]}</b>
                  <em>{count}개</em>
                </div>
              ))}
            </div>
          </div>
          <div className="small-muted mt-10">
            좌표가 없는 공공데이터 row는 실제 위치로 단정하지 않고 데이터셋 후보 레이어로 표시합니다.
          </div>
        </div>

        <div className="panel mt-14" style={{ padding: 0, overflow: "hidden" }}>
          <div className="panel-h table-panel-h">
            <h3>수집 결과 상세</h3>
            <span className="more">
              {syncResults.length > 0 ? `${syncResults.length}개 데이터셋` : "동기화 실행 후 표시"}
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>데이터셋</th>
                <th style={{ width: 90 }}>상태</th>
                <th style={{ width: 90 }}>수신</th>
                <th style={{ width: 90 }}>원본</th>
                <th>메시지</th>
                <th style={{ width: 90 }}>조회</th>
              </tr>
            </thead>
            <tbody>
              {syncResults.map((item) => (
                <tr key={`${item.datasetKey ?? item.datasetName}-${item.syncedAt}`}>
                  <td>
                    <b>{item.datasetName}</b>
                    <div className="small-muted">{item.datasetKey ?? "datasetKey 없음"}</div>
                  </td>
                  <td>
                    <span className={`status ${item.success ? "done" : item.attempted ? "check" : "recv"}`}>
                      {item.success ? "성공" : item.attempted ? "실패" : "설정 필요"}
                    </span>
                  </td>
                  <td>{item.fetchedCount.toLocaleString()}건</td>
                  <td>{(item.rawRecordCount ?? 0).toLocaleString()}건</td>
                  <td className="small-muted">{item.message}</td>
                  <td>
                    <button
                      className="mini-btn"
                      onClick={() => loadRawRecords(item.datasetKey ?? undefined)}
                      disabled={!item.datasetKey || rawLoading}
                    >
                      원본
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {syncResults.length === 0 && (
            <div className="empty-state">
              샘플 동기화 또는 전체 페이지 배치 수집을 실행하면 데이터셋별 결과가 표시됩니다.
            </div>
          )}
        </div>

        <div className="panel mt-14">
          <div className="panel-h">
            <h3>원본 데이터 상세 조회</h3>
            <span className="more">
              {selectedDatasetKey || "전체 최근 원본"} · {rawRecords.length}건
            </span>
          </div>
          {rawLoading ? (
            <div className="empty-state">원본 데이터를 불러오는 중입니다.</div>
          ) : rawRecords.length > 0 ? (
            <div className="raw-record-list">
              {rawRecords.map((record) => {
                const fields = parseRawPayload(record.rawPayload);
                return (
                  <div className="raw-record" key={record.id}>
                    <div className="raw-record-head">
                      <b>{record.datasetName}</b>
                      <span>
                        page {record.pageNo} · row {record.recordIndex} · {record.createdAt}
                      </span>
                    </div>
                    <div className="raw-field-grid">
                      {fields.map(([key, value]) => (
                        <div key={key}>
                          <span>{key}</span>
                          <b>{String(value)}</b>
                        </div>
                      ))}
                    </div>
                    <details className="raw-details">
                      <summary>원본 JSON 보기</summary>
                      <pre>{record.rawPayload}</pre>
                    </details>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              아직 저장된 원본 데이터가 없습니다. 실제 API 설정 후 샘플 동기화나 전체 페이지 배치 수집을 실행하세요.
            </div>
          )}
        </div>

        <div className="data-grid mt-14">
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div className="panel-h table-panel-h">
              <h3>endpoint 설정 현황</h3>
              <span className="more">
                설정 {configuredDatasetCount}개 · 미설정 {missingDatasetCount}개
              </span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>데이터셋</th>
                  <th style={{ width: 90 }}>상태</th>
                  <th>환경 변수</th>
                </tr>
              </thead>
              <tbody>
                {datasetStatuses.slice(0, 12).map((item) => (
                  <tr key={item.datasetKey}>
                    <td>
                      <b>{item.datasetName}</b>
                      <div className="small-muted">{item.datasetKey}</div>
                    </td>
                    <td>
                      <span className={`status ${item.endpointConfigured ? "done" : "recv"}`}>
                        {item.endpointConfigured ? "설정됨" : "미설정"}
                      </span>
                    </td>
                    <td className="small-muted">{item.envName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {datasetStatuses.length > 12 && (
              <div className="small-muted endpoint-note">
                화면에는 상위 12개만 표시합니다. 전체 목록은 API{" "}
                <code>/api/admin/public-data/dataset-status</code>에서 확인할 수 있습니다.
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>정규화 미리보기</h3>
              <span className="more">{normalizedRecords.length}건</span>
            </div>
            {normalizedRecords.length > 0 ? (
              <div className="quality-list">
                {normalizedRecords.slice(0, 5).map((record) => (
                  <div key={record.rawRecordId}>
                    <b>{record.buildingName ?? record.datasetName}</b>
                    <span>
                      {record.address ?? "주소 후보 없음"} ·{" "}
                      {record.accessibilityFeature ??
                        record.safetyFacility ??
                        "정규화 후보 확인 필요"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                원본 보기를 누르면 공통 필드 정규화 결과가 표시됩니다.
              </div>
            )}
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

function parseRawPayload(payload: string): Array<[string, string | number | boolean]> {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    return Object.entries(parsed)
      .filter(([, value]) => value !== null && value !== undefined && typeof value !== "object")
      .slice(0, 8)
      .map(([key, value]) => [key, value as string | number | boolean]);
  } catch {
    return [["raw", payload.slice(0, 220)]];
  }
}

function buildLayerPoints(
  normalizedRecords: PublicDataNormalizedRecord[],
  rawRecords: PublicDataRawRecord[]
): PublicDataLayerPoint[] {
  const records = normalizedRecords.slice(0, 12);
  if (records.length > 0) {
    return records.map((record, index) => {
      const exact = Boolean(record.latitude && record.longitude);
      return {
        id: record.rawRecordId,
        datasetKey: record.datasetKey,
        label: record.buildingName ?? record.datasetName,
        kind: inferLayerKind(record.datasetKey),
        left: exact ? coordinateToPercent(record.longitude, 126.95, 127.1) : fallbackPoint(index, "left"),
        top: exact ? coordinateToPercent(record.latitude, 37.45, 37.65, true) : fallbackPoint(index, "top"),
        exact,
      };
    });
  }

  return rawRecords.slice(0, 8).map((record, index) => ({
    id: record.id,
    datasetKey: record.datasetKey,
    label: record.datasetName,
    kind: inferLayerKind(record.datasetKey),
    left: fallbackPoint(index, "left"),
    top: fallbackPoint(index, "top"),
    exact: false,
  }));
}

function inferLayerKind(datasetKey: string): PublicDataLayerPoint["kind"] {
  if (datasetKey.includes("aed") || datasetKey.includes("hospital") || datasetKey.includes("pharmacy")) {
    return "emergency";
  }
  if (
    datasetKey.includes("cctv") ||
    datasetKey.includes("bell") ||
    datasetKey.includes("light") ||
    datasetKey.includes("police") ||
    datasetKey.includes("fire")
  ) {
    return "safety";
  }
  if (
    datasetKey.includes("bus") ||
    datasetKey.includes("transport") ||
    datasetKey.includes("subway") ||
    datasetKey.includes("road")
  ) {
    return "transport";
  }
  if (
    datasetKey.includes("accessibility") ||
    datasetKey.includes("barrier") ||
    datasetKey.includes("disabled")
  ) {
    return "accessibility";
  }
  return "facility";
}

function coordinateToPercent(
  value: string | undefined,
  min: number,
  max: number,
  invert = false
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 50;
  }
  const ratio = Math.max(0.08, Math.min(0.92, (parsed - min) / (max - min)));
  return Math.round((invert ? 1 - ratio : ratio) * 100);
}

function fallbackPoint(index: number, axis: "left" | "top") {
  const lefts = [18, 42, 67, 30, 78, 55, 22, 88, 47, 70, 36, 60];
  const tops = [28, 20, 34, 58, 54, 74, 78, 24, 46, 82, 38, 62];
  return axis === "left" ? lefts[index % lefts.length] : tops[index % tops.length];
}
