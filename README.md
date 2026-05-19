# ONDA Admin Web

ONDA 관리자 웹은 장애대학생의 접근성 제보, 도움 요청, 경험 피드, 공공데이터 비교 결과를 학교/장애학생지원센터가 확인하고 개선 우선순위를 판단할 수 있게 만든 공모전 시연용 React 대시보드입니다.

> 현재 버전은 프론트엔드 MVP입니다. 백엔드는 아직 연결되어 있지 않으며, 모든 데이터는 Mock 데이터입니다. 실제 저장, 인증, 파일 생성, 공공데이터 동기화는 백엔드 추가 필요 항목으로 분리했습니다.

## 현재 상태

| 구분 | 상태 |
|---|---|
| 대상 | 학교/장애학생지원센터 관리자 웹 |
| 구현 범위 | React + Vite 프론트엔드 |
| 데이터 | `src/data/mockData.ts` Mock 데이터 |
| API 계층 | `src/services/api.ts`에서 Mock 반환 |
| 백엔드 | 미연동, Spring Boot API 추가 필요 |
| 배포/시연 | 로컬 또는 정적 호스팅 가능 |

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React, TypeScript, Vite |
| Routing | React Router HashRouter |
| State | React local state |
| Data Layer | Mock service layer |
| Styling | CSS |
| Backend 예정 | Spring Boot, JPA, PostgreSQL 또는 MySQL |

## 포트폴리오 관점

이 프로젝트는 단순 관리자 템플릿이 아니라, 장애학생 앱에서 발생하는 제보·공감·도움 요청·경험 피드가 학교의 개선 업무로 전환되는 흐름을 관리자 웹으로 구현한 프론트엔드 포트폴리오입니다.

| 관점 | 보여주는 역량 |
|---|---|
| 프론트엔드 구조 | 라우팅, 상세 패널, 검색/필터, URL query 상태, 로딩/빈/에러 상태 |
| 운영 UX | 담당자 배정, 우선순위 변경, 처리 이력, 확인 모달, 권한별 미리보기 |
| 백엔드 협업 | `src/services/api.ts`를 경계로 Mock과 향후 Spring Boot API를 분리 |
| 데이터 사고 | 제보, 도움 요청, 경험 피드, 공공데이터, 개선 워크플로우를 도메인별로 분리 |
| 정확성 | 실제 API 미연동 상태와 Mock 기능을 화면·문서에서 명확히 표시 |

## 내가 맡은 역할

| 역할 | 수행 내용 |
|---|---|
| 프론트엔드 구현 | 관리자 웹 전체 화면, 라우팅, 상태 UI, 상세 패널, 발표 모드 구현 |
| UI/UX 설계 | 학교/장애학생지원센터 관리자가 실제로 확인해야 할 운영 지표와 처리 흐름 설계 |
| API 전환 설계 | Mock service 구조, Query 타입, 백엔드 endpoint 후보, 화면/API 매핑 문서화 |
| QA/문서화 | 빌드 검증, 브라우저 확인, 발표자료용 캡처, README와 backend handoff 문서 정리 |

## 문제 정의

ONDA의 학생 앱이 장애학생의 경험과 제보를 모으는 서비스라면, 관리자 웹은 그 데이터를 학교가 실제 개선 업무로 처리할 수 있게 만드는 운영 도구입니다.

현재 기획의 핵심 문제는 다음과 같습니다.

- 학생의 불편 제보가 단순 게시글로 흩어지면 학교 개선 근거로 쓰기 어렵습니다.
- 도움 요청이나 경험 피드는 민감정보와 위치정보를 포함할 수 있어 관리자 검수와 권한 분리가 필요합니다.
- 공공데이터만으로는 실제 캠퍼스의 고장, 물건 적치, 일시적 접근 불가 상황을 알기 어렵습니다.
- 공모전 시연에서는 앱 기능뿐 아니라 학교가 돈을 내고 쓸 수 있는 관리자 도구가 보여야 사업화 설득력이 생깁니다.

그래서 관리자 웹은 `제보 확인 -> 우선순위 판단 -> 담당자 배정 -> 개선 과제화 -> 리포트화` 흐름을 중심으로 설계했습니다.

## 기술 선택 이유

| 선택 | 이유 |
|---|---|
| React + Vite | 공모전 MVP에서 빠르게 화면을 만들고 정적 배포하기 좋습니다. |
| TypeScript | 제보/도움 요청/피드/워크플로우 타입을 명확히 나눠 백엔드 DTO와 맞추기 쉽습니다. |
| HashRouter | 정적 호스팅 환경에서도 새로고침 라우팅 문제가 적어 시연 안정성이 좋습니다. |
| Mock service layer | 백엔드 없이도 발표 가능한 화면을 만들고, 이후 `api.ts`만 교체해 API 연결이 가능합니다. |
| CSS 기반 스타일 | 기존 디자인 톤을 유지하면서 과한 UI 프레임워크 의존성을 피했습니다. |

## 화면 미리보기

| 대시보드 | 접근성 제보 상세 |
|---|---|
| ![dashboard](docs/screenshots/dashboard.png) | ![reports](docs/screenshots/reports-selected.png) |

| 도움 요청 | 개선 워크플로우 |
|---|---|
| ![help request](docs/screenshots/help-request-selected.png) | ![workflow](docs/screenshots/workflow.png) |

| 경험 피드 검수 | 월간 리포트 |
|---|---|
| ![stories](docs/screenshots/stories-search.png) | ![monthly report](docs/screenshots/monthly-report.png) |

| 시연 가이드 | 설정/API 실패 시뮬레이션 |
|---|---|
| ![demo guide](docs/screenshots/demo-guide.png) | ![settings](docs/screenshots/settings-api-failure.png) |

## 주요 화면

| 경로 | 설명 |
|---|---|
| `#/dashboard` | 전체 KPI, 제보 밀도, AI 우선 조치 추천 |
| `#/reports` | 접근성 제보 목록, 상세 보기, 담당자/우선순위/처리 메모 Mock |
| `#/public-data` | 공공데이터와 현장 제보 비교 |
| `#/analysis` | 반복 문제 분석, AI 추천 조치 |
| `#/help-requests` | 긴급 도움 요청 목록, 상세 패널, 센터 판단, 처리 이력 |
| `#/stories` | 장애학생 경험 피드 관리, AI 익명화/검수 상태 |
| `#/workflow` | 개선 과제 처리 단계 관리 |
| `#/monthly-report` | 월간 접근성 리포트, PDF/CSV 내보내기 Mock |
| `#/demo-guide` | 공모전 발표용 시연 순서, 3분/5분 발표 멘트 |
| `#/settings` | Mock 관리자 상태, 권한 정책, API 매핑, 백엔드 체크리스트 |

## 실행 방법

```bash
npm install
npm run dev -- --host 127.0.0.1
```

로컬 실행 주소:

```text
http://127.0.0.1:5173/#/dashboard
```

## 빌드 방법

```bash
npm run build
```

## 환경변수

현재는 실제 API를 연결하지 않았기 때문에 `.env`는 필요하지 않습니다. 백엔드 연결 단계에서만 `.env.example`을 기준으로 설정합니다.

```text
VITE_API_BASE_URL=
VITE_API_MODE=mock
```

주의: 실제 `.env`, API Key, Token은 GitHub에 올리지 않습니다.

## 구현 포인트

- `src/services/api.ts`를 데이터 접근 경계로 두어 Mock에서 Spring Boot API로 교체하기 쉽게 구성했습니다.
- 제보, 도움 요청, 경험 피드, 워크플로우 화면은 URL query로 검색/필터/상세 선택 상태를 재현할 수 있습니다.
- 위험 작업 전 `ConfirmModal`을 표시해 운영 화면의 실수 방지 흐름을 반영했습니다.
- `PageState`, `OperationalStatus`, Toast tone을 통해 로딩/빈 상태/Mock 동기화/성공·경고·에러 알림을 준비했습니다.
- `ApiFailureBanner`, `ApiError`, Mock API 실패 시뮬레이션을 통해 조회 실패와 저장 실패 UI를 백엔드 연결 전에도 확인할 수 있습니다.
- 설정 화면에서 역할별 권한 미리보기와 권한 제한 액션 샘플을 제공하되, 실제 인가는 백엔드 추가 필요로 명확히 표시했습니다.
- 접근성 제보, 도움 요청, 개선 워크플로우 상세 패널은 닫기/고정과 URL 직접 진입을 지원해 발표 중 특정 사례를 바로 보여줄 수 있습니다.
- 상단 권한 미리보기와 발표 모드 토글을 추가해 센터/시설팀/슈퍼관리자 관점과 시연 전용 화면 정리를 빠르게 전환할 수 있습니다.

## 발표 시연 흐름

1. `#/dashboard`에서 오늘의 우선 개선 과제와 핵심 KPI를 보여줍니다.
2. `#/public-data`에서 공공데이터와 실제 현장 제보의 차이를 보여줍니다.
3. `#/reports`에서 제보 상세, 담당자 배정, 우선순위 변경, 개선 요청서 초안을 보여줍니다.
4. `#/help-requests`에서 긴급 도움 요청과 센터 판단 흐름을 보여줍니다.
5. `#/stories`에서 AI 익명화/검수 상태와 원문/공개본 비교를 보여줍니다.
6. `#/workflow`에서 제보가 개선 과제로 넘어가는 운영 흐름을 보여줍니다.
7. `#/monthly-report`에서 건물별 리포트와 시설팀 제출용 요약을 보여줍니다.
8. `#/settings`에서 어떤 기능이 Mock이고 어떤 기능이 백엔드 추가 필요인지 설명합니다.
9. `#/demo-guide`에서 발표 멘트와 평가 항목 매핑을 확인합니다.

## Mock 범위와 백엔드 추가 필요

| 기능 | 현재 상태 | 실제 서비스에서 필요한 작업 |
|---|---|---|
| 관리자 로그인 | Mock 표시 | Spring Security/JWT 또는 세션 로그인 |
| 역할별 권한 | Mock 정책표 | API 인가, 메뉴 접근 제어 |
| 접근성 제보 목록 | Mock 데이터 | 제보 CRUD API, DB 저장 |
| 담당자/우선순위 변경 | 프론트 상태 변경 | 담당자 배정 API, 변경 이력 저장 |
| 처리 메모/상태 변경 사유 | Mock 입력 UI | 처리 로그 저장 API |
| 첨부파일 | Mock 파일 카드 | 파일 업로드, 바이러스/확장자 검증 |
| 도움 요청 | Mock 데이터 | 위치 기반 요청/응답 API |
| 경험 피드 | Mock 데이터 | 원문/공개본 분리 저장, 신고/검수 API |
| AI 익명화 | Mock 결과 | LLM API 호출, 민감정보 탐지, 검수 저장 |
| 공공데이터 비교 | Mock 비교 결과 | data.go.kr 등 외부 API 배치 동기화 |
| 월간 리포트 | Mock 화면 | PDF/CSV 생성, 리포트 스냅샷 저장 |
| 감사 로그 | Mock 화면 | 관리자 조회/수정/내보내기 이력 저장 |

## 데이터 연동 구조

현재 구조:

```text
src/data/mockData.ts -> src/services/api.ts -> src/pages/*
```

백엔드 연동 후 예상 구조:

```text
Spring Boot API -> src/services/api.ts -> src/pages/*
```

프론트 화면은 `src/services/api.ts`를 통해 데이터를 받도록 분리되어 있어, 이후 Spring Boot API 연결 시 페이지 전체를 갈아엎기보다 서비스 계층부터 교체하는 방식이 적합합니다.

## 백엔드 연결 대비 구조

백엔드 연결은 화면을 다시 만드는 작업이 아니라, Mock service를 Spring Boot API client로 바꾸는 작업으로 잡았습니다.

| 전환 지점 | 현재 | 백엔드 연결 후 |
|---|---|---|
| 데이터 조회 | `mockData.ts` 배열 필터링 | `GET /api/admin/*` 호출 |
| 상태 변경 | 프론트 메모리 업데이트 | `PATCH` 요청 후 응답 반영 |
| 실패 처리 | Mock API 실패 시뮬레이션 | 실제 HTTP 에러를 `ApiError`로 변환 |
| 검색/필터 | URL query + Mock 필터 | URL query + 서버 query parameter |
| 권한 | UI 미리보기 | Spring Security 인가 + 메뉴/버튼 제한 |
| 감사 로그 | Mock timeline | DB 저장 감사 로그 |

백엔드 1차에서는 `GET /api/admin/reports`와 `PATCH /api/admin/reports/{reportId}/status`부터 붙이는 것이 가장 효과적입니다. 이 두 API만 연결해도 관리자 웹이 Mock 화면에서 실제 운영 데이터 화면으로 전환되는 첫 흐름을 보여줄 수 있습니다.

## 한계와 다음 개선 방향

| 구분 | 현재 한계 | 다음 개선 |
|---|---|---|
| 데이터 | 모든 수치와 목록은 Mock | Spring Boot + DB 연결 |
| 인증/인가 | 역할 미리보기만 제공 | 관리자 로그인, JWT/세션, API 인가 |
| 저장 | 새로고침 시 변경 내용 유지 안 됨 | 상태 변경, 메모, 담당자, 우선순위 DB 저장 |
| AI | 익명화/추천 결과는 Mock | LLM API 연동 전 보안 리뷰 후 실제 연결 |
| 공공데이터 | 비교 결과는 샘플 | data.go.kr 등 배치 수집과 갱신 시각 저장 |
| 리포트 | PDF/CSV 버튼은 Mock Toast | 백엔드 리포트 생성과 파일 다운로드 |
| 개인정보 | 실제 데이터 없음 | 장애 관련 민감정보, 위치정보 보관 정책 필요 |

## 문서

| 문서 | 내용 |
|---|---|
| [`docs/api-plan.md`](docs/api-plan.md) | 화면별 API 연동 계획 |
| [`docs/backend-todo.md`](docs/backend-todo.md) | 백엔드 추가 필요 목록 |
| [`docs/backend-design.md`](docs/backend-design.md) | Spring Boot 백엔드 설계 초안 |
| [`docs/api-screen-map.md`](docs/api-screen-map.md) | 화면별 API endpoint 매핑 최종안 |
| [`docs/frontend-handoff.md`](docs/frontend-handoff.md) | 프론트 최종 인계와 백엔드 연결 전 확인 |
| [`docs/demo-assets.md`](docs/demo-assets.md) | 발표자료용 캡처와 설명 |
| [`docs/demo-script.md`](docs/demo-script.md) | 발표 시연 스크립트 |
| [`docs/qa-checklist.md`](docs/qa-checklist.md) | 빌드/브라우저/보안 QA 체크리스트 |

## 개발 이력 요약

| 차수 | 내용 |
|---|---|
| 1차 | 관리자 웹 기본 화면 점검 |
| 2차 | 공공데이터 비교, AI 우선순위, 개선 워크플로우 보강 |
| 3차 | UI/UX 정리, 반응형, 발표 흐름 정리 |
| 4차 | 빌드/브라우저 검증 |
| 5차 | 관리자 웹 추가 운영 화면 보강 |
| 6차 | 도움 요청 상세, 제보 개선 요청서, AI 익명화/검수, 처리 이력 |
| 7차 | 검색/필터/담당자/우선순위 운영 기능 |
| 8차 | 권한/보안/민감정보 운영 화면 |
| 9차 | 월간 리포트, 공문, 내보내기 Mock |
| 10차 | 백엔드 연동 준비 화면 |
| 11차 | 처리 메모, 사유, 부서, 체크리스트, 첨부파일 Mock |
| 12차 | 최종 발표 시연 모드 |
| 13차 | README, API 계획, 백엔드 TODO, QA 체크리스트 문서화 |
| 14차 | 프론트 API 전환 준비 타입/Query 구조 보강 |
| 15차 | 관리자 운영 UX, 확인 모달, 오늘 처리할 일, 중복 제보 후보 보강 |
| 16차 | 로딩/빈 상태, Mock 재시도, 동기화 상태, 권한 제한 샘플 보강 |
| 17차 | 검색/필터 URL query 동기화, Mock service query 호출 구조 보강 |
| 18차 | 발표 시연 라우트, 시연 QA, 정확성 안내 문구 보강 |
| 19차 | GitHub 업로드 전 보안/빌드 확인 및 커밋/푸시 |
| 20차 | 화면별 API endpoint 매핑 최종 문서화 |
| 21차 | 백엔드 연결 전 프론트 인계 문서 작성 |
| 22차 | 발표자료용 시연 캡처/설명 문서 정리 |
| 23차 | `.env.example`, Toast 타입, NotFound/권한 없음 페이지 추가 |
| 24차 | 제보 표 정렬 UI, 권한별 미리보기 토글 추가 |
| 25차 | README 스크린샷, 환경변수, 구현 포인트 보강 |
| 26차 | 상세 패널 닫기/고정, 도움 요청·워크플로우 정렬, Skeleton 로딩 보강 |
| 27차 | 상단 권한 미리보기, 권한별 메뉴 숨김 Mock, 접근성용 aria 라벨 보강 |
| 28차 | 발표 모드 토글, 로컬/정적 시연 상태 문서화, 최종 QA 체크 항목 보강 |
| 29차 | 필터 초기화 통일, 상세 선택 번호, 이전/다음 상세 이동 UX 보강 |
| 30차 | 공통 관리자 액션 로그, 검수/공개/워크플로우 처리 이력 Mock 보강 |
| 31차 | API 실패 배너, 조회 실패 상태, 저장 실패 Toast, Mock 실패 시뮬레이션 보강 |
| 32차 | 발표 모드 화면 밀도 정리, 시연 가이드 실제 클릭 순서 보강 |
| 33차 | 최종 빌드/브라우저/보안 QA 및 GitHub 업로드 상태 확인 |
| 34차 | README 포트폴리오 관점, 역할, 문제 정의, 기술 선택 이유 정리 |
| 35차 | 발표자료용 화면 캡처 최신화, 월간 리포트/설정 화면 캡처 추가 |
| 36차 | 백엔드 연결 TODO/API 우선순위 최종 정리 |

## 업로드 전 주의사항

- `node_modules/`는 GitHub에 올리지 않습니다.
- `dist/`는 별도 요청이 없으면 올리지 않습니다.
- `.env`, API Key, Token, 개인정보는 포함하지 않습니다.
- 현재 화면은 Mock 데이터 기반이며 실제 학교 시스템과 연동된 상태가 아닙니다.
- README와 화면 문구에서 실제 API가 연결된 것처럼 표현하지 않습니다.
