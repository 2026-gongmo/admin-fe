# ONDA 관리자 웹 프론트 최종 인계

이 문서는 19차~22차 기준으로 관리자 웹 프론트가 어떤 상태인지, 백엔드 연결 전 무엇을 확인해야 하는지 정리한 인계 문서입니다.

## 현재 결론

- 관리자 웹은 공모전 시연용 React + Vite 프론트 MVP로 사용할 수 있습니다.
- 모든 데이터는 Mock이며, 실제 API 연결은 아직 하지 않았습니다.
- 화면별 데이터 접근은 `src/services/api.ts`를 통하도록 유지했습니다.
- 검색/필터/상세 선택은 주요 화면에서 URL query로 재현할 수 있습니다.

## 완료된 차수

| 차수 | 완료 내용 | 상태 |
|---:|---|---|
| 19차 | 커밋/푸시 준비, 업로드 전 보안 확인 | 완료 예정 |
| 20차 | API endpoint와 화면 매핑 최종 점검 | 완료 |
| 21차 | 백엔드 연결 전 `services/api.ts` 전환 지점 정리 | 완료 |
| 22차 | README, 시연 라우트, 스크린샷 자료 정리 | 완료 |

## 주요 시연 라우트

| 목적 | URL |
|---|---|
| 관리자 홈 | `http://127.0.0.1:5173/#/dashboard` |
| 제보 상세 직접 진입 | `http://127.0.0.1:5173/#/reports?selected=r_1` |
| 제보 검색/필터 | `http://127.0.0.1:5173/#/reports?selected=r_1&status=checking&q=중앙도서관` |
| 도움 요청 상세 직접 진입 | `http://127.0.0.1:5173/#/help-requests?selected=h_1` |
| 워크플로우 단계 필터 | `http://127.0.0.1:5173/#/workflow?stage=reviewing` |
| 경험 피드 검색 | `http://127.0.0.1:5173/#/stories?q=조별과제` |
| 시연 가이드 | `http://127.0.0.1:5173/#/demo-guide` |

## 백엔드 연결 시 우선 교체 지점

1. `src/services/api.ts`
   - 현재 Mock 배열과 delay를 반환합니다.
   - Spring Boot 연결 시 이 파일에서 HTTP client로 교체합니다.
   - 페이지 컴포넌트에서 직접 `fetch`를 만들지 않습니다.

2. `src/types.ts`
   - 현재 프론트 DTO 역할을 합니다.
   - 백엔드 DTO와 이름/enum 값을 맞추는 기준입니다.

3. 주요 변경 함수
   - `updateReportStatus`
   - `updateHelpRequestStatus`
   - `updateStoryVisibility`
   - `updateImprovementTaskStage`

## 백엔드 붙여야 함으로 남긴 기능

- 관리자 로그인/권한 검증
- 제보 상태/담당자/우선순위/처리 메모 저장
- 도움 요청 실시간 응답 처리
- 경험 피드 원문/공개본 분리 저장
- AI 익명화 결과 저장
- 제보 병합/대표 제보 지정
- 개선 과제 단계 변경 저장
- 월간 리포트 PDF/CSV 생성
- 공공데이터 정기 동기화
- 관리자 감사 로그 저장

## GitHub 업로드 전 확인

- `.env` 없음
- API Key, Token, Secret 없음
- `node_modules/`, `dist/`, `tsconfig.tsbuildinfo` 추적 대상 아님
- 실제 학교/사용자 개인정보 없음
- Mock 데이터임을 README와 화면에 명시

## 다음 작업 추천

1. Spring Boot 백엔드 프로젝트 생성
2. 인증/인가와 관리자 계정부터 구현
3. `GET /api/admin/reports`를 먼저 붙여 Mock 목록을 실제 API 응답으로 교체
4. 제보 상태 변경 `PATCH` 구현
5. 도움 요청, 경험 피드, 워크플로우 순서로 확장
