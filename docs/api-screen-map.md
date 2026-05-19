# ONDA 관리자 웹 화면별 API 매핑 최종안

현재 문서는 실제 API 연결 전 프론트 화면과 백엔드 endpoint 후보를 맞추기 위한 점검 결과입니다. 아직 실제 API는 연결하지 않았으며, 31차 Mock API 실패 UI와 36차 백엔드 연결 우선순위를 함께 반영했습니다.

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
| 대시보드 | `getStats()` | `GET /api/admin/dashboard` | Mock |
| 대시보드 | `getBuildings()` | `GET /api/admin/buildings` | Mock |
| 접근성 제보 | `getReports(query?)` | `GET /api/admin/reports` | Mock + query 준비 |
| 접근성 제보 | `updateReportStatus(id, status)` | `PATCH /api/admin/reports/{reportId}/status` | Mock 저장 |
| 접근성 제보 | 담당자 변경 UI | `PATCH /api/admin/reports/{reportId}/assignee` | 프론트 상태만 변경 |
| 접근성 제보 | 우선순위 변경 UI | `PATCH /api/admin/reports/{reportId}/priority` | 프론트 상태만 변경 |
| 접근성 제보 | 중복 병합 UI | `POST /api/admin/reports/merge` | Toast만 표시 |
| 도움 요청 | `getHelpRequests(query?)` | `GET /api/admin/help-requests` | Mock + query 준비 |
| 도움 요청 | `updateHelpRequestStatus(id, status)` | `PATCH /api/admin/help-requests/{requestId}/status` | Mock 저장 |
| 경험 피드 | `getStoriesForAdmin(query?)` | `GET /api/admin/stories` | Mock + query 준비 |
| 경험 피드 | `updateStoryVisibility(id, visibility)` | `PATCH /api/admin/stories/{storyId}/visibility` | Mock 저장 |
| 공공데이터 | `getPublicDataSources()` | `GET /api/admin/public-data/sources` | Mock |
| 공공데이터 | `getPublicDataComparisons()` | `GET /api/admin/public-data/comparisons` | Mock |
| 워크플로우 | `getImprovementTasks(query?)` | `GET /api/admin/improvement-tasks` | Mock + query 준비 |
| 워크플로우 | `updateImprovementTaskStage(id, stage)` | `PATCH /api/admin/improvement-tasks/{taskId}/stage` | Mock 저장 |
| 월간 리포트 | `getMonthlyReport()` | `GET /api/admin/monthly-reports/{yearMonth}` | Mock |

## 실패/에러 UI 매핑

31차에서 실제 백엔드 연결 전에도 API 실패 화면을 검증할 수 있도록 Mock 실패 시뮬레이션을 추가했습니다.

| 프론트 요소 | 역할 | 실제 백엔드 연결 시 처리 |
|---|---|---|
| `ApiError` | Mock/API 실패를 공통 에러 객체로 표현 | HTTP status, error code, message를 변환 |
| `ApiFailureBanner` | 목록 조회 실패 시 상단 안내 표시 | 실제 API 오류, 권한 오류, 네트워크 오류 표시 |
| `PageState(error)` | 데이터 영역 실패 상태 표시 | 재시도 버튼과 함께 사용 |
| 실패 Toast | 저장/상태 변경 실패 안내 | `PATCH`, `POST` 실패 시 표시 |
| `MockApiFailureScope` | `reports`, `helpRequests`, `stories`, `improvementTasks`, `all` 실패 시뮬레이션 | 운영에서는 제거하거나 개발자 도구로만 제한 |

현재 실패 시뮬레이션은 `window.localStorage`의 `onda_mock_api_failure_scope` 값을 사용합니다. 실제 API 연결 전까지는 `fetch`를 사용하지 않습니다.

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

1. `GET /api/admin/reports`
2. `PATCH /api/admin/reports/{reportId}/status`
3. `PATCH /api/admin/reports/{reportId}/assignee`
4. `PATCH /api/admin/reports/{reportId}/priority`
5. `POST /api/admin/reports/{reportId}/notes`
6. `GET /api/admin/help-requests`
7. `PATCH /api/admin/help-requests/{requestId}/status`
8. `GET /api/admin/stories`
9. `PATCH /api/admin/stories/{storyId}/visibility`
10. `GET /api/admin/improvement-tasks`
11. `PATCH /api/admin/improvement-tasks/{taskId}/stage`
12. `GET /api/admin/dashboard`

## 36차 백엔드 연결 메모

- 첫 연결은 `reports` 도메인부터 진행하는 것이 가장 좋습니다.
- URL query의 `selected`는 프론트 상세 패널 선택용이므로 서버에 보낼 필요가 없습니다.
- `status`, `q`, `stage` 등 필터 값은 서버 query parameter로 보냅니다.
- 변경성 API는 응답 후 프론트 목록을 재조회하거나, 응답 DTO로 로컬 상태를 갱신합니다.
- 모든 변경성 API는 백엔드에서 감사 로그를 남겨야 합니다.
- 장애 관련 민감정보와 위치정보가 포함될 수 있으므로 인증/인가 없이 API를 먼저 공개하면 안 됩니다.

## 주의

- `selected` query는 서버에 꼭 보낼 필요가 없습니다. 상세 패널에서 선택할 id를 프론트가 기억하기 위한 값입니다.
- 실제 저장 API를 붙이기 전까지는 화면 문구에서 `Mock`, `백엔드 붙여야 함`을 유지해야 합니다.
- 장애 관련 민감정보, 위치정보, 관리자 감사 로그는 백엔드 보안 설계 이후 연결해야 합니다.

## 23차 환경변수 후보

실제 API 연결 전까지 `.env.example`만 제공합니다.

| 환경변수 | 목적 | 현재 기본 |
|---|---|---|
| `VITE_API_BASE_URL` | Spring Boot API base URL | 비워둠 |
| `VITE_API_MODE` | `mock`/`http` 전환 후보 | `mock` |

아직 `src/services/api.ts`는 이 값을 읽지 않습니다. 실제 HTTP client를 붙이는 차수에서만 사용해야 합니다.
