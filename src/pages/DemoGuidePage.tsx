import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { ToastContext } from "../App";

const STEPS = [
  {
    title: "대시보드에서 오늘의 핵심 문제 확인",
    route: "/dashboard",
    point: "중앙도서관 5층 승강기가 최우선 개선 과제로 잡히는 이유를 보여줍니다.",
    status: "Mock 데이터",
  },
  {
    title: "공공데이터와 현장 제보 차이 확인",
    route: "/public-data",
    point: "공공데이터에는 시설이 있어도 실제 이용성 문제가 남는다는 차별점을 설명합니다.",
    status: "백엔드 붙여야 함",
  },
  {
    title: "접근성 제보 상세에서 근거 확인",
    route: "/reports",
    point: "제보 원문, 공감 수, AI 추천 조치, 공공데이터 연결 정보를 함께 확인합니다.",
    status: "Mock 데이터",
  },
  {
    title: "관리자 처리 입력 흐름 확인",
    route: "/reports",
    point: "처리 메모, 상태 변경 사유, 담당 부서, 해결 체크리스트, 첨부파일 Mock을 보여줍니다.",
    status: "백엔드 붙여야 함",
  },
  {
    title: "경험 피드에서 익명화 검수 확인",
    route: "/stories",
    point: "당사자 경험이 공개되기 전 원문 위험 표현과 공개용 변환안을 비교합니다.",
    status: "백엔드 붙여야 함",
  },
  {
    title: "관리자 권한과 개인정보 보호 정책 확인",
    route: "/settings",
    point: "센터, 시설팀, 슈퍼관리자 역할 분리와 감사 로그 필요성을 설명합니다.",
    status: "Mock 데이터",
  },
  {
    title: "백엔드 연동 준비 상태 확인",
    route: "/settings",
    point: "화면별 API 매핑표, Spring Boot 구현 체크리스트, 로딩/에러/빈 상태 설계를 보여줍니다.",
    status: "백엔드 붙여야 함",
  },
  {
    title: "개선 워크플로우로 학교 처리 과정 연결",
    route: "/workflow",
    point: "개인 제보가 센터 검토, 부서 전달, 조치 예정, 해결로 넘어가는 흐름을 보여줍니다.",
    status: "상태 변경 가능",
  },
  {
    title: "월간 리포트로 제출 근거 생성",
    route: "/monthly-report",
    point: "건물별 리포트, 고위험 미해결 항목, 개선 요청서 미리보기, PDF/CSV 내보내기 Mock을 보여줍니다.",
    status: "백엔드 붙여야 함",
  },
];

const SCRIPT_CARDS = [
  {
    label: "3분 시연",
    time: "00:00 - 03:00",
    lines: [
      "ONDA는 장애학생의 일상 제보를 학교 개선 근거로 바꾸는 관리자 플랫폼입니다.",
      "대시보드에서 반복 문제를 확인하고, 공공데이터와 실제 현장 제보의 차이를 보여줍니다.",
      "마지막으로 월간 리포트와 개선 요청서 미리보기로 학교가 조치할 수 있는 근거를 제시합니다.",
    ],
  },
  {
    label: "5분 시연",
    time: "00:00 - 05:00",
    lines: [
      "문제 배경은 캠퍼스 접근성, 관계 고립, 제도 사각지대입니다.",
      "관리자는 제보 상세에서 담당자, 우선순위, 처리 메모, 첨부파일 Mock까지 확인합니다.",
      "경험 피드는 익명화 전/후 비교를 거쳐 공개되고, 공감 데이터는 리포트로 축적됩니다.",
      "현재는 프론트 Mock이며 인증, 저장, PDF 생성, 공공데이터 동기화는 백엔드 추가 필요입니다.",
    ],
  },
];

const EVALUATION_MAP = [
  { item: "공공데이터 활용", evidence: "공공데이터 비교, 현장 제보 불일치 분석" },
  { item: "AI 활용", evidence: "AI 추천 조치, 경험 피드 익명화/검수, 리포트 반영" },
  { item: "사회문제 해결", evidence: "장애학생 이동·학습·관계 장벽을 학교 개선 근거로 전환" },
  { item: "창업/사업화", evidence: "학생 앱 무료 + 학교/센터 관리자 웹 B2G/B2B 구조" },
  { item: "ESG/공공성", evidence: "접근성 개선 우선순위, 감사 로그, 개인정보 보호 정책" },
];

const PRE_DEMO_CHECKS = [
  "dev 서버 실행: http://127.0.0.1:5173",
  "대시보드 KPI와 제보 TOP 이슈 표시 확인",
  "제보 상세 패널에서 처리 메모/담당 부서/체크리스트 확인",
  "경험 피드 익명화 전/후 비교 확인",
  "월간 리포트 PDF/CSV 버튼 Mock Toast 확인",
  "백엔드 추가 필요 문구가 실제 연동처럼 보이지 않게 표시되는지 확인",
];

const DEMO_ROUTES = [
  {
    label: "관리자 홈",
    route: "/dashboard",
    check: "오늘 처리할 일, KPI, AI 우선 조치 추천",
  },
  {
    label: "제보 상세 직접 진입",
    route: "/reports?selected=r_1",
    check: "중앙도서관 제보, 중복 후보, ConfirmModal",
  },
  {
    label: "도움 요청 직접 진입",
    route: "/help-requests?selected=h_1",
    check: "중앙도서관 2층 요청, 응답 완료 확인 모달",
  },
  {
    label: "워크플로우 필터",
    route: "/workflow?stage=reviewing",
    check: "센터 검토 단계만 표시, 단계 변경 모달",
  },
  {
    label: "경험 피드 검색",
    route: "/stories?q=조별과제",
    check: "익명화 검수 필요 사례 설명",
  },
];

const BACKEND_TODOS = [
  "인증/인가: Spring Security/JWT 또는 세션 로그인",
  "제보 저장: 상태, 담당자, 우선순위, 처리 메모 DB 저장",
  "파일 업로드: 제보 사진, 공문, 시설팀 답변서 업로드",
  "AI 결과 저장: 익명화 원문/공개본 분리 저장",
  "리포트 생성: PDF/CSV 파일 생성과 공문 번호 발급",
  "공공데이터 동기화: data.go.kr/대학알리미 API 배치 연동",
  "감사 로그: 관리자 조회/수정/내보내기 이력 저장",
];

export const DemoGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  return (
    <>
      <Topbar />
      <main className="page">
        <div className="page-h">
          <div>
            <h1>시연 가이드</h1>
            <div className="sub">
              발표 때 ONDA 관리자 웹을 어떤 순서로 보여줄지 정리한 안내 화면입니다.
            </div>
          </div>
          <div className="row-flex">
            <button
              className="h-btn"
              onClick={() => showToast("데모 리셋은 Mock 동작입니다. 실제 상태 초기화는 백엔드 추가 필요.")}
            >
              데모 리셋
            </button>
            <button className="h-btn primary" onClick={() => navigate("/dashboard")}>
              시연 시작
            </button>
          </div>
        </div>

        <div className="summary-banner">
          <span className="badge">발표 흐름</span>
          <div>
            <div className="t">
              장애학생의 제보가 공공데이터 보완, AI 분석, 학교 개선 요청으로 이어지는 흐름을 보여줍니다.
            </div>
            <div className="s">
              현재는 프론트 MVP이므로 실제 저장/공유/기관 연동은 백엔드 붙여야 함으로 표시합니다.
            </div>
          </div>
        </div>

        <div className="demo-steps">
          {STEPS.map((step, index) => (
            <div className="demo-step" key={`${step.route}-${index}`}>
              <div className="num">{index + 1}</div>
              <div>
                <div className="demo-title">{step.title}</div>
                <div className="demo-point">{step.point}</div>
              </div>
              <div className="row-flex">
                <span
                  className={
                    step.status === "백엔드 붙여야 함"
                      ? "backend-needed"
                      : "mock-pill"
                  }
                >
                  {step.status}
                </span>
                <button className="h-btn" onClick={() => navigate(step.route)}>
                  열기
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="demo-grid mt-18">
          <div className="panel">
            <div className="panel-h">
              <h3>바로 열 시연 라우트</h3>
              <span className="mock-pill">18차 QA</span>
            </div>
            <div className="route-qa-list">
              {DEMO_ROUTES.map((item) => (
                <button
                  className="route-qa-card"
                  key={item.route}
                  onClick={() => navigate(item.route)}
                >
                  <div>
                    <b>{item.label}</b>
                    <span>{item.check}</span>
                  </div>
                  <code>#{item.route}</code>
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>시연 중 말할 주의점</h3>
              <span className="backend-needed">정확성 표시</span>
            </div>
            <div className="quality-list">
              <div>
                <b>현재는 Mock 프론트입니다</b>
                <span>검색, 상태 변경, 모달, 라우팅은 동작하지만 실제 DB 저장은 아직 아닙니다.</span>
              </div>
              <div>
                <b>Spring Boot 연결 전제입니다</b>
                <span>`src/services/api.ts` 경계를 유지해 나중에 HTTP client로 교체할 수 있게 만들었습니다.</span>
              </div>
              <div>
                <b>관리자 웹의 목적</b>
                <span>학생 앱에서 쌓인 제보·공감·도움 요청을 학교 개선 근거로 전환하는 운영 화면입니다.</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>발표 멘트</h3>
              <span className="mock-pill">발표 준비용</span>
            </div>
            <div className="script-list">
              {SCRIPT_CARDS.map((card) => (
                <div className="script-card" key={card.label}>
                  <div className="row-flex" style={{ justifyContent: "space-between" }}>
                    <b>{card.label}</b>
                    <span className="small-muted">{card.time}</span>
                  </div>
                  <ol>
                    {card.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>평가 항목 매핑</h3>
              <span className="mock-pill">공모전 설명용</span>
            </div>
            <div className="eval-map">
              {EVALUATION_MAP.map((item) => (
                <div className="eval-row" key={item.item}>
                  <b>{item.item}</b>
                  <span>{item.evidence}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>발표 전 체크리스트</h3>
              <span className="mock-pill">시연 안정성</span>
            </div>
            <div className="demo-check-list">
              {PRE_DEMO_CHECKS.map((item) => (
                <label className="check-item" key={item}>
                  <input type="checkbox" defaultChecked={item.includes("백엔드") === false} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="panel backend-todo-panel">
            <div className="panel-h">
              <h3>백엔드 추가 필요</h3>
              <span className="backend-needed">아직 미구현</span>
            </div>
            <div className="backend-todo-list">
              {BACKEND_TODOS.map((item) => (
                <div className="backend-todo-item" key={item}>
                  <span>해야 함</span>
                  <b>{item}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
