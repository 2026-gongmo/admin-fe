# ONDA 관리자 웹 API 연동 계획

현재 관리자 웹은 기본적으로 Mock 데이터 기반이며, `VITE_API_MODE=http`일 때 Spring Boot 백엔드 주요 API를 실제 호출합니다. 아래 표는 현재 연결 상태와 남은 후보를 함께 정리합니다.

## 공통 원칙

- 관리자 웹은 `src/services/api.ts`를 통해서만 데이터를 가져오도록 유지합니다.
- 페이지 컴포넌트에서 `fetch`를 직접 호출하지 않습니다.
- 실제 HTTP 호출은 `src/services/httpClient.ts`를 통해서만 수행합니다.
- 모든 변경성 작업은 감사 로그를 남길 수 있게 설계해야 합니다.
- 실제 운영에서는 인증/인가가 먼저 붙어야 합니다.

## 화면별 API 후보

| 화면 | 기능 | Method | Endpoint 후보 | 상태 |
|---|---|---:|---|---|
| 대시보드 | KPI 조회 | GET | `/api/admin/dashboard/stats` | 연결 완료 |
| 대시보드 | 건물 목록 | GET | `/api/admin/buildings` | 연결 완료 |
| 대시보드 | 관리자 검토용 추천 | GET | `/api/admin/recommendations` | 연결 완료 |
| 인증 | 관리자 로그인 | POST | `/api/admin/auth/login` | 34차 연결 완료 |
| 인증 | 내 정보 조회 | GET | `/api/admin/me` | 34차 연결 완료 |
| 인증 | 로그아웃 | POST | `/api/admin/auth/logout` | 로컬 토큰 제거 + API 호출 준비 |
| 접근성 제보 | 제보 목록 | GET | `/api/admin/reports` | 34차 연결 완료 |
| 접근성 제보 | 제보 상세 | GET | `/api/admin/reports/{reportId}` | Spring Boot API 구현, 화면은 목록 응답 기반 상세 패널 사용 |
| 접근성 제보 | 상태 변경 | PATCH | `/api/admin/reports/{reportId}/status` | 34차 연결 완료 |
| 접근성 제보 | 담당자 배정 | PATCH | `/api/admin/reports/{reportId}/assignee` | 연결 완료 |
| 접근성 제보 | 우선순위 변경 | PATCH | `/api/admin/reports/{reportId}/priority` | 연결 완료 |
| 접근성 제보 | 처리 메모 저장 | POST | `/api/admin/reports/{reportId}/notes` | 연결 완료 |
| 접근성 제보 | 첨부파일 업로드/다운로드 | POST/GET | `/api/admin/reports/{reportId}/attachments` | 연결 완료 |
| 공공데이터 | 데이터 출처 목록 | GET | `/api/admin/public-data/sources` | seed API 연결 완료 |
| 공공데이터 | 현장 제보 비교 | GET | `/api/admin/public-data/comparisons` | seed API 연결 완료 |
| 공공데이터 | 외부 API 설정 상태 | GET | `/api/admin/public-data/provider-status` | 연결 완료 |
| 공공데이터 | 전체 샘플 동기화 | POST | `/api/admin/public-data/sync/all` | 일부 data.go.kr API 연결 |
| 공공데이터 | 전체 페이지 수집 | POST | `/api/admin/public-data/sync/all/full` | endpoint 설정된 dataset 기준 연결 |
| 공공데이터 | 원본 데이터 조회 | GET | `/api/admin/public-data/raw-records` | 연결 완료 |
| 공공데이터 | endpoint 설정 현황 | GET | `/api/admin/public-data/dataset-status` | 연결 완료 |
| 공공데이터 | 정규화 미리보기 | GET | `/api/admin/public-data/normalized-records` | 연결 완료 |
| 반복 분석 | 분석 요약 | GET | `/api/admin/analysis/summary` | 연결 완료 |
| 반복 분석 | 반복 문제 목록 | GET | `/api/admin/analysis/repeated-issues` | 연결 완료 |
| 도움 요청 | 도움 요청 목록 | GET | `/api/admin/help-requests` | 34차 연결 완료 |
| 도움 요청 | 도움 요청 상세 | GET | `/api/admin/help-requests/{requestId}` | Spring Boot API 구현, 화면은 목록 응답 기반 상세 패널 사용 |
| 도움 요청 | 상태 변경 | PATCH | `/api/admin/help-requests/{requestId}/status` | 34차 연결 완료 |
| 도움 요청 | 센터 판단 저장 | PATCH | `/api/admin/help-requests/{requestId}/decision` | 연결 완료 |
| 경험 피드 | 피드 목록 | GET | `/api/admin/stories` | 연결 완료 |
| 경험 피드 | 공개 상태 변경 | PATCH | `/api/admin/stories/{storyId}/visibility` | 연결 완료 |
| 경험 피드 | 특정 가능성 방지용 익명화 요청 | POST | `/api/admin/stories/{storyId}/anonymize` | 규칙 기반 API 연결 |
| 워크플로우 | 개선 과제 목록 | GET | `/api/admin/improvement-tasks` | 연결 완료 |
| 워크플로우 | 개선 단계 변경 | PATCH | `/api/admin/improvement-tasks/{taskId}/stage` | 연결 완료 |
| 월간 리포트 | 월간 리포트 조회 | GET | `/api/admin/monthly-report` | 연결 완료 |
| 월간 리포트 | PDF 생성 | GET | `/api/admin/monthly-report/export/pdf?yearMonth=YYYY-MM` | 연결 완료 |
| 월간 리포트 | CSV 다운로드 | GET | `/api/admin/monthly-report/export/csv?yearMonth=YYYY-MM` | 연결 완료 |
| 설정 | 관리자 프로필 | GET | `/api/admin/me` | 연결 완료 |
| 설정 | 감사 로그 | GET | `/api/admin/audit-logs`, `/export/csv` | 연결 완료 |

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

- 기본 실행은 Mock 모드입니다.
- HTTP 모드에서는 `src/services/httpClient.ts`를 통해 일부 Spring Boot API를 호출합니다.
- 실제 `.env`, API Key, Token은 GitHub에 올리지 않습니다.
- 백엔드가 연결되지 않은 화면은 `아직 구현 안 됨 · 추가 예정`으로 표시합니다.
- 실제 서버 검색, 페이지네이션, 정렬 고도화는 Spring Boot API 확장 후 구현해야 합니다.

## 20차 화면/API 매핑 최종 점검

20차에서는 화면별 API 연결 후보를 별도 문서로 분리했습니다.

- 상세 문서: [`docs/api-screen-map.md`](api-screen-map.md)
- 목적: 화면, 프론트 함수, Spring Boot endpoint, 현재 연결/추가 예정 상태를 한 표에서 확인
- 연결 원칙: 페이지 컴포넌트는 `fetch`를 직접 호출하지 않고 `src/services/api.ts`만 사용
- 우선 연결 대상: 접근성 제보 목록/상태 변경, 도움 요청 목록/상태 변경

## 21차 API 전환 준비와 현재 연결 상태

21차에서는 API 전환 구조를 준비했고, 이후 일부 기능은 실제 Spring Boot API로 연결했습니다.

| 항목 | 상태 |
|---|---|
| 공통 응답 타입 | `ApiResponse<T>`, `ApiError` 준비 |
| 목록 Query 타입 | `ReportQuery`, `HelpRequestQuery`, `StoryQuery`, `ImprovementTaskQuery` 준비 |
| URL query 재현 | `reports`, `help-requests`, `stories`, `workflow` 적용 |
| Mock 변경 함수 | 제보/도움요청/경험피드/워크플로우 상태 변경 함수 준비 |
| HTTP client | `src/services/httpClient.ts`에서 실제 API 호출 |
| API 연결 완료 | 로그인, 내 정보, 대시보드 KPI, 건물, 제보, 도움 요청, 공공데이터 seed |
| 로딩/빈 상태 | `PageState` 공통 컴포넌트 적용 |
| Mock 동기화 표시 | `OperationalStatus` 공통 컴포넌트 적용 |

백엔드 연결 단계에서는 이 구조를 유지하고, 미구현 화면만 차례로 HTTP client로 교체하는 것이 좋습니다.

## 31차 API 실패 UI 준비

31차에서는 실제 백엔드가 없는 상태에서도 API 실패 상황을 발표와 QA에서 확인할 수 있도록 실패 UI를 준비했습니다.

| 항목 | 현재 구현 | 백엔드 연결 후 전환 |
|---|---|---|
| `ApiError` | Mock 실패 시 throw | HTTP error response를 변환 |
| `ApiFailureBanner` | 조회 실패 안내 | 서버 장애, 권한 오류, 네트워크 오류 표시 |
| 실패 Toast | 저장 실패 시뮬레이션 | `PATCH`, `POST`, `DELETE` 실패 응답 표시 |
| 설정 화면 실패 범위 | `reports`, `helpRequests`, `stories`, `improvementTasks`, `all` | 개발/스테이징 전용 장애 테스트 옵션 |

현재 실패 상태는 `localStorage` 기반 Mock이며, 실제 `fetch` 또는 외부 API 호출은 없습니다.

## 32차~35차 실제 API 1차 연결

| 차수 | 내용 | 상태 |
|---:|---|---|
| 32차 | `VITE_API_MODE=mock/http`, `VITE_API_BASE_URL`, `httpClient.ts` 추가 | 완료 |
| 33차 | `/login` 페이지, 토큰 저장, 세션 복구, 로그아웃 흐름 추가 | 완료 |
| 34차 | 로그인/me, 제보 목록/상태 변경, 도움 요청 목록/상태 변경 API 연결 | 완료 |
| 35차 | 빌드, 백엔드 실행, 브라우저 QA, 문서 최신화 | 완료 |

### HTTP 모드 실행 예시

```bash
cd /Users/juyoung/Downloads/onda/backend
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=18080
```

```bash
cd /Users/juyoung/Downloads/onda/admin-web
VITE_API_MODE=http VITE_API_BASE_URL=http://127.0.0.1:18080 npm run dev -- --host 127.0.0.1 --port 5174
```

### 아직 Mock 또는 추가 예정인 영역

- 제보/도움 요청 상세 화면의 서버 단건 재조회 적용과 파일 검증 고도화
- 도움 요청 응답자 배정, 실시간 알림
- 외부 LLM 기반 익명화는 필요성과 보안 검토 후 판단
- 센터 공유, 개선 요청서/Notion 전송
- 운영 DB 실연결과 migration
- 권한 정책 세분화와 관리자 UI 고도화

## 다음 API 연결 우선순위

주요 Spring Boot API 연결은 완료했으므로, 다음은 실제 서비스 품질을 올리는 순서가 현실적입니다.

| 순서 | API | 이유 |
|---:|---|---|
| 1 | `GET /api/admin/reports/{reportId}` | 상세 패널을 목록 응답 기반에서 단건 재조회 기반으로 고도화 |
| 2 | `GET /api/admin/help-requests/{requestId}` | 도움 요청 상세도 단건 재조회와 권한 체크를 분리 |
| 3 | 서버 페이징/정렬/검색 | seed 데이터가 늘어났을 때 표 성능과 URL query를 안정화 |
| 4 | 첨부파일 검증 고도화 | 확장자, MIME, 용량, 악성 파일 정책 보강 |
| 5 | 미설정 공공데이터 endpoint 보강 | 후보 dataset 중 실제 호출 가능한 항목 확대 |
| 6 | 운영 DB/권한별 인가 | 실제 서비스 전 데이터 영속화와 민감정보 접근 제어 강화 |

PDF 생성, 파일 업로드/다운로드, 공공데이터 전체 페이지 수집 endpoint는 Spring Boot MVP에 포함했습니다. 실제 외부 LLM 기반 익명화, 운영 DB 전환, 권한별 인가 고도화는 2차 이후로 유지합니다.
