# ONDA 관리자 웹 프론트 인계

이 문서는 35차 기준으로 관리자 웹 프론트가 어떤 상태인지, Spring Boot 백엔드 1차 연결 후 무엇을 이어서 확인해야 하는지 정리한 인계 문서입니다.

## 현재 결론

- 관리자 웹은 공모전 시연용 React + Vite 프론트 MVP로 사용할 수 있습니다.
- 기본 실행은 Mock 모드이며, `.env` 없이도 동작합니다.
- `VITE_API_MODE=http`일 때 Spring Boot API 주요 조회/저장 기능을 실제 호출합니다.
- 페이지 컴포넌트는 직접 `fetch`하지 않고 `src/services/api.ts`만 호출합니다.
- 실제 HTTP 요청은 `src/services/httpClient.ts`에만 둡니다.
- 검색/필터/상세 선택은 주요 화면에서 URL query로 재현할 수 있습니다.

## 완료된 차수

| 차수 | 완료 내용 | 상태 |
|---:|---|---|
| 19차 | 커밋/푸시 준비, 업로드 전 보안 확인 | 완료 |
| 20차 | API endpoint와 화면 매핑 최종 점검 | 완료 |
| 21차 | 백엔드 연결 전 `services/api.ts` 전환 지점 정리 | 완료 |
| 22차 | README, 시연 라우트, 스크린샷 자료 정리 | 완료 |
| 23차 | `.env.example`, Toast 타입, NotFound/권한 없음 페이지 추가 | 완료 |
| 24차 | 제보 표 정렬 UI, 권한별 미리보기 토글 추가 | 완료 |
| 25차 | README 스크린샷/환경변수/포트폴리오 설명 보강 | 완료 |
| 26차 | 상세 패널 닫기/고정, 도움 요청/워크플로우 정렬, Skeleton 로딩 보강 | 완료 |
| 27차 | 권한별 메뉴 숨김 Mock, 상단 권한 전환, 접근성 라벨 보강 | 완료 |
| 28차 | 발표 모드 토글, 로컬/정적 시연 문서와 QA 항목 보강 | 완료 |
| 29차 | 필터 초기화 통일, 상세 선택 번호, 이전/다음 상세 이동 UX 보강 | 완료 |
| 30차 | 공통 관리자 액션 로그, 검수/공개/워크플로우 처리 이력 Mock 보강 | 완료 |
| 31차 | API 실패 배너, 조회 실패 상태, 저장 실패 Toast, Mock 실패 시뮬레이션 보강 | 완료 |
| 32차 | API 모드 전환, HTTP client, API Base URL 표시 | 완료 |
| 33차 | 관리자 로그인 화면, 토큰 저장, 세션 복구, 로그아웃 흐름 | 완료 |
| 34차 | 로그인/me, 제보 목록/상태 변경, 도움 요청 목록/상태 변경 API 연결 | 완료 |
| 35차 | Mock/HTTP 빌드와 브라우저 QA, 문서 최신화 | 완료 |

## 주요 실행 모드

### Mock 모드

```bash
cd /Users/juyoung/Downloads/onda/admin-web
npm run dev -- --host 127.0.0.1
```

확인 주소:

| 목적 | URL |
|---|---|
| 관리자 홈 | `http://127.0.0.1:5173/#/dashboard` |
| 제보 상세 직접 진입 | `http://127.0.0.1:5173/#/reports?selected=r_1` |
| 도움 요청 상세 직접 진입 | `http://127.0.0.1:5173/#/help-requests?selected=h_1` |
| 시연 가이드 | `http://127.0.0.1:5173/#/demo-guide` |
| 설정 | `http://127.0.0.1:5173/#/settings` |

### HTTP 모드

```bash
cd /Users/juyoung/Downloads/onda/backend
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=18080
```

```bash
cd /Users/juyoung/Downloads/onda/admin-web
VITE_API_MODE=http VITE_API_BASE_URL=http://127.0.0.1:18080 npm run dev -- --host 127.0.0.1 --port 5174
```

확인 주소:

| 목적 | URL |
|---|---|
| 로그인 | `http://127.0.0.1:5174/#/login` |
| 실제 API 대시보드 | `http://127.0.0.1:5174/#/dashboard` |
| 실제 API 제보 목록 | `http://127.0.0.1:5174/#/reports` |
| 실제 API 도움 요청 | `http://127.0.0.1:5174/#/help-requests` |
| API 모드 설정 확인 | `http://127.0.0.1:5174/#/settings` |

## 현재 실제 API 연결 범위

| 기능 | Endpoint | 상태 |
|---|---|---|
| 관리자 로그인 | `POST /api/admin/auth/login` | 연결 |
| 내 정보 조회 | `GET /api/admin/me` | 연결 |
| 대시보드 KPI | `GET /api/admin/dashboard/stats` | 연결 |
| 건물 목록 | `GET /api/admin/buildings` | 연결 |
| 접근성 제보 목록 | `GET /api/admin/reports` | 연결 |
| 접근성 제보 상태 변경 | `PATCH /api/admin/reports/{id}/status` | 연결 |
| 접근성 제보 담당자/우선순위/메모 | `PATCH /assignee`, `PATCH /priority`, `POST /notes` | 연결 |
| 도움 요청 목록 | `GET /api/admin/help-requests` | 연결 |
| 도움 요청 상태 변경 | `PATCH /api/admin/help-requests/{id}/status` | 연결 |
| 도움 요청 센터 판단 | `PATCH /api/admin/help-requests/{id}/decision` | 연결 |
| 경험 피드 목록/공개 상태 | `GET /api/admin/stories`, `PATCH /api/admin/stories/{id}/visibility` | 연결 |
| 개선 워크플로우 목록/단계 | `GET /api/admin/improvement-tasks`, `PATCH /api/admin/improvement-tasks/{id}/stage` | 연결 |
| 월간 리포트 조회/PDF/CSV | `GET /api/admin/monthly-report`, `/export/pdf`, `/export/csv` | 연결 |
| 반복 분석/추천 | `GET /api/admin/analysis/*`, `GET /api/admin/recommendations` | 연결 |
| 공공데이터 seed/전체 수집/정규화 | `GET /api/admin/public-data/*`, `POST /sync/all/full` | 연결 |
| 제보 첨부파일 | `POST /api/admin/reports/{id}/attachments`, `GET /download` | 연결 |
| 감사 로그 조회/CSV | `GET /api/admin/audit-logs`, `/export/csv` | 연결 |

## 아직 Mock이거나 추가 예정인 영역

- 외부 LLM 기반 AI 익명화
- 제보/도움 요청 상세 단건 조회와 고급 수정
- 공유/공문/Notion 전송
- 중복 제보 병합 저장
- 운영 DB 영속화와 production 인증 정책

## 다음 작업 추천

1. 제보/도움 요청 상세 단건 조회와 서버 페이징 고도화
2. 월간 리포트 PDF 생성과 리포트 스냅샷 저장
3. 제보 첨부파일 업로드/다운로드 연결
4. 실제 공공데이터 API 키 기반 전체 배치 동기화 연결
5. 실제 AI 익명화 API 연결 전 보안 리뷰

## GitHub 업로드 전 확인

- `.env` 없음
- API Key, Token, Secret 없음
- `node_modules/`, `dist/`, `tsconfig.tsbuildinfo` 추적 대상 아님
- 실제 학교/사용자 개인정보 없음
- Mock 데이터와 실제 API 연결 범위를 README와 화면에서 구분함
