# ONDA 공모전 시연 체크리스트

## 실행

### 백엔드

```bash
cd /Users/juyoung/Downloads/onda/backend
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=18080
```

### 프론트

```bash
cd /Users/juyoung/Downloads/onda/admin-web
npm run dev -- --host 127.0.0.1
```

## 접속

- 관리자 웹: `http://127.0.0.1:5173`
- 백엔드 health: `http://127.0.0.1:18080/health`

## 로그인

| 역할 | 이메일 | 비밀번호 |
|---|---|---|
| 장애학생지원센터 | `center@onda.test` | `onda1234!` |
| 시설관리팀 | `facility@onda.test` | `onda1234!` |
| 슈퍼관리자 | `super@onda.test` | `onda1234!` |

## 5분 시연 흐름

1. `/#/dashboard`
   - 신규 제보, 도움 요청, 반복 제보 TOP 5를 보여줍니다.
   - “학생 제보가 학교 개선 업무로 전환된다”는 메시지를 먼저 잡습니다.

2. `/#/reports`
   - 제보 상세, 상태 변경, 담당자 배정, 우선순위 저장, 메모/첨부파일을 보여줍니다.
   - 실제 Spring Boot API 저장 범위와 Mock 범위를 구분합니다.

3. `/#/public-data`
   - 공공데이터 70종 seed, 68개 동기화 슬롯, 현재 설정된 3개 실제 호출 상태를 보여줍니다.
   - 전체 페이지 배치 수집 버튼을 눌러 수집 결과 상세 표를 보여줍니다.
   - 원본 보기로 원본 JSON, 정규화 미리보기, 지도 레이어를 확인합니다.

4. `/#/analysis`
   - 반복 문제 분석과 관리자 검토용 추천을 보여줍니다.
   - AI는 현재 규칙 기반 MVP이며, 결정이 아니라 추천/초안 보조 기능이라고 말합니다.

5. `/#/monthly-report`
   - 월간 리포트, PDF/CSV 다운로드, 스냅샷 저장을 보여줍니다.
   - 학교 제출 근거로 이어지는 흐름을 강조합니다.

## 발표 멘트 핵심

- “공공데이터에 시설이 있다고 해서 실제로 쓸 수 있다는 뜻은 아닙니다.”
- “공공데이터는 참고 레이어이고, 실제 우선순위는 위험도와 현장 제보를 먼저 봅니다.”
- “고위험 제보는 공감이나 반복 제보가 적어도 우선 검토 대상입니다.”
- “익명화는 편향 제거보다, 장애학생이 소수라 특정될 수 있는 상황을 줄이기 위한 보호 장치입니다.”
- “현재 3개 data.go.kr API는 실제 호출 검증했고, 나머지 65개는 endpoint 설정 상태를 투명하게 보여줍니다.”
- “Dothome은 프론트 정적 배포만 가능하고 Spring Boot 백엔드는 별도 Java 서버가 필요합니다.”

## 시연 전 검증

```bash
cd /Users/juyoung/Downloads/onda/backend
mvn test

cd /Users/juyoung/Downloads/onda/admin-web
npm run build
```

## 주의

- `.env`, API Key, DB password, token은 화면이나 발표자료에 노출하지 않습니다.
- 백엔드가 실제 운영 배포된 것처럼 말하지 않습니다.
- Oracle 배포와 운영 DB 연결은 승인 전에는 진행하지 않습니다.

## 실패 대비

자세한 대체 플랜은 [`DEMO_FAILURE_PLAN.md`](DEMO_FAILURE_PLAN.md)를 확인합니다.

- 백엔드가 안 켜지면 Mock 모드로 관리자 웹 흐름을 먼저 보여줍니다.
- 공공데이터 API가 실패하면 seed/저장 원본/endpoint 설정 현황으로 설명합니다.
- 인터넷이 불안정하면 로컬 화면과 캡처 기준으로 시연합니다.
