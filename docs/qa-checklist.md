# ONDA 관리자 웹 QA 체크리스트

## 빌드 확인

- [ ] `npm install`
- [ ] `npm run build`
- [ ] TypeScript 에러 없음
- [ ] Vite 빌드 성공

## 로컬 실행 확인

```bash
npm run dev -- --host 127.0.0.1
```

확인 주소:

- [ ] `http://127.0.0.1:5173/#/dashboard`
- [ ] `http://127.0.0.1:5173/#/reports`
- [ ] `http://127.0.0.1:5173/#/public-data`
- [ ] `http://127.0.0.1:5173/#/analysis`
- [ ] `http://127.0.0.1:5173/#/help-requests`
- [ ] `http://127.0.0.1:5173/#/stories`
- [ ] `http://127.0.0.1:5173/#/workflow`
- [ ] `http://127.0.0.1:5173/#/monthly-report`
- [ ] `http://127.0.0.1:5173/#/demo-guide`
- [ ] `http://127.0.0.1:5173/#/settings`

직접 진입 확인 주소:

- [ ] `http://127.0.0.1:5173/#/reports?selected=r_1`
- [ ] `http://127.0.0.1:5173/#/reports?selected=r_1&status=checking&q=중앙도서관`
- [ ] `http://127.0.0.1:5173/#/help-requests?selected=h_1`
- [ ] `http://127.0.0.1:5173/#/workflow?stage=reviewing`
- [ ] `http://127.0.0.1:5173/#/stories?q=조별과제`

## 화면 QA

- [ ] 사이드바 메뉴가 정상 이동되는가?
- [ ] 주요 표의 텍스트가 잘리지 않는가?
- [ ] 상세 패널에서 버튼/입력창이 겹치지 않는가?
- [ ] 검색 결과 없음 상태가 표시되는가?
- [ ] Mock 기능은 실제 저장처럼 표현하지 않는가?
- [ ] `백엔드 붙여야 함`, `Mock`, `추가 필요` 표현이 필요한 곳에 보이는가?
- [ ] PDF/CSV 내보내기는 Mock Toast로만 동작하는가?
- [ ] 위험 작업 전 ConfirmModal이 표시되는가?
- [ ] 로딩/빈 상태가 공통 PageState 형태로 표시되는가?
- [ ] 운영 동기화 상태 바가 Mock 상태를 명확히 보여주는가?
- [ ] 콘솔 에러가 없는가?

## 반응형 확인

- [ ] 1440px 데스크톱
- [ ] 1280px 노트북
- [ ] 768px 태블릿
- [ ] 390px 모바일 폭

관리자 웹은 데스크톱 우선 화면이지만, 좁은 화면에서도 텍스트와 버튼이 심하게 겹치지 않아야 합니다.

## 보안/업로드 전 확인

- [ ] `.env` 파일이 GitHub에 올라가지 않는가?
- [ ] API Key, Secret, Token이 코드에 하드코딩되어 있지 않은가?
- [ ] `node_modules/`가 올라가지 않는가?
- [ ] `dist/`가 별도 요청 없이 올라가지 않는가?
- [ ] 실제 사용자 개인정보가 포함되어 있지 않은가?
- [ ] 실제 학교 내부 데이터처럼 보이는 문구가 없는가?
- [ ] 모든 수치는 Mock/샘플 데이터임을 설명할 수 있는가?

## 추천 검색 명령

```bash
rg -n "API_KEY|SECRET|TOKEN|PASSWORD|BEGIN PRIVATE|sk-|ghp_|xoxb-|DB_PASSWORD|\\.env" . \
  --glob '!node_modules/**' \
  --glob '!dist/**' \
  --glob '!*.tsbuildinfo' \
  --glob '!.git/**'
```

검색 결과가 나오면 실제 비밀값인지, 문서상의 주의 문구인지 구분해서 확인합니다.
