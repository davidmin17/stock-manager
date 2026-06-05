# Stock Manager

AI 기반 한국 주식 분석 시스템

단일 Gemini 호출(Google Search 그라운딩)로 뉴스·시세·재무·리스크 4개 영역을 분석하고 종합 투자 리포트를 생성합니다.

## 주요 기능

- **종목 검색**: 초성 검색 지원 (예: "ㅅㅅ" → 삼성전자), KOSPI/KOSDAQ 전종목
- **단일 호출 통합 분석** (Gemini 1회, Google Search 그라운딩):
  - 뉴스/센티먼트 분석
  - 시세/거래량 기술적 분석 (한국투자증권 API 실데이터)
  - 재무 분석 (PER·PBR·ROE·부채비율·유동비율)
  - 거시경제/시장 리스크 분석
  - 종합 평가 (SWOT, 목표가, 손절가)
- **다크모드 UI**: 반응형 웹 디자인

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript 5 |
| UI | shadcn/ui, Tailwind CSS 4, Lucide React |
| AI | Google Gemini API (`@google/genai`) |
| 시세 데이터 | 한국투자증권 Open API |
| 캐싱 | Redis (ioredis) |
| 배포 | Vercel |

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.example`을 `.env.local`로 복사 후 값 입력:

```bash
cp .env.example .env.local
```

```bash
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# 한국투자증권 Open API
KIS_APP_KEY=your_appkey
KIS_APP_SECRET=your_appsecret
KIS_BASE_URL=https://openapi.koreainvestment.com:9443

# Redis
REDIS_URL=redis://user:password@host:port
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

`http://localhost:3000`에서 접속.

### 4. 빌드

```bash
pnpm build
pnpm start
```

## 아키텍처

```
사용자 → 종목 검색 → 분석 시작
                        │
                        ▼
              POST /api/analyze
                        │
                        ▼  runUnifiedAnalysis
          ① KIS API 선조회 (시세/일별/수급)
                        │
                        ▼
          ② Gemini 1회 호출 (Google Search 그라운딩)
             뉴스 + 시세해석 + 재무 + 리스크 + 종합평가
                        │
                        ▼
          ③ 통합 JSON → 5개 결과 분해
             (시세 수치는 KIS 실데이터로 직접 채움)
                        │
                        ▼
              최종 리포트 (5개 카드 일괄 표시)
```

- **단일 호출**: `/api/analyze`가 KIS 데이터를 선조회한 뒤 Gemini를 1회 호출해 4개 영역 분석 + 종합 평가를 수행하고 단일 JSON으로 응답. 그라운딩 호출을 분석당 1회로 줄여 레이트 리밋을 방지.
- **캐싱**: KIS 토큰(24h), 종목코드(매일 9시 갱신) — Redis 3단계 캐시 (메모리 → Redis → API)

## 보안

- API 레이트 리밋 (분석 5회/분, 검색 30회/분)
- 입력 검증 (종목코드 6자리 숫자, 종목명 50자 이내)
- 보안 헤더 (X-Frame-Options, X-Content-Type-Options 등)
- 에러 상세 미노출 (서버 로그에만 기록)

## 면책

본 서비스는 AI 기반 분석이며 투자 판단의 참고자료입니다. 투자 결정은 본인 책임 하에 이루어져야 합니다.
