# 베프 시연 실패 대비 플랜

## 백엔드가 켜지지 않을 때

1. 관리자 웹을 Mock 모드로 실행합니다.
2. “관리자 웹은 Mock 모드로도 발표 가능하고, Spring Boot API 연결 모드는 로컬 검증을 통과했습니다”라고 설명합니다.
3. 제출 문서의 `mvn test` 통과 기록과 API 매핑표를 보여줍니다.

```bash
cd /Users/juyoung/Downloads/onda/admin-web
npm run dev -- --host 127.0.0.1
```

## 공공데이터 API 호출이 실패할 때

1. 저장된 seed/원본 데이터 화면을 보여줍니다.
2. `endpoint 설정 현황`에서 3개 실제 호출 검증, 65개 미설정을 투명하게 설명합니다.
3. “확인되지 않은 공공데이터 endpoint는 실제 연동이라고 말하지 않습니다”라고 선을 긋습니다.

## 인터넷이 불안정할 때

1. 로컬 dev 서버 기준으로 시연합니다.
2. GitHub Actions나 Dothome 화면 대신 로컬 빌드 결과를 보여줍니다.
3. 캡처가 필요하면 아래 핵심 화면을 준비합니다.

- `/#/dashboard`
- `/#/reports`
- `/#/public-data`
- `/#/analysis`
- `/#/monthly-report`

## 로그인 문제가 생길 때

로컬 seed 계정:

| 역할 | 이메일 | 비밀번호 |
|---|---|---|
| 장애학생지원센터 | `center@onda.test` | `onda1234!` |
| 시설관리팀 | `facility@onda.test` | `onda1234!` |
| 슈퍼관리자 | `super@onda.test` | `onda1234!` |

## Dothome 관련 질문이 나올 때

- Dothome에는 React/Vite 정적 프론트만 올릴 수 있습니다.
- Spring Boot 백엔드는 별도 Java 서버가 필요합니다.
- 공개 배포에서 HTTP 모드를 쓰려면 `VITE_API_BASE_URL`을 별도 배포한 백엔드 주소로 설정해야 합니다.

## 보안 질문이 나올 때

- 장애/위치/경험 데이터는 민감한 맥락이므로 운영 전 역할별 API 인가, 첨부파일 검증, 감사 로그, 익명화 정책을 강화해야 합니다.
- 현재 MVP는 구조를 분리해 시연 가능한 수준으로 구현했습니다.
