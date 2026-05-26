import React, { useContext, useEffect, useState } from "react";
import { Topbar } from "../components/Topbar";
import {
  downloadMonthlyReportCsv,
  downloadMonthlyReportPdf,
  getMonthlyReport,
  getMonthlyReportSnapshots,
  isHttpMode,
} from "../services/api";
import { ToastContext } from "../App";

type Report = Awaited<ReturnType<typeof getMonthlyReport>>;

const unresolvedHighRisk = [
  {
    title: "중앙도서관 5층 승강기 보조 버튼",
    building: "중앙도서관",
    evidence: "제보 32건 · 공감 140명 · 공공데이터 불일치",
    owner: "시설관리팀",
  },
  {
    title: "공학관 계단식 강의실 접근 불가",
    building: "공학관",
    evidence: "제보 18건 · 공감 76명 · 다음 학기 강의실 배정 영향",
    owner: "교무처",
  },
];

const buildingCards = [
  {
    name: "중앙도서관",
    reports: 32,
    empathy: 140,
    risk: "높음",
    issue: "5층 승강기 버튼 높이와 미정차 제보 반복",
    action: "보조 버튼 패널 설치 및 승강기 점검 요청",
  },
  {
    name: "학생회관",
    reports: 25,
    empathy: 98,
    risk: "중간",
    issue: "식당 키오스크 높이 문제",
    action: "대체 주문 창구 안내 및 저상 키오스크 예산 검토",
  },
  {
    name: "공학관",
    reports: 18,
    empathy: 76,
    risk: "높음",
    issue: "계단식 강의실 접근 불가",
    action: "강의실 대체 배정 기준 마련",
  },
  {
    name: "체육관",
    reports: 14,
    empathy: 52,
    risk: "중간",
    issue: "장애인 화장실 적치물",
    action: "정기 점검 체크리스트 반영",
  },
];

const requestPreview = {
  title: "중앙도서관 승강기 접근성 개선 요청서",
  target: "중앙도서관 5층 승강기",
  summary:
    "휠체어 이용 학생이 승강기 버튼에 접근하기 어렵다는 반복 제보가 누적되어 수업·도서관 이용 동선에 직접적인 제약이 발생하고 있습니다.",
  evidence: "제보 32건, 공감 140명, 도움 요청 5건, 공공데이터 현장 불일치",
  action: "보조 버튼 패널 설치, 버튼 높이 점검, 임시 안내 인력 배치",
  department: "시설관리팀",
  priority: "높음",
};

export const MonthlyReportPage: React.FC = () => {
  const [report, setReport] = useState<Report | null>(null);
  const [csvExporting, setCsvExporting] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [snapshotSummary, setSnapshotSummary] = useState("");
  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    getMonthlyReport().then(setReport);
  }, []);

  if (!report) {
    return (
      <>
        <Topbar />
        <main className="page" style={{ background: "#F1F5F9" }}>
          <div className="empty-state">리포트 샘플 데이터를 불러오는 중입니다.</div>
        </main>
      </>
    );
  }

  const resolutionRate = Math.round(
    (report.metrics.resolved / report.metrics.newReports) * 100
  );

  const handleCsvExport = async () => {
    setCsvExporting(true);
    try {
      const result = await downloadMonthlyReportCsv(report.yearMonth);
      downloadBlob(result.blob, result.filename);
      const snapshots = await getMonthlyReportSnapshots();
      setSnapshotSummary(
        snapshots.length > 0
          ? `최근 스냅샷 ${snapshots.length}건 · 마지막 ${snapshots[0].exportType} · ${snapshots[0].createdBy}`
          : ""
      );
      showToast(
        result.apiBacked
          ? "CSV 파일을 Spring Boot API에서 생성해 다운로드했습니다."
          : "CSV 파일을 Mock 데이터로 생성해 다운로드했습니다."
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "CSV 파일 다운로드에 실패했습니다. 백엔드 서버 상태를 확인해 주세요.",
        "error"
      );
    } finally {
      setCsvExporting(false);
    }
  };

  const handlePdfExport = async () => {
    setPdfExporting(true);
    try {
      const result = await downloadMonthlyReportPdf(report.yearMonth);
      downloadBlob(result.blob, result.filename);
      const snapshots = await getMonthlyReportSnapshots();
      setSnapshotSummary(
        snapshots.length > 0
          ? `최근 스냅샷 ${snapshots.length}건 · 마지막 ${snapshots[0].exportType} · ${snapshots[0].createdBy}`
          : ""
      );
      showToast(
        result.apiBacked
          ? "PDF 파일을 Spring Boot API에서 생성해 다운로드했습니다."
          : "PDF 파일을 Mock 데이터로 생성해 다운로드했습니다."
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "PDF 파일 다운로드에 실패했습니다. 백엔드 서버 상태를 확인해 주세요.",
        "error"
      );
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <>
      <Topbar
        rightExtras={
          <button
            className="h-btn"
            onClick={() => showToast("리포트 미리보기는 Mock 동작입니다. 실제 저장은 아직 구현 안 됨 · 추가 예정.")}
          >
            미리보기
          </button>
        }
      />
      <main className="page" style={{ background: "#F1F5F9" }}>
        <div className="page-h">
          <div>
            <h1>{report.yearMonth} ONDA 접근성 리포트</h1>
            <div className="sub">
              장애학생지원센터 · 박주연 발행 · 문서 번호 #ONDA-RPT-2605
            </div>
          </div>
          <div className="row-flex">
            <button
              className="h-btn"
              onClick={() => showToast("개선 요청서 초안 생성은 Mock 동작입니다. 실제 저장은 아직 구현 안 됨 · 추가 예정.")}
            >
              개선 요청서 생성
            </button>
            <button
              className="h-btn primary"
              onClick={handlePdfExport}
              disabled={pdfExporting}
            >
              {pdfExporting ? "PDF 생성 중" : "⇩ PDF로 내보내기"}
            </button>
          </div>
        </div>

        <div className="report-layout">
          <div className="report-doc">
            <div className="rep-section-l">01 · 이번 달 주요 지표</div>
            <div className="rep-h">앱 데이터 기반 자동 집계</div>
            <div className="rep-kpis">
              <div className="rep-kpi">
                <div className="l">신규 제보</div>
                <div className="v">{report.metrics.newReports}</div>
              </div>
              <div className="rep-kpi">
                <div className="l">총 공감</div>
                <div className="v">
                  {report.metrics.totalEmpathy.toLocaleString()}
                </div>
              </div>
              <div className="rep-kpi">
                <div className="l">도움 요청</div>
                <div className="v">{report.metrics.helpRequests}</div>
              </div>
              <div className="rep-kpi">
                <div className="l">해결 완료</div>
                <div className="v">{report.metrics.resolved}</div>
              </div>
              <div className="rep-kpi">
                <div className="l">해결률</div>
                <div className="v">{resolutionRate}%</div>
              </div>
              <div className="rep-kpi">
                <div className="l">미해결 고위험</div>
                <div className="v">{unresolvedHighRisk.length}</div>
              </div>
            </div>

            <hr />

            <div className="rep-section-l">02 · 미해결 고위험 제보</div>
            <div className="rep-h">시설팀/교무처 전달이 필요한 항목</div>
            <div className="risk-report-grid">
              {unresolvedHighRisk.map((item) => (
                <div className="risk-report-card" key={item.title}>
                  <div className="row-flex" style={{ justifyContent: "space-between" }}>
                    <b>{item.title}</b>
                    <span className="urg high">높음</span>
                  </div>
                  <div className="small-muted mt-10">{item.building}</div>
                  <div className="risk-evidence">{item.evidence}</div>
                  <div className="small-muted">담당 부서: {item.owner}</div>
                </div>
              ))}
            </div>

            <hr />

            <div className="rep-twocol">
              <div>
                <div className="rep-section-l">03 · 가장 많이 제보된 건물</div>
                <div className="rep-h">반복도가 높은 건물 TOP 5</div>
                <div className="rep-list">
                  {report.topBuildings.map((b, i) => (
                    <div className="ri" key={b.name}>
                      <span className="r">{i + 1}</span>
                      <span>
                        <b>{b.name}</b> · {b.reason}
                      </span>
                      <span className="c">{b.count}건</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="rep-section-l">04 · 가장 많이 공감받은 문제</div>
                <div className="rep-h">학생들이 "바뀌어야" 라고 말한 이슈</div>
                <div className="rep-list">
                  {report.topEmpathy.map((e) => (
                    <div className="ri" key={e.topic}>
                      <span className="r">♡</span>
                      <span>
                        <b>{e.topic}</b>
                      </span>
                      <span className="c">공감 {e.empathy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <hr />

            <div className="rep-section-l">05 · 건물별 리포트 카드</div>
            <div className="rep-h">장소 단위로 보는 제보·공감·권장 조치</div>
            <div className="building-report-grid">
              {buildingCards.map((item) => (
                <div className="building-report-card" key={item.name}>
                  <div className="row-flex" style={{ justifyContent: "space-between" }}>
                    <b>{item.name}</b>
                    <span className={`urg ${item.risk === "높음" ? "high" : "mid"}`}>
                      {item.risk}
                    </span>
                  </div>
                  <div className="building-report-stats">
                    <span>제보 {item.reports}건</span>
                    <span>공감 {item.empathy}명</span>
                  </div>
                  <div className="field-l mt-10">주요 문제</div>
                  <div className="building-report-text">{item.issue}</div>
                  <div className="field-l mt-10">권장 조치</div>
                  <div className="building-report-text">{item.action}</div>
                </div>
              ))}
            </div>

            <hr />

            <div className="rep-section-l">06 · 개선 요청서 미리보기</div>
            <div className="rep-h">학교 시설팀 제출용 공문 초안</div>
            <div className="request-preview">
              <div className="request-preview-title">{requestPreview.title}</div>
              <div className="request-preview-grid">
                <div>
                  <span>대상 건물</span>
                  <b>{requestPreview.target}</b>
                </div>
                <div>
                  <span>담당 부서</span>
                  <b>{requestPreview.department}</b>
                </div>
                <div>
                  <span>예상 우선순위</span>
                  <b>{requestPreview.priority}</b>
                </div>
              </div>
              <div className="draft-body mt-14">
                <b>문제 요약</b>
                <span>{requestPreview.summary}</span>
              </div>
              <div className="draft-body">
                <b>근거 데이터</b>
                <span>{requestPreview.evidence}</span>
              </div>
              <div className="draft-body">
                <b>권장 조치</b>
                <span>{requestPreview.action}</span>
              </div>
              <span className="backend-needed mt-10">공문 번호 생성/전송은 아직 구현 안 됨 · 추가 예정</span>
            </div>

            <hr />

            <div className="rep-section-l">07 · 개선 요청 우선순위</div>
            <div className="rep-h">단기 · 중기 · 장기 조치 제안</div>
            <div className="rep-list">
              {report.priorities.map((p) => (
                <div
                  className="ri"
                  key={p.term}
                  style={{ gridTemplateColumns: "50px 1fr 70px" }}
                >
                  <span className="r">{p.term}</span>
                  <span>{p.text}</span>
                  <span className="c">
                    {p.term === "단기" ? "예산 ↓" : p.term === "중기" ? "예산 ↔" : "예산 ↑"}
                  </span>
                </div>
              ))}
            </div>

            <hr />

            <div className="rep-rec">
              <div className="rep-section-l">08 · 장애학생지원센터 권장 조치</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>
                {report.centerNote}
              </div>
            </div>

            <div className="rep-foot">
              ⏱ 앱 데이터 기반 자동 생성 · 마지막 업데이트 2026.05.31 09:14
            </div>
          </div>

          <div>
            <div className="aside-card">
              <div className="l">리포트 액션</div>
              <div className="aside-act">
                <button
                  className="b primary"
                  onClick={handlePdfExport}
                  disabled={pdfExporting}
                >
                  {pdfExporting ? "PDF 생성 중" : "PDF로 내보내기"} <span>›</span>
                </button>
                <button
                  className="b"
                  onClick={handleCsvExport}
                  disabled={csvExporting}
                >
                  {csvExporting ? "CSV 생성 중" : "CSV로 내보내기"} <span>›</span>
                </button>
                <button
                  className="b"
                  onClick={() => showToast("센터 공유는 Mock 동작입니다. 실제 전송은 아직 구현 안 됨 · 추가 예정.")}
                >
                  센터 공유 <span>›</span>
                </button>
                <button
                  className="b"
                  onClick={() => showToast("개선 요청서 초안 생성은 Mock 동작입니다. 실제 저장은 아직 구현 안 됨 · 추가 예정.")}
                >
                  개선 요청서 생성 <span>›</span>
                </button>
                <button
                  className="b"
                  onClick={() => showToast("Notion 전송은 Mock 동작입니다. 실제 연동은 아직 구현 안 됨 · 추가 예정.")}
                >
                  노션 페이지로 보내기 <span>›</span>
                </button>
              </div>
            </div>

            <div className="aside-card">
              <div className="l">포함된 섹션</div>
              <div className="small-muted" style={{ lineHeight: 1.85 }}>
                ✓ <b style={{ color: "var(--text)" }}>주요 지표</b><br />
                ✓ <b style={{ color: "var(--text)" }}>미해결 고위험 제보</b><br />
                ✓ <b style={{ color: "var(--text)" }}>건물 랭킹</b><br />
                ✓ <b style={{ color: "var(--text)" }}>공감 TOP 이슈</b><br />
                ✓ <b style={{ color: "var(--text)" }}>건물별 리포트 카드</b><br />
                ✓ <b style={{ color: "var(--text)" }}>개선 요청서 미리보기</b><br />
                ✓ <b style={{ color: "var(--text)" }}>개선 우선순위</b><br />
                ✓ <b style={{ color: "var(--text)" }}>센터 권장 조치</b><br />
                ☐ 학생 응답률 분석<br />
                ☐ 전년 동월 비교
              </div>
            </div>

            <div className="aside-card">
              <div className="l">데이터 출처</div>
              <div className="small-muted" style={{ lineHeight: 1.85 }}>
                <b style={{ color: "var(--text)" }}>모바일 앱</b> · 제보 128건<br />
                <b style={{ color: "var(--text)" }}>모바일 앱</b> · 공감 1,842건<br />
                <b style={{ color: "var(--text)" }}>모바일 앱</b> · 도움 요청 73건<br />
                <b style={{ color: "var(--text)" }}>관리자</b> · 처리 기록 42건<br />
                <span className="backend-needed" style={{ marginTop: 8 }}>
                  PDF/CSV는 {isHttpMode() ? "Spring Boot API 생성" : "Mock 생성"} · 공유는 추가 예정
                </span>
                {snapshotSummary && (
                  <div className="sync-summary" style={{ marginTop: 8 }}>
                    {snapshotSummary}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
