# ONDA GitHub 업로드 체크리스트

## 현재 repo 상태

- `admin-web/`: 기존 Git repo, 프론트 변경분이 수정 상태입니다.
- `backend/`: 이번 작업에서 Git repo를 초기화했고 브랜치는 `main`입니다.
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

## 권장 커밋 단위

### admin-web

```bash
cd /Users/juyoung/Downloads/onda/admin-web
git add README.md src/components/Layout.tsx src/pages/DemoGuidePage.tsx src/pages/PublicDataPage.tsx src/services/api.ts src/styles/globals.css src/types.ts
git commit -m "feat: show public data collection details and map layers"
```

### backend

```bash
cd /Users/juyoung/Downloads/onda/backend
git add .env.example .gitignore README.md pom.xml src
git commit -m "feat: add public data raw records and normalization APIs"
```

## Push 전 주의

- 사용자 승인 없이 `git push` 하지 않습니다.
- 백엔드는 새 Git repo라 원격 저장소 URL을 먼저 정해야 합니다.
- Dothome에는 프론트 정적 파일만 배포 가능하고 Spring Boot 백엔드는 별도 Java 서버가 필요합니다.
