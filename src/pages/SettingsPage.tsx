import React, { useContext, useEffect, useState } from "react";
import { Topbar } from "../components/Topbar";
import { ToastContext } from "../App";
import {
  getModeLabel,
  getMockApiFailureScope,
  getAuditLogs,
  downloadAuditLogsCsv,
  isHttpMode,
  setMockApiFailureScope,
  type MockApiFailureScope,
} from "../services/api";
import { getApiBaseUrl } from "../services/httpClient";

const ROLE_POLICIES = [
  {
    role: "장애학생지원센터",
    access: "제보 확인, 도움 요청 처리, 경험 피드 검수",
    limit: "시설 예산 확정, 전체 관리자 권한 변경 불가",
  },
  {
    role: "시설관리팀",
    access: "시설 제보 확인, 조치 상태 변경, 개선 일정 입력",
    limit: "경험 피드 원문과 민감정보 검수 화면 접근 제한",
  },
  {
    role: "슈퍼관리자",
    access: "전체 메뉴, 역할 정책, API 연동 설정",
    limit: "운영 로그와 개인정보 접근 사유 기록 필요",
  },
];

const ACTIVITY_LOGS = [
  "00:38 박주연 · 중앙도서관 제보 담당자 배정 변경",
  "00:35 박주연 · 경험 피드 익명화 재검수 요청",
  "00:31 김도현 · 공학관 강의실 제보 조치 예정으로 변경",
  "00:22 이수민 · 도움 요청 센터 확인 필요 상태 확인",
];

const PRIVACY_RULES = [
  {
    title: "민감정보 최소 표시",
    body: "장애유형, 학과, 교수명, 구체 시간표 등 특정 가능한 정보는 기본적으로 가립니다.",
  },
  {
    title: "위치정보 보존 제한",
    body: "도움 요청 위치는 운영 처리 목적에만 사용하고 장기 보관은 백엔드 정책 설계가 필요합니다.",
  },
  {
    title: "역할 기반 접근",
    body: "시설팀은 시설 개선에 필요한 요약 데이터만 보고, 원문 검수는 센터 권한으로 분리합니다.",
  },
];

const API_MAPPINGS = [
  {
    screen: "대시보드",
    endpoint: "GET /api/admin/dashboard/stats · GET /api/admin/buildings",
    purpose: "KPI, 건물 목록, 제보 밀도 표시",
    status: "연결 완료",
  },
  {
    screen: "접근성 제보",
    endpoint: "GET /api/admin/reports · PATCH /api/admin/reports/{id} · POST /notes",
    purpose: "제보 목록, 상태, 담당자, 우선순위, 처리 메모 저장",
    status: "부분 연결",
  },
  {
    screen: "도움 요청",
    endpoint: "GET /api/admin/help-requests · PATCH /status · PATCH /decision",
    purpose: "도움 요청 조회, 센터 판단, 처리 상태 저장",
    status: "부분 연결",
  },
  {
    screen: "경험 피드",
    endpoint: "GET /api/admin/stories · PATCH /api/admin/stories/{id}/visibility",
    purpose: "공개 범위, 익명화 검수, 리포트 반영",
    status: "부분 연결",
  },
  {
    screen: "공공데이터 비교",
    endpoint: "GET /api/admin/public-data/sources · /comparisons · /provider-status",
    purpose: "seed 데이터 기반 공공데이터와 현장 제보 불일치 분석",
    status: "부분 연결",
  },
  {
    screen: "월간 리포트",
    endpoint: "GET /api/admin/monthly-report · GET /api/admin/monthly-report/export/csv|pdf",
    purpose: "리포트 조회, CSV/PDF 다운로드, 스냅샷 이력 저장",
    status: "부분 연결",
  },
  {
    screen: "권한/감사 로그",
    endpoint: "GET /api/admin/audit-logs · GET /api/admin/me",
    purpose: "관리자 역할, 접근 로그, 처리 이력 저장",
    status: "부분 연결",
  },
];

const BACKEND_CHECKLIST = [
  { item: "관리자 로그인/내 정보 조회", status: "완료" },
  { item: "제보 목록/상태/담당자/우선순위/처리 메모 API", status: "부분 완료" },
  { item: "도움 요청 목록/상태/센터 판단 API", status: "부분 완료" },
  { item: "경험 피드 목록/공개 상태 변경 API", status: "부분 완료" },
  { item: "개선 워크플로우 목록/단계 변경 API", status: "부분 완료" },
  { item: "월간 리포트 조회 API", status: "부분 완료" },
  { item: "공공데이터 seed 조회 + data.go.kr 샘플 동기화 API", status: "부분 완료" },
  { item: "운영 DB 영속화: 로컬 H2 파일 DB", status: "부분 완료" },
  { item: "운영 DB 전환: DB_URL/DB_DRIVER/JPA_DDL_AUTO 환경변수 전환", status: "부분 완료" },
  { item: "경험 피드: 원문/공개본 분리 저장과 익명화 검수 이력", status: "부분 완료" },
  { item: "리포트: PDF/CSV 생성, 스냅샷 저장", status: "부분 완료" },
  { item: "파일 업로드: 제보 사진, 공문, 시설팀 답변서", status: "부분 완료" },
  { item: "공공데이터: 전체 데이터셋 정기 배치/필드 정규화", status: "부분 완료" },
  { item: "운영 인증: refresh token/session 만료 정책", status: "아직 구현 안 됨 · 추가 예정" },
];

const API_TRANSITION_CHECKS = [
  {
    title: "Query parameter 유지",
    body: "제보, 도움 요청, 경험 피드, 워크플로우 검색/필터가 URL query와 연결되어 새로고침·공유 시 상태를 재현할 수 있습니다.",
  },
  {
    title: "Mock service 경계 유지",
    body: "`src/services/api.ts` 함수명과 타입을 유지하고, 실제 fetch는 백엔드 연결 단계에서만 교체합니다.",
  },
  {
    title: "실패/빈 상태 UI",
    body: "목록 0건, 로딩 중, 재시도 버튼을 공통 컴포넌트로 표시해 API 실패 대응 화면을 미리 준비했습니다.",
  },
];

const DEMO_QA_CHECKS = [
  "대시보드 오늘 처리할 일에서 관련 페이지로 이동 가능",
  "제보 상세 URL: #/reports?selected=r_1 직접 진입 가능",
  "도움 요청 URL: #/help-requests?selected=h_1 직접 진입 가능",
  "워크플로우 단계 변경 전 ConfirmModal 표시",
  "Mock/백엔드 필요 문구가 실제 연동처럼 보이지 않음",
];

const LOCKED_ACTIONS = [
  {
    role: "시설관리팀",
    action: "경험 피드 원문 열람",
    reason: "민감정보 검수는 장애학생지원센터 권한에서만 처리",
  },
  {
    role: "장애학생지원센터",
    action: "예산 확정 처리",
    reason: "시설 예산 확정은 시설관리팀/학교 행정 권한 필요",
  },
  {
    role: "일반 관리자",
    action: "PDF 공식 발송",
    reason: "공문 번호 발급과 외부 전송은 백엔드 감사 로그 필요",
  },
];

const STATE_SAMPLES = [
  {
    title: "로딩 중",
    status: "loading",
    body: "표와 카드에는 skeleton 또는 '데이터를 불러오는 중입니다' 상태를 표시합니다.",
  },
  {
    title: "API 실패",
    status: "error",
    body: "서버 연결 실패 시 재시도 버튼과 Mock/운영 모드 구분 문구를 표시합니다.",
  },
  {
    title: "데이터 없음",
    status: "empty",
    body: "검색 결과 0건, 제보 없음, 리포트 없음 상태를 빈 화면으로 처리합니다.",
  },
  {
    title: "권한 없음",
    status: "denied",
    body: "시설팀 등 제한 역할은 민감 원문 대신 요약 데이터만 볼 수 있게 합니다.",
  },
];

const API_FAILURE_SCOPES: { key: MockApiFailureScope; label: string; desc: string }[] = [
  { key: "off", label: "정상", desc: "Mock API를 정상 응답으로 유지" },
  { key: "reports", label: "제보 실패", desc: "접근성 제보 조회/저장 실패 UI 확인" },
  { key: "helpRequests", label: "도움 실패", desc: "도움 요청 API 실패 UI 확인" },
  { key: "stories", label: "피드 실패", desc: "경험 피드 검수 API 실패 UI 확인" },
  { key: "improvementTasks", label: "워크플로우 실패", desc: "개선 과제 API 실패 UI 확인" },
  { key: "all", label: "전체 실패", desc: "주요 운영 API 전체 실패 상태 확인" },
];

function featureStatusClass(status: string) {
  if (status === "완료" || status === "연결 완료") return "status done";
  if (status === "부분 완료" || status === "부분 연결") return "backend-needed";
  if (status.includes("아직 구현 안 됨")) return "planned-pill";
  return "mock-pill";
}

export const SettingsPage: React.FC = () => {
  const { showToast } = useContext(ToastContext);
  const [previewRole, setPreviewRole] = useState(ROLE_POLICIES[0].role);
  const [failureScope, setFailureScope] = useState<MockApiFailureScope>(
    getMockApiFailureScope()
  );
  const [auditLogs, setAuditLogs] = useState<string[]>(ACTIVITY_LOGS);
  const currentPolicy = ROLE_POLICIES.find((item) => item.role === previewRole) ?? ROLE_POLICIES[0];

  const changeFailureScope = (scope: MockApiFailureScope) => {
    setMockApiFailureScope(scope);
    setFailureScope(scope);
    showToast(
      scope === "off"
        ? "Mock API 실패 시뮬레이션을 해제했습니다."
        : "Mock API 실패 시뮬레이션을 켰습니다. 대상 화면에서 재시도/에러 UI를 확인하세요.",
      scope === "off" ? "success" : "warning"
    );
  };

  useEffect(() => {
    getAuditLogs()
      .then((logs) => {
        if (logs.length > 0) {
          setAuditLogs(
            logs.slice(0, 6).map((log) =>
              `${log.createdAt.slice(11, 16)} ${log.adminName} · ${log.action} · ${log.detail ?? ""}`
            )
          );
        }
      })
      .catch(() => setAuditLogs(ACTIVITY_LOGS));
  }, []);

  const exportAuditLogs = async () => {
    try {
      const result = await downloadAuditLogsCsv();
      downloadBlob(result.blob, result.filename);
      showToast("감사 로그 CSV를 다운로드했습니다.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "감사 로그 다운로드에 실패했습니다.", "error");
    }
  };

  return (
    <>
      <Topbar />
      <main className="page">
        <div className="page-h">
          <div>
            <h1>설정</h1>
            <div className="sub">
              현재 API 모드: {getModeLabel()} · 저장 기능은 연결 범위에 따라 다르게 동작합니다.
            </div>
          </div>
        </div>

        <div className="summary-banner">
          <span className="badge">운영/연동</span>
          <div>
            <div className="t">
              {isHttpMode()
                ? "Spring Boot API 연결 모드입니다. 로그인, 제보, 도움 요청, 경험 피드, 개선 과제, 월간 리포트, 공공데이터 조회는 실제 API를 호출합니다."
                : "현재는 Mock 관리자 세션입니다. 실제 로그인, 권한 검증, API 저장, 감사 로그 저장은 아직 구현 안 됨 · 추가 예정."}
            </div>
            <div className="s">
              API Base URL: {getApiBaseUrl()} · `src/services/api.ts`를 연동 경계로 유지합니다.
            </div>
          </div>
        </div>

        <div className="settings-grid">
          <div className="panel">
            <div className="panel-h">
              <h3>관리자 로그인 상태</h3>
              <span className={isHttpMode() ? "status done" : "backend-needed"}>
                {isHttpMode() ? "API 인증 사용" : "인증은 아직 구현 안 됨 · 추가 예정"}
              </span>
            </div>
            <div className="settings-list">
              <div>
                <span>학교명</span>
                <b>ONDA 대학교</b>
              </div>
              <div>
                <span>관리 조직</span>
                <b>장애학생지원센터</b>
              </div>
              <div>
                <span>담당자</span>
                <b>박주연</b>
              </div>
              <div>
                <span>현재 역할</span>
                <b>장애학생지원센터</b>
              </div>
              <div>
                <span>세션 상태</span>
                <b>{isHttpMode() ? "Bearer token 기반 API 세션" : "Mock 로그인 유지 중"}</b>
              </div>
              <div>
                <span>기본 분석 기간</span>
                <b>최근 7일</b>
              </div>
            </div>
            <div className="row-flex mt-14">
              <button
                className="h-btn"
                onClick={() => showToast("역할 전환은 Mock 동작입니다. 실제 권한 저장은 아직 구현 안 됨 · 추가 예정.")}
              >
                역할 전환
              </button>
              <button
                className="h-btn"
                onClick={() =>
                  showToast(
                    isHttpMode()
                      ? "상단 로그아웃 버튼을 누르면 로컬 토큰을 제거하고 로그인 화면으로 이동합니다."
                      : "로그아웃은 Mock 동작입니다. 실제 세션 처리는 아직 구현 안 됨 · 추가 예정."
                  )
                }
              >
                로그아웃
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>API 연동 상태</h3>
              <span className={isHttpMode() ? "status done" : "backend-needed"}>
                {isHttpMode() ? "주요 API 연결됨" : "아직 구현 안 됨 · 추가 예정"}
              </span>
            </div>
            <div className="settings-list">
              <div>
                <span>API Base URL</span>
                <b>{isHttpMode() ? getApiBaseUrl() : "미연결"}</b>
              </div>
              <div>
                <span>현재 모드</span>
                <b>{getModeLabel()}</b>
              </div>
              <div>
                <span>인증 방식</span>
                <b>{isHttpMode() ? "Bearer token + Spring Boot 세션" : "추후 Spring Security/JWT 검토"}</b>
              </div>
              <div>
                <span>마지막 동기화</span>
                <b>{getModeLabel()} 기준 · 2026.05.19 00:00</b>
              </div>
              <div>
                <span>데이터 저장</span>
                <b>{isHttpMode() ? "로컬 H2 DB 기준 API 저장" : "현재 브라우저 상태 + Mock API"}</b>
              </div>
              <div>
                <span>공공데이터 동기화</span>
                <b>{isHttpMode() ? "data.go.kr 샘플 동기화 가능 · 전체 배치는 추가 예정" : "백엔드 배치/API 연동 필요"}</b>
              </div>
            </div>
            <div className="row-flex mt-14">
              <button
                className="h-btn"
                onClick={() =>
                  showToast(
                    isHttpMode()
                      ? "상단/목록의 다시 불러오기 버튼으로 실제 API를 재호출합니다."
                      : "API 재시도는 Mock 동작입니다. 실제 호출은 아직 구현 안 됨 · 추가 예정."
                  )
                }
              >
                API 재시도
              </button>
              <button
                className="h-btn"
                onClick={() => showToast("동기화 로그 조회는 Mock 동작입니다. 실제 로그 저장은 아직 구현 안 됨 · 추가 예정.")}
              >
                동기화 로그
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>화면별 API 매핑표</h3>
              <span className={isHttpMode() ? "status done" : "backend-needed"}>
                {isHttpMode() ? "일부 API 연결됨" : "API 연결은 아직 구현 안 됨 · 추가 예정"}
              </span>
            </div>
            <div className="api-map-list">
              {API_MAPPINGS.map((item) => (
                <div className="api-map-row" key={item.screen}>
                  <div>
                    <div className="api-screen">{item.screen}</div>
                    <div className="api-purpose">{item.purpose}</div>
                  </div>
                  <code>{item.endpoint}</code>
                  <span className={featureStatusClass(item.status)}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>백엔드 구현 체크리스트</h3>
              <span className="mock-pill">Spring Boot 연동 준비</span>
            </div>
            <div className="backend-check-grid">
              {BACKEND_CHECKLIST.map((item) => (
                <div className="backend-check-item" key={item.item}>
                  <span>{item.status === "완료" ? "✓" : item.status === "부분 완료" ? "◐" : "□"}</span>
                  <b>{item.item}</b>
                  <em className={featureStatusClass(item.status)}>{item.status}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>API 전환 준비 체크</h3>
              <span className="mock-pill">17차 보강</span>
            </div>
            <div className="quality-list">
              {API_TRANSITION_CHECKS.map((item) => (
                <div key={item.title}>
                  <b>{item.title}</b>
                  <span>{item.body}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>발표 시연 QA</h3>
              <span className="mock-pill">18차 보강</span>
            </div>
            <div className="demo-check-list">
              {DEMO_QA_CHECKS.map((item) => (
                <label className="check-item" key={item}>
                  <input type="checkbox" defaultChecked />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>로딩/에러/빈 상태 샘플</h3>
              <span className="mock-pill">31차 API 실패 UI</span>
            </div>
            <div className="state-sample-grid">
              {STATE_SAMPLES.map((item) => (
                <div className={`state-sample-card ${item.status}`} key={item.title}>
                  <div className="state-sample-title">{item.title}</div>
                  <div className="state-sample-body">{item.body}</div>
                </div>
              ))}
            </div>
            <div className="api-failure-lab mt-14">
              <div>
                <div className="field-l">Mock API 실패 시뮬레이션</div>
                <b>현재 모드: {API_FAILURE_SCOPES.find((item) => item.key === failureScope)?.label}</b>
                <p>
                  HTTP 모드에서는 실제 Spring Boot API 오류를 표시하고, Mock 모드에서는 같은 UI를
                  실패 시뮬레이션으로 확인합니다.
                </p>
              </div>
              <div className="seg-control">
                {API_FAILURE_SCOPES.map((item) => (
                  <button
                    key={item.key}
                    className={failureScope === item.key ? "on" : ""}
                    onClick={() => changeFailureScope(item.key)}
                    title={item.desc}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <span className="backend-needed">
                실제 서버 오류 응답 코드는 Spring Boot 예외 응답 표준화 필요
              </span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>역할별 접근 정책</h3>
              <span className="mock-pill">Mock 권한표</span>
            </div>
            <div className="seg-control" style={{ marginBottom: 12 }}>
              {ROLE_POLICIES.map((item) => (
                <button
                  key={item.role}
                  className={previewRole === item.role ? "on" : ""}
                  onClick={() => {
                    setPreviewRole(item.role);
                  showToast(`${item.role} 권한 미리보기입니다. 실제 인가는 아직 구현 안 됨 · 추가 예정입니다.`, "warning");
                  }}
                >
                  {item.role}
                </button>
              ))}
            </div>
            <div className="role-preview-card">
              <div>
                <span className="field-l">현재 미리보기 역할</span>
                <b>{currentPolicy.role}</b>
              </div>
              <div>
                <span className="field-l">허용</span>
                <p>{currentPolicy.access}</p>
              </div>
              <div>
                <span className="field-l">제한</span>
                <p>{currentPolicy.limit}</p>
              </div>
            </div>
            <div className="role-grid">
              {ROLE_POLICIES.map((item) => (
                <div className="role-card" key={item.role}>
                  <div className="role-name">{item.role}</div>
                  <div className="field-l">허용 메뉴</div>
                  <div className="role-text">{item.access}</div>
                  <div className="field-l mt-10">제한</div>
                  <div className="role-text">{item.limit}</div>
                </div>
              ))}
            </div>
            <div className="small-muted mt-10">
              실제 메뉴 제한과 API 인가는 Spring Security/JWT 권한 검증으로 연결해야 합니다.
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>권한 제한 액션 샘플</h3>
              <span className="planned-pill">아직 구현 안 됨 · 추가 예정</span>
            </div>
            <div className="locked-action-list">
              {LOCKED_ACTIONS.map((item) => (
                <div className="locked-action-card" key={`${item.role}-${item.action}`}>
                  <div>
                    <b>{item.action}</b>
                    <span>{item.role} · {item.reason}</span>
                  </div>
                  <button
                    className="h-btn"
                    disabled
                    title="실제 권한 검사는 아직 구현 안 됨 · 추가 예정"
                  >
                    권한 필요
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>개인정보/위치정보 보호 정책</h3>
              <span className="planned-pill">아직 구현 안 됨 · 추가 예정</span>
            </div>
            <div className="privacy-grid">
              {PRIVACY_RULES.map((rule) => (
                <div className="privacy-card" key={rule.title}>
                  <b>{rule.title}</b>
                  <span>{rule.body}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>관리자 활동 로그</h3>
              <span className="status done">조회/CSV 내보내기 연결</span>
            </div>
            <button className="h-btn" onClick={exportAuditLogs} style={{ marginBottom: 12 }}>
              감사 로그 CSV 내보내기
            </button>
            <div className="audit-list">
              {auditLogs.map((log) => (
                <div className="audit-item" key={log}>{log}</div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>GitHub 업로드 전 표시 정책</h3>
            </div>
            <div className="quality-list">
              <div>
                <b>Mock은 Mock으로 표시</b>
                <span>실제 API와 연결되지 않은 기능은 화면과 README에서 구분합니다.</span>
              </div>
              <div>
                <b>민감 정보 제외</b>
                <span>.env, Token, API Key, node_modules, dist는 업로드 대상에서 제외합니다.</span>
              </div>
              <div>
                <b>추가 예정은 추가 예정으로 표시</b>
                <span>외부 전송, 유료 AI API, 운영 DB 실연결은 승인 전까지 추가 예정으로 표시합니다.</span>
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
