# 베프 GitHub 업로드 체크리스트

## 현재 repo 상태

- `admin-web/`: 기존 Git repo, `main` 브랜치가 GitHub `2026-gongmo/admin-fe`에 push되어 있습니다.
- `backend/`: 로컬 Git repo가 있고 브랜치는 `main`입니다. 백엔드 원격 저장소 URL은 아직 필요합니다.
- 루트 `/Users/juyoung/Downloads/onda`: Git repo가 아닙니다.

## 올리기 전 확인

```bash
cd /Users/juyoung/Downloads/onda/admin-web
git status
npm run build

cd /Users/juyoung/Downloads/onda/backend
git status
mvn test
```

## 커밋 금지 파일

다음 파일과 폴더는 GitHub에 올리면 안 됩니다.

- `.env`
- `.env.local`
- `node_modules/`
- `dist/`
- `target/`
- `data/`
- DB password, API Key, token, Oracle credential, wallet

현재 ignore 확인된 항목:

- `admin-web`: `.env.local`, `dist/`, `node_modules/`
- `backend`: `.env`, `data/`, `target/`

## 이미 커밋된 주요 범위

### admin-web

- 공공데이터 수집 결과 상세, 원본 보기, endpoint 상태, 정규화 미리보기, 지도 레이어
- 월간 리포트 PDF/CSV, 스냅샷, 감사 로그 화면/API 연결 문서
- 제출용 README/docs 최신화

### backend

- 관리자 API MVP, 파일 업로드/다운로드, PDF/CSV, 스케줄러, 공공데이터 원본/정규화 API
- Flyway 준비, 보안/운영 DB/업로드 체크리스트 문서
- 원격 저장소가 생기면 `git push -u origin main`만 진행하면 됩니다.

## Push 전 주의

- 프론트는 이미 GitHub에 push되어 있습니다.
- 백엔드는 원격 저장소 URL을 먼저 정해야 합니다.
- Dothome에는 프론트 정적 파일만 배포 가능하고 Spring Boot 백엔드는 별도 Java 서버가 필요합니다.
