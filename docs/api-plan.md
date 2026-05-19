# ONDA 관리자 웹 API 연동 계획

현재 관리자 웹은 Mock 데이터 기반입니다. 아래 API는 Spring Boot 백엔드 추가 시 연결할 후보이며, 실제 엔드포인트명은 백엔드 설계 과정에서 조정할 수 있습니다.

## 공통 원칙

- 관리자 웹은 `src/services/api.ts`를 통해서만 데이터를 가져오도록 유지합니다.
- 페이지 컴포넌트에서 `fetch`를 직접 호출하지 않습니다.
- 모든 변경성 작업은 감사 로그를 남길 수 있게 설계해야 합니다.
- 실제 운영에서는 인증/인가가 먼저 붙어야 합니다.

## 화면별 API 후보

| 화면 | 기능 | Method | Endpoint 후보 | 상태 |
|---|---|---:|---|---|
| 대시보드 | KPI 조회 | GET | `/api/admin/dashboard` | 백엔드 추가 필요 |
| 대시보드 | AI 우선 조치 추천 | GET | `/api/admin/recommendations` | 백엔드 추가 필요 |
| 접근성 제보 | 제보 목록 | GET | `/api/admin/reports` | 백엔드 추가 필요 |
| 접근성 제보 | 제보 상세 | GET | `/api/admin/reports/{reportId}` | 백엔드 추가 필요 |
| 접근성 제보 | 상태 변경 | PATCH | `/api/admin/reports/{reportId}/status` | 백엔드 추가 필요 |
| 접근성 제보 | 담당자 배정 | PATCH | `/api/admin/reports/{reportId}/assignee` | 백엔드 추가 필요 |
| 접근성 제보 | 우선순위 변경 | PATCH | `/api/admin/reports/{reportId}/priority` | 백엔드 추가 필요 |
| 접근성 제보 | 처리 메모 저장 | POST | `/api/admin/reports/{reportId}/notes` | 백엔드 추가 필요 |
| 접근성 제보 | 첨부파일 업로드 | POST | `/api/admin/reports/{reportId}/attachments` | 백엔드 추가 필요 |
| 공공데이터 | 데이터 출처 목록 | GET | `/api/admin/public-data/sources` | 백엔드 추가 필요 |
| 공공데이터 | 현장 제보 비교 | GET | `/api/admin/public-data/comparisons` | 백엔드 추가 필요 |
| 반복 분석 | 반복 문제 목록 | GET | `/api/admin/analysis/repeated-issues` | 백엔드 추가 필요 |
| 도움 요청 | 도움 요청 목록 | GET | `/api/admin/help-requests` | 백엔드 추가 필요 |
| 도움 요청 | 도움 요청 상세 | GET | `/api/admin/help-requests/{requestId}` | 백엔드 추가 필요 |
| 도움 요청 | 센터 판단 저장 | PATCH | `/api/admin/help-requests/{requestId}/decision` | 백엔드 추가 필요 |
| 경험 피드 | 피드 목록 | GET | `/api/admin/stories` | 백엔드 추가 필요 |
| 경험 피드 | 공개 상태 변경 | PATCH | `/api/admin/stories/{storyId}/visibility` | 백엔드 추가 필요 |
| 경험 피드 | AI 익명화 요청 | POST | `/api/admin/stories/{storyId}/anonymize` | 백엔드 추가 필요 |
| 워크플로우 | 개선 과제 목록 | GET | `/api/admin/improvement-tasks` | 백엔드 추가 필요 |
| 워크플로우 | 개선 단계 변경 | PATCH | `/api/admin/improvement-tasks/{taskId}/stage` | 백엔드 추가 필요 |
| 월간 리포트 | 월간 리포트 조회 | GET | `/api/admin/monthly-reports/{month}` | 백엔드 추가 필요 |
| 월간 리포트 | PDF 생성 | POST | `/api/admin/monthly-reports/{month}/exports/pdf` | 백엔드 추가 필요 |
| 월간 리포트 | CSV 생성 | POST | `/api/admin/monthly-reports/{month}/exports/csv` | 백엔드 추가 필요 |
| 설정 | 관리자 프로필 | GET | `/api/admin/me` | 백엔드 추가 필요 |
| 설정 | 감사 로그 | GET | `/api/admin/audit-logs` | 백엔드 추가 필요 |

## 프론트 타입 연결 방향

현재 `src/types.ts`의 타입을 기준으로 백엔드 DTO를 맞추는 것이 가장 빠릅니다. 다만 실제 API에서는 다음 필드가 추가되는 편이 좋습니다.

| 도메인 | 추가 권장 필드 |
|---|---|
| AccessibilityReport | `createdAt`, `updatedAt`, `createdBy`, `assigneeId`, `priority`, `statusReason`, `departmentId` |
| HelpRequest | `requestedBy`, `respondedBy`, `responseTimeSec`, `closedAt`, `linkedReportId` |
| Story | `authorId`, `originalBody`, `publicBody`, `anonymizationStatus`, `reviewerId`, `reviewedAt` |
| ImprovementTask | `sourceReportIds`, `ownerDepartment`, `dueDate`, `completedAt` |
| AuditLog | `adminId`, `action`, `targetType`, `targetId`, `ipAddress`, `createdAt` |

## 백엔드 연동 시 프론트 수정 순서

1. 인증 API를 먼저 연결합니다.
2. `src/services/api.ts`의 Mock 반환을 실제 HTTP 호출로 교체합니다.
3. 로딩/에러/빈 상태를 실제 API 응답 기준으로 점검합니다.
4. 변경성 작업에 성공/실패 Toast를 붙입니다.
5. 권한별 메뉴 표시와 버튼 비활성화를 적용합니다.
6. 월간 리포트 내보내기와 파일 업로드를 마지막에 붙입니다.

## 14차 API 전환 준비

14차에서는 실제 백엔드 호출을 만들지 않고, `src/services/api.ts`에 Spring Boot API로 교체하기 위한 타입과 함수 시그니처만 먼저 정리했습니다.

### 추가된 프론트 API 계약 타입

| 타입 | 목적 | 현재 상태 |
|---|---|---|
| `ApiResponse<T>` | Spring Boot 공통 응답 형태 준비 | 타입만 추가, 실제 fetch 미사용 |
| `ApiError` | API 실패 표준 처리 준비 | 클래스만 추가, 실제 throw 미사용 |
| `ListQuery` | 목록 검색/페이지/정렬 공통 파라미터 | Mock 필터에 일부 적용 |
| `ReportQuery` | 접근성 제보 검색/상태/긴급도/담당자 필터 | Mock 필터 적용 |
| `HelpRequestQuery` | 도움 요청 검색/상태/유형/미응답 필터 | Mock 필터 적용 |
| `StoryQuery` | 경험 피드 공개범위/익명화/민감정보 필터 | Mock 필터 적용 |
| `ImprovementTaskQuery` | 개선 과제 단계/담당/건물 필터 | Mock 필터 적용 |

### 변경된 조회 함수

| 함수 | 변경 전 | 변경 후 | 실제 API 연결 시 예상 Query |
|---|---|---|---|
| `getReports()` | 전체 Mock 제보 반환 | `getReports(query?)` | `status`, `urgency`, `assignee`, `buildingId`, `problemType`, `query` |
| `getHelpRequests()` | 전체 Mock 도움 요청 반환 | `getHelpRequests(query?)` | `status`, `type`, `location`, `unresolvedOnly`, `query` |
| `getStoriesForAdmin()` | 전체 Mock 경험 피드 반환 | `getStoriesForAdmin(query?)` | `visibility`, `anonymized`, `sensitiveInfo`, `reportReady`, `query` |
| `getImprovementTasks()` | 전체 Mock 개선 과제 반환 | `getImprovementTasks(query?)` | `stage`, `owner`, `buildingName`, `query` |

### 중요한 제한

- 아직 실제 `fetch`는 사용하지 않습니다.
- `.env` 또는 `VITE_API_BASE_URL`은 만들지 않았습니다.
- 백엔드가 연결된 것처럼 표현하지 않습니다.
- 현재 필터링은 브라우저 메모리의 Mock 데이터 기준입니다.
- 실제 서버 검색, 페이지네이션, 정렬은 Spring Boot API 연결 후 구현해야 합니다.

## 20차 화면/API 매핑 최종 점검

20차에서는 화면별 API 연결 후보를 별도 문서로 분리했습니다.

- 상세 문서: [`docs/api-screen-map.md`](api-screen-map.md)
- 목적: 화면, 프론트 함수, Spring Boot endpoint 후보, 현재 Mock 상태를 한 표에서 확인
- 연결 원칙: 페이지 컴포넌트는 `fetch`를 직접 호출하지 않고 `src/services/api.ts`만 사용
- 우선 연결 대상: 접근성 제보 목록/상태 변경, 도움 요청 목록/상태 변경

## 21차 백엔드 연결 전 준비

21차 기준으로 실제 API 연결 전 프론트에서 준비된 항목은 다음과 같습니다.

| 항목 | 상태 |
|---|---|
| 공통 응답 타입 | `ApiResponse<T>`, `ApiError` 준비 |
| 목록 Query 타입 | `ReportQuery`, `HelpRequestQuery`, `StoryQuery`, `ImprovementTaskQuery` 준비 |
| URL query 재현 | `reports`, `help-requests`, `stories`, `workflow` 적용 |
| Mock 변경 함수 | 제보/도움요청/경험피드/워크플로우 상태 변경 함수 준비 |
| 로딩/빈 상태 | `PageState` 공통 컴포넌트 적용 |
| Mock 동기화 표시 | `OperationalStatus` 공통 컴포넌트 적용 |

실제 백엔드 연결 단계에서는 이 구조를 유지하고, `delay()`와 Mock 배열 조작 부분만 HTTP client로 교체하는 것이 좋습니다.
