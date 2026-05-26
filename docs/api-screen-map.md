# ONDA 관리자 웹 화면별 API 매핑 최종안

현재 문서는 관리자 웹 프론트 화면과 Spring Boot API 연결 상태를 맞추기 위한 점검 결과입니다. 주요 API는 연결했고, 아직 구현하지 않은 기능은 화면과 문서에서 `아직 구현 안 됨 · 추가 예정`으로 표시합니다.

## 공통 Query 규칙

| 프론트 화면 | URL query | API query 후보 |
|---|---|---|
| 접근성 제보 | `selected`, `status`, `q` | `selected`는 프론트 선택용, `status`, `query`는 서버 검색용 |
| 도움 요청 | `selected`, `status`, `q` | `selected`는 프론트 선택용, `status`, `query`는 서버 검색용 |
| 경험 피드 | `q` | `query` |
| 개선 워크플로우 | `selected`, `stage`, `q` | `selected`는 프론트 선택용, `stage`, `query`는 서버 검색용 |

## API 매핑

| 화면 | 프론트 함수 | Spring Boot endpoint 후보 | 현재 상태 |
|---|---|---|---|
| 대시보드 | `getStats()` | `GET /api/admin/dashboard/stats` | Spring Boot API 연결 |
| 대시보드 | `getBuildings()` | `GET /api/admin/buildings` | Spring Boot API 연결 |
| 접근성 제보 | `getReports(query?)` | `GET /api/admin/reports` | Spring Boot API 연결 |
| 접근성 제보 | `updateReportStatus(id, status)` | `PATCH /api/admin/reports/{reportId}/status` | Spring Boot API 저장 |
| 접근성 제보 | 담당자 변경 UI | `PATCH /api/admin/reports/{reportId}/assignee` | Spring Boot API 저장 |
| 접근성 제보 | 우선순위 변경 UI | `PATCH /api/admin/reports/{reportId}/priority` | Spring Boot API 저장 |
| 접근성 제보 | 처리 메모 | `POST /api/admin/reports/{reportId}/notes` | Spring Boot API 저장 |
| 접근성 제보 | 중복 병합 UI | `POST /api/admin/reports/merge` | 아직 구현 안 됨 · 추가 예정 |
| 도움 요청 | `getHelpRequests(query?)` | `GET /api/admin/help-requests` | Spring Boot API 연결 |
| 도움 요청 | `updateHelpRequestStatus(id, status)` | `PATCH /api/admin/help-requests/{requestId}/status` | Spring Boot API 저장 |
| 도움 요청 | 센터 판단 저장 | `PATCH /api/admin/help-requests/{requestId}/decision` | Spring Boot API 저장 |
| 경험 피드 | `getStoriesForAdmin(query?)` | `GET /api/admin/stories` | Spring Boot API 연결 |
| 경험 피드 | `updateStoryVisibility(id, visibility)` | `PATCH /api/admin/stories/{storyId}/visibility` | Spring Boot API 저장 |
| 공공데이터 | `getPublicDataSources()` | `GET /api/admin/public-data/sources` | seed API 연결 |
| 공공데이터 | `getPublicDataComparisons()` | `GET /api/admin/public-data/comparisons` | seed API 연결 |
| 공공데이터 | `getPublicDataProviderStatus()` | `GET /api/admin/public-data/provider-status` | seed/API 키 상태 연결 |
| 공공데이터 | `syncAllPublicDataSources()` | `POST /api/admin/public-data/sync/all` | 일부 data.go.kr API 연결 |
| 워크플로우 | `getImprovementTasks(query?)` | `GET /api/admin/improvement-tasks` | Spring Boot API 연결 |
| 워크플로우 | `updateImprovementTaskStage(id, stage)` | `PATCH /api/admin/improvement-tasks/{taskId}/stage` | Spring Boot API 저장 |
| 월간 리포트 | `getMonthlyReport()` | `GET /api/admin/monthly-report` | Spring Boot API 연결 |

## 실패/에러 UI 매핑

31차에서 Mock 실패 시뮬레이션을 추가했고, 이후 HTTP 모드에서는 실제 Spring Boot API 오류를 같은 UI로 표시합니다.

| 프론트 요소 | 역할 | 실제 백엔드 연결 시 처리 |
|---|---|---|
| `ApiError` | Mock/API 실패를 공통 에러 객체로 표현 | HTTP status, error code, message를 변환 |
| `ApiFailureBanner` | 목록 조회 실패 시 상단 안내 표시 | 실제 API 오류, 권한 오류, 네트워크 오류 표시 |
| `PageState(error)` | 데이터 영역 실패 상태 표시 | 재시도 버튼과 함께 사용 |
| 실패 Toast | 저장/상태 변경 실패 안내 | `PATCH`, `POST` 실패 시 표시 |
| `MockApiFailureScope` | `reports`, `helpRequests`, `stories`, `improvementTasks`, `all` 실패 시뮬레이션 | 운영에서는 제거하거나 개발자 도구로만 제한 |

Mock 모드의 실패 시뮬레이션은 `window.localStorage`의 `onda_mock_api_failure_scope` 값을 사용합니다. HTTP 모드에서는 `src/services/httpClient.ts`를 통해 실제 API를 호출하고, 실패 응답은 `ApiError`로 변환합니다.

## 백엔드 응답 형태 후보

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

실패 응답 후보:

```json
{
  "success": false,
  "data": null,
  "message": "요청을 처리할 수 없습니다.",
  "code": "REPORT_NOT_FOUND"
}
```

## 연결 우선순위

1. `GET /api/admin/stories`
2. `PATCH /api/admin/stories/{storyId}/visibility`
3. `GET /api/admin/improvement-tasks`
4. `PATCH /api/admin/improvement-tasks/{taskId}/stage`
5. `GET /api/admin/monthly-reports/{yearMonth}`
6. `POST /api/admin/monthly-reports/{yearMonth}/exports/pdf`
7. `POST /api/admin/reports/merge`
8. 파일 업로드/다운로드 API
9. 실제 공공데이터 외부 API 배치 동기화

## 36차 백엔드 연결 메모

- 1차 연결은 `reports`, `help-requests`, `dashboard`, `buildings`, `public-data seed`까지 진행했습니다.
- URL query의 `selected`는 프론트 상세 패널 선택용이므로 서버에 보낼 필요가 없습니다.
- `status`, `q`, `stage` 등 필터 값은 서버 query parameter로 보냅니다.
- 변경성 API는 응답 후 프론트 목록을 재조회하거나, 응답 DTO로 로컬 상태를 갱신합니다.
- 모든 변경성 API는 백엔드에서 감사 로그를 남겨야 합니다.
- 장애 관련 민감정보와 위치정보가 포함될 수 있으므로 인증/인가 없이 API를 먼저 공개하면 안 됩니다.

## 주의

- `selected` query는 서버에 꼭 보낼 필요가 없습니다. 상세 패널에서 선택할 id를 프론트가 기억하기 위한 값입니다.
- 연결된 기능은 화면 문구에서 `Spring Boot API`, `API 저장`으로 표시하고, 미구현 기능은 `Mock`, `아직 구현 안 됨 · 추가 예정`을 유지해야 합니다.
- 장애 관련 민감정보, 위치정보, 관리자 감사 로그는 백엔드 보안 설계 이후 연결해야 합니다.

## 23차 환경변수 후보

HTTP 모드 실행을 위해 `.env.example`만 제공합니다. 실제 `.env`와 API 키는 GitHub에 올리지 않습니다.

| 환경변수 | 목적 | 현재 기본 |
|---|---|---|
| `VITE_API_BASE_URL` | Spring Boot API base URL | 비워둠 |
| `VITE_API_MODE` | `mock`/`http` 전환 | `mock` |
| `VITE_DEMO_AUTO_LOGIN` | HTTP 모드 데모 자동 로그인 | `true` |

`src/services/api.ts`와 `src/services/httpClient.ts`가 위 값을 읽습니다. 기본은 Mock 모드이므로 `.env` 없이도 시연할 수 있습니다.
