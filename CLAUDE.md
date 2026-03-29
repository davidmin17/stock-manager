# CLAUDE.md — Stock Manager: AI 멀티에이전트 주식 분석 시스템

## 프로젝트 개요

**Stock Manager**는 5개의 AI 서브 에이전트가 병렬로 분석한 결과를 종합하여, 한국 주식(KOSPI/KOSDAQ) 종목의 투자 가치를 100점 만점으로 평가하는 웹 애플리케이션입니다.

- **앱 형태**: Next.js 풀스택 웹앱 (다크모드, 반응형)
- **배포**: Vercel (GitHub 연동 자동 배포)
- **인증**: 없음 (레이트 리밋으로 보호)
- **대상 시장**: 한국 주식 (KOSPI/KOSDAQ)

---

## 기술 스택

- **Next.js 15** (App Router) + **React 19** + **TypeScript 5**
- **shadcn/ui** + **Tailwind CSS 4** + **Lucide React**
- **Google Gemini API** (`@google/genai` SDK, 모델은 환경변수 `GEMINI_MODEL`로 설정)
- **한국투자증권 Open API** (REST, OAuth 토큰 인증)
- **Redis** (ioredis, 토큰/종목 데이터 캐싱)
- **pnpm** (패키지 매니저)

---

## 프로젝트 구조

```
stock-manager/
├── CLAUDE.md
├── README.md
├── .env.local                     # 환경 변수 (Git 미포함)
├── .env.example                   # 환경 변수 템플릿
├── next.config.ts
├── package.json
│
├── src/
│   ├── middleware.ts               # 보안 헤더 + API 레이트 리밋
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃 (다크모드)
│   │   ├── page.tsx                # 메인 페이지
│   │   ├── globals.css
│   │   └── api/
│   │       ├── analyze/route.ts    # SSE 오케스트레이터
│   │       ├── search/route.ts     # 종목 검색 API
│   │       └── agents/
│   │           ├── news/route.ts
│   │           ├── market-data/route.ts
│   │           ├── financial/route.ts
│   │           ├── risk/route.ts
│   │           └── synthesizer/route.ts
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui 컴포넌트
│   │   ├── stock-search.tsx        # 종목 검색 (자동완성, 키보드 네비게이션)
│   │   ├── analysis-dashboard.tsx  # 대시보드 컨테이너
│   │   ├── agent-card.tsx          # 에이전트 결과 카드 (React.memo)
│   │   ├── score-gauge.tsx         # SVG 점수 게이지
│   │   └── report-summary.tsx      # 종합 리포트 카드
│   │
│   ├── hooks/
│   │   ├── use-analysis.ts         # SSE 기반 분석 상태 관리
│   │   └── use-stock-search.ts     # 종목 검색 (디바운스)
│   │
│   ├── lib/
│   │   ├── cache.ts                # Redis 클라이언트 (ioredis, TLS 지원)
│   │   ├── gemini.ts               # Gemini API 래퍼
│   │   ├── kis-api.ts              # KIS API 클라이언트 (타임아웃, 토큰 자동갱신)
│   │   ├── kis-token.ts            # KIS 토큰 관리 (L1 메모리 → L2 Redis → L3 API)
│   │   ├── stock-code.ts           # 종목 검색 (초성 지원, Redis 캐시, 매일 9시 갱신)
│   │   ├── validate.ts             # 입력 검증 유틸
│   │   └── agents/
│   │       ├── types.ts
│   │       ├── prompts.ts          # 5개 에이전트 시스템 프롬프트
│   │       ├── news-agent.ts       # 뉴스/센티먼트 (Gemini + Google Search)
│   │       ├── market-agent.ts     # 시세/거래량 (KIS API + Gemini)
│   │       ├── financial-agent.ts  # 재무 분석 (Gemini + Google Search)
│   │       ├── risk-agent.ts       # 리스크 분석 (Gemini + Google Search)
│   │       └── synthesizer-agent.ts # 종합 평가 (Agent 1~4 결과 종합)
│   │
│   └── types/
│       ├── agent.ts                # 에이전트 응답 타입
│       ├── stock.ts                # 주식 관련 타입
│       └── kis.ts                  # KIS API 응답 타입
│
└── public/
```

---

## 환경 변수

```bash
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash       # 사용할 Gemini 모델 (미설정 시 gemini-2.5-flash)

# 한국투자증권 Open API (실전투자)
KIS_APP_KEY=your_appkey
KIS_APP_SECRET=your_appsecret
KIS_BASE_URL=https://openapi.koreainvestment.com:9443

# Redis (토큰/종목 데이터 캐싱)
REDIS_URL=redis://user:password@host:port
```

---

## 에이전트 아키텍처

```
사용자 입력 (종목명)
       │
       ▼
  종목코드 변환 (Redis 캐시 / 네이버 API)
       │
       ▼
  ┌────┴──────────────────────────────────┐
  │       병렬 실행 (Promise.allSettled)    │
  │                                        │
  │  Agent 1     Agent 2    Agent 3    Agent 4
  │  뉴스/센티   시세/거래   재무분석   리스크
  │  (Gemini     (KIS API   (Gemini    (Gemini
  │   +Search)   +Gemini)    +Search)   +Search)
  └────┬──────────┬──────────┬──────────┘
       │          │          │
       ▼──────────▼──────────▼
              Agent 5
            종합 평가 (순차)
                │
                ▼
           최종 리포트
           (목표가 + 손절가 + SWOT)
```

SSE(Server-Sent Events)로 에이전트별 완료 시 즉시 클라이언트에 스트리밍.

---

## 캐싱 전략

### KIS 토큰 (`kis:access_token`)
- L1 인메모리 → L2 Redis → L3 KIS API 신규 발급
- 24시간 유효, 만료 1시간 전 갱신
- 토큰 만료 응답(EGW00121) 시 자동 재발급 + 1회 재시도

### 종목코드 (`stock:codes`)
- L1 인메모리 → L2 Redis → L3 네이버 금융 API
- 매일 오전 9시(KST) 기준 1회 갱신
- 갱신 실패 시 기존 데이터 유지

---

## 보안

- **입력 검증**: 종목코드 6자리 숫자, 종목명 50자 이내 정규식 검증
- **보안 헤더**: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **레이트 리밋**: 분석 API 분당 5회, 검색 API 분당 30회 (IP 기반)
- **에러 메시지**: 클라이언트에 상세 에러 미노출, 서버 로그에만 기록
- **API 타임아웃**: KIS API 15초 AbortController
- **Redis**: TLS 지원, 연결/명령 타임아웃 5초

---

## 개발 가이드라인

- **언어**: TypeScript strict mode
- **함수**: `async/await`, Promise 체이닝 금지
- **네이밍**: 컴포넌트 PascalCase, 유틸/훅 camelCase, 상수 UPPER_SNAKE_CASE
- **주석**: 한국어, 복잡한 로직에만
- **파일 크기**: 300줄 이하 권장
- **에러 처리**: 시스템 경계(외부 API, 사용자 입력)에서만
- **Vercel**: 모든 API 라우트에 `export const runtime = "nodejs"`, maxDuration 120초
