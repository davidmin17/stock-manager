# CLAUDE.md — StockPilot: AI 멀티에이전트 주식 분석 시스템

## 프로젝트 개요

**StockPilot**은 5개의 AI 서브 에이전트가 병렬로 분석한 결과를 종합하여, 한국 주식(KOSPI/KOSDAQ) 종목의 투자 가치를 100점 만점으로 평가하는 웹 애플리케이션입니다.

- **앱 형태**: Next.js 풀스택 웹앱
- **배포**: Vercel (GitHub 연동 자동 배포)
- **로컬 개발**: `next dev`로 로컬 테스트 가능
- **인증**: 없음 (로그인 없이 바로 사용)
- **대상 시장**: 한국 주식 (KOSPI/KOSDAQ) — 추후 해외 확장 고려

---

## 기술 스택

### 프레임워크 & 런타임
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript 5**
- **Node.js 20+**

### UI & 스타일링
- **shadcn/ui** — 메인 컴포넌트 라이브러리
- **Tailwind CSS 4** — 유틸리티 스타일링
- **Lucide React** — 아이콘
- **Recharts** — 주가 차트, 재무 차트 시각화
- **Framer Motion** — 카드 로딩 애니메이션, 전환 효과

### AI & API
- **Google Gemini API** (`@google/genai` SDK)
  - 모델: `gemini-3.1-pro-preview`
  - 엔드포인트: `https://generativelanguage.googleapis.com/v1beta/`
  - 5개 서브 에이전트 모두 동일 모델 사용
  - 웹 검색 도구(Google Search Grounding) 활용
- **한국투자증권 Open API** (REST)
  - Base URL: `https://openapi.koreainvestment.com:9443`
  - 실전투자 환경 (실계좌)
  - OAuth 토큰 인증 (appkey + appsecret → access_token)

### 개발 도구
- **ESLint** + **Prettier**
- **pnpm** (패키지 매니저)

---

## 프로젝트 구조

```
stockpilot/
├── CLAUDE.md
├── .env.local                    # 환경 변수 (로컬)
├── .env.example                  # 환경 변수 템플릿
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 루트 레이아웃
│   │   ├── page.tsx              # 메인 페이지 (종목 입력 + 대시보드)
│   │   ├── globals.css
│   │   │
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts      # POST /api/analyze — 분석 오케스트레이터
│   │       ├── agents/
│   │       │   ├── news/
│   │       │   │   └── route.ts  # 에이전트 1: 뉴스/센티먼트 분석
│   │       │   ├── market-data/
│   │       │   │   └── route.ts  # 에이전트 2: 시세/거래량 분석
│   │       │   ├── financial/
│   │       │   │   └── route.ts  # 에이전트 3: 재무 분석
│   │       │   ├── risk/
│   │       │   │   └── route.ts  # 에이전트 4: 리스크 분석
│   │       │   └── synthesizer/
│   │       │       └── route.ts  # 에이전트 5: 종합 평가
│   │       ├── kis/
│   │       │   ├── token/
│   │       │   │   └── route.ts  # KIS OAuth 토큰 발급/갱신
│   │       │   ├── price/
│   │       │   │   └── route.ts  # KIS 현재가 시세 조회
│   │       │   ├── daily-price/
│   │       │   │   └── route.ts  # KIS 일별 시세 조회
│   │       │   ├── investor/
│   │       │   │   └── route.ts  # KIS 투자자별 매매동향
│   │       │   └── volume-rank/
│   │       │       └── route.ts  # KIS 거래량 순위
│   │       └── search/
│   │           └── route.ts      # 종목명 → 종목코드 검색 API
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 컴포넌트
│   │   ├── stock-search.tsx      # 종목 검색 입력 컴포넌트
│   │   ├── analysis-dashboard.tsx # 대시보드 컨테이너
│   │   ├── agent-card.tsx        # 개별 에이전트 결과 카드
│   │   ├── score-gauge.tsx       # 100점 만점 게이지 차트
│   │   ├── price-chart.tsx       # 주가 차트 (Recharts)
│   │   ├── financial-chart.tsx   # 재무 지표 차트
│   │   ├── risk-matrix.tsx       # 리스크 매트릭스 시각화
│   │   └── report-summary.tsx    # 최종 리포트 요약 카드
│   │
│   ├── lib/
│   │   ├── gemini.ts             # Gemini API 클라이언트 래퍼
│   │   ├── kis-api.ts            # 한국투자증권 API 클라이언트
│   │   ├── kis-token.ts          # KIS 토큰 관리 (발급/캐싱/갱신)
│   │   ├── stock-code.ts         # 종목명 ↔ 종목코드 매핑 유틸
│   │   ├── agents/
│   │   │   ├── types.ts          # 에이전트 공통 타입 정의
│   │   │   ├── prompts.ts        # 에이전트별 시스템 프롬프트
│   │   │   ├── news-agent.ts     # 에이전트 1 로직
│   │   │   ├── market-agent.ts   # 에이전트 2 로직
│   │   │   ├── financial-agent.ts # 에이전트 3 로직
│   │   │   ├── risk-agent.ts     # 에이전트 4 로직
│   │   │   └── synthesizer-agent.ts # 에이전트 5 로직
│   │   └── utils.ts              # 공통 유틸리티
│   │
│   ├── hooks/
│   │   ├── use-analysis.ts       # 분석 요청/상태 관리 훅
│   │   └── use-stock-search.ts   # 종목 검색 훅
│   │
│   └── types/
│       ├── agent.ts              # 에이전트 응답 타입
│       ├── stock.ts              # 주식 관련 타입
│       └── kis.ts                # KIS API 응답 타입
│
├── data/
│   └── stock-codes.json          # KOSPI/KOSDAQ 종목코드 매핑 데이터
│
└── public/
    └── ...
```

---

## 환경 변수

```bash
# .env.local

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# 한국투자증권 Open API (실전투자)
KIS_APP_KEY=your_appkey_36chars
KIS_APP_SECRET=your_appsecret_180chars
KIS_BASE_URL=https://openapi.koreainvestment.com:9443
KIS_ACCOUNT_NO=00000000-01          # 계좌번호 (8자리-2자리)
KIS_HTS_ID=your_hts_id              # HTS ID
```

---

## 에이전트 아키텍처

### 실행 흐름

```
사용자 입력 (종목명)
       │
       ▼
  종목코드 변환 (stock-codes.json / KIS API)
       │
       ▼
  ┌────┴────────────────────────────────────┐
  │         병렬 실행 (Promise.allSettled)      │
  │                                          │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  │ Agent 1  │  │ Agent 2  │  │ Agent 3  │  │ Agent 4  │
  │  │ 뉴스/센티 │  │ 시세/거래 │  │ 재무분석  │  │ 리스크   │
  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
  │       │             │             │             │
  └───────┴─────────────┴─────────────┴─────────────┘
                        │
                        ▼
                ┌──────────────┐
                │   Agent 5    │
                │  종합 평가    │
                │ (순차 실행)   │
                └──────┬───────┘
                       │
                       ▼
                  최종 리포트
```

### 프론트엔드 UX 흐름

1. 사용자가 종목명 입력 → 자동완성 드롭다운에서 선택
2. "분석 시작" 버튼 클릭
3. 대시보드에 5개 에이전트 카드가 스켈레톤 상태로 표시
4. **에이전트별 완료되는 대로 순차적으로 카드가 활성화** (SSE 스트리밍)
5. 4개 에이전트 모두 완료 → 5번 종합 에이전트 자동 실행
6. 최종 점수(100점) + 리포트 표시

---

## 에이전트 상세 명세

### Agent 1: 뉴스/센티먼트 분석 에이전트

**역할**: 해당 종목의 최신 뉴스, 섹터 동향, 커뮤니티 의견을 수집·분석

**데이터 소스** (Gemini의 Google Search Grounding 활용):
- 해당 종목 관련 최근 뉴스 (1주일 이내)
- 해당 섹터/업종 동향
- 투자 커뮤니티 의견 (네이버 종목토론방, 증권사 리포트 등)

**Gemini 호출 방식**:
```typescript
// @google/genai SDK 사용
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const response = await ai.models.generateContent({
  model: "gemini-3.1-pro-preview",
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  config: {
    tools: [{ googleSearch: {} }],  // Google Search Grounding 활성화
    temperature: 0.3,
  },
});
```

**출력 스키마** (JSON):
```typescript
interface NewsAgentResult {
  agentId: "news";
  score: number;              // 0-100 투자 매력도 점수
  sentiment: "매우긍정" | "긍정" | "중립" | "부정" | "매우부정";
  summary: string;            // 3-5줄 요약
  keyNews: {
    title: string;
    source: string;
    date: string;
    impact: "긍정" | "부정" | "중립";
    summary: string;
  }[];
  sectorTrend: string;        // 섹터 동향 요약
  communityOpinion: string;   // 커뮤니티 의견 요약
  investmentPoints: string[]; // 핵심 투자 포인트 (3-5개)
}
```

### Agent 2: 시세/거래량 분석 에이전트

**역할**: 한국투자증권 Open API를 통해 실시간 시세 데이터를 수집하고, 주가 흐름·거래량·수급을 분석

**데이터 소스** (KIS Open API):
- `FHKST01010100` — 주식현재가 시세
- `FHKST01010400` — 주식현재가 일자별 (최근 30일)
- `FHKST01010600` — 주식현재가 투자자별 매매동향
- `FHKST01010900` — 주식현재가 회원사별 매매동향 (기관/외인)

**KIS API 호출 예시**:
```typescript
// 현재가 시세 조회
const priceRes = await fetch(
  `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price`,
  {
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      authorization: `Bearer ${accessToken}`,
      appkey: KIS_APP_KEY,
      appsecret: KIS_APP_SECRET,
      tr_id: "FHKST01010100",
      custtype: "P",
    },
    params: {
      FID_COND_MRKT_DIV_CODE: "J",  // J: 주식
      FID_INPUT_ISCD: stockCode,      // 종목코드 (예: 005930)
    },
  }
);
```

**수집 후 Gemini에 전달하여 분석**:
- 수집한 시세 데이터를 JSON으로 정리
- Gemini에게 기술적 분석 요청 (추세, 지지/저항, 이동평균선 해석 등)

**출력 스키마** (JSON):
```typescript
interface MarketDataAgentResult {
  agentId: "market-data";
  score: number;                // 0-100 기술적 매력도 점수
  currentPrice: number;         // 현재가
  changeRate: number;           // 등락률 (%)
  volume: number;               // 거래량
  avgVolume: number;            // 평균 거래량 (20일)
  volumeRatio: number;          // 거래량 비율
  summary: string;              // 분석 요약
  trend: "상승추세" | "하락추세" | "횡보" | "추세전환";
  foreignBuy: string;           // 외국인 매매동향 요약
  institutionBuy: string;       // 기관 매매동향 요약
  technicalSignals: string[];   // 기술적 시그널 (3-5개)
  priceHistory: {               // 차트용 데이터 (최근 30일)
    date: string;
    close: number;
    volume: number;
  }[];
}
```

### Agent 3: 재무 분석 에이전트

**역할**: 웹 검색으로 해당 기업의 재무 정보를 수집·분석

**데이터 소스** (Gemini Google Search Grounding):
- 최근 분기 실적 (매출, 영업이익, 순이익)
- 연간 실적 추이 (최근 3년)
- PER, PBR, ROE, 부채비율 등 핵심 재무비율
- 증권사 컨센서스 (실적 전망)

**출력 스키마** (JSON):
```typescript
interface FinancialAgentResult {
  agentId: "financial";
  score: number;               // 0-100 재무 건전성 점수
  summary: string;             // 재무 분석 요약
  revenue: string;             // 최근 매출 (원)
  operatingProfit: string;     // 최근 영업이익 (원)
  netIncome: string;           // 최근 순이익 (원)
  per: number | null;          // PER
  pbr: number | null;          // PBR
  roe: number | null;          // ROE (%)
  debtRatio: number | null;    // 부채비율 (%)
  revenueGrowth: string;       // 매출 성장률 요약
  profitTrend: string;         // 수익성 추이 요약
  consensus: string;           // 증권사 컨센서스 요약
  investmentPoints: string[];  // 재무 관점 투자 포인트 (3-5개)
  financialData: {             // 차트용 연간 데이터
    year: string;
    revenue: number;
    operatingProfit: number;
    netIncome: number;
  }[];
}
```

### Agent 4: 리스크 분석 에이전트

**역할**: 최신 시장 동향을 파악하여 해당 종목의 투자 리스크를 분석

**데이터 소스** (Gemini Google Search Grounding):
- 국내외 거시경제 동향 (금리, 환율, 유가 등)
- 해당 산업/섹터 리스크 요인
- 규제 변화, 정책 리스크
- 지정학적 리스크
- 기업 고유 리스크 (경영권, 소송, ESG 등)

**출력 스키마** (JSON):
```typescript
interface RiskAgentResult {
  agentId: "risk";
  score: number;                // 0-100 (높을수록 리스크 낮음 = 안전)
  riskLevel: "매우높음" | "높음" | "보통" | "낮음" | "매우낮음";
  summary: string;              // 리스크 종합 요약
  macroRisks: {
    factor: string;
    level: "높음" | "보통" | "낮음";
    description: string;
  }[];
  sectorRisks: {
    factor: string;
    level: "높음" | "보통" | "낮음";
    description: string;
  }[];
  companyRisks: {
    factor: string;
    level: "높음" | "보통" | "낮음";
    description: string;
  }[];
  mitigationPoints: string[];   // 리스크 완화 요인 (있다면)
}
```

### Agent 5: 종합 평가 에이전트 (Synthesizer)

**역할**: Agent 1~4의 결과를 종합하여 최종 투자 가치 리포트를 생성

**입력**: Agent 1~4의 전체 결과 JSON

**출력 스키마** (JSON):
```typescript
interface SynthesizerAgentResult {
  agentId: "synthesizer";
  totalScore: number;           // 0-100 종합 투자 점수
  scoreBreakdown: {
    news: number;               // 뉴스/센티먼트 점수 (가중치 20%)
    marketData: number;         // 시세/수급 점수 (가중치 25%)
    financial: number;          // 재무 점수 (가중치 30%)
    risk: number;               // 리스크 점수 (가중치 25%)
  };
  recommendation: "강력매수" | "매수" | "중립" | "매도" | "강력매도";
  targetPrice: string;          // 목표 주가 (근거 포함)
  summary: string;              // 종합 평가 요약 (5-7줄)
  keyInvestmentPoints: {
    type: "강점" | "약점" | "기회" | "위협";
    point: string;
  }[];                          // SWOT 형태 투자 포인트 (8-12개)
  conclusion: string;           // 최종 결론 (2-3줄)
  disclaimer: string;           // 투자 유의사항 고정 문구
}
```

---

## API 라우트 상세

### POST `/api/analyze`

메인 오케스트레이터. SSE(Server-Sent Events)로 에이전트별 결과를 스트리밍합니다.

**Request**:
```json
{
  "stockName": "삼성전자",
  "stockCode": "005930"
}
```

**SSE Response 형식**:
```
event: agent-start
data: {"agentId": "news", "status": "running"}

event: agent-complete
data: {"agentId": "news", "result": { ... NewsAgentResult }}

event: agent-start
data: {"agentId": "market-data", "status": "running"}

event: agent-complete
data: {"agentId": "market-data", "result": { ... MarketDataAgentResult }}

...

event: agent-complete
data: {"agentId": "synthesizer", "result": { ... SynthesizerAgentResult }}

event: analysis-complete
data: {"status": "done"}
```

---

## 한국투자증권 API 연동 상세

### 토큰 관리 (`lib/kis-token.ts`)

```typescript
// 토큰은 서버 메모리에 캐싱 (약 24시간 유효)
let cachedToken: KisToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.accessToken;
  }
  // ... 토큰 발급 로직
}
```

### 사용할 KIS API 엔드포인트 목록

| 용도 | tr_id | URI | Method |
|------|-------|-----|--------|
| 현재가 시세 | FHKST01010100 | /uapi/domestic-stock/v1/quotations/inquire-price | GET |
| 일자별 시세 | FHKST01010400 | /uapi/domestic-stock/v1/quotations/inquire-daily-price | GET |
| 투자자별 매매 | FHKST01010600 | /uapi/domestic-stock/v1/quotations/inquire-investor | GET |
| 기간별 시세 | FHKST03010100 | /uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice | GET |

---

## Gemini API 연동 상세

### 클라이언트 초기화 (`lib/gemini.ts`)

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
```

### 에이전트별 Google Search Grounding 사용 여부

| 에이전트 | Google Search | KIS API | 설명 |
|---------|:---:|:---:|------|
| Agent 1 (뉴스) | O | X | 뉴스/커뮤니티 검색 |
| Agent 2 (시세) | X | O | KIS API 데이터 기반 분석 |
| Agent 3 (재무) | O | X | 재무제표/컨센서스 검색 |
| Agent 4 (리스크) | O | X | 시장 동향/리스크 검색 |
| Agent 5 (종합) | X | X | 1~4 결과만으로 종합 |

---

## 개발 가이드라인

### 코딩 컨벤션

- **언어**: TypeScript strict mode
- **함수**: `async/await` 사용, Promise 체이닝 금지
- **에러 처리**: 모든 API 호출에 try-catch, 사용자에게 의미 있는 에러 메시지 전달
- **네이밍**:
  - 컴포넌트: PascalCase (`AgentCard.tsx`)
  - 유틸/훅: camelCase (`useAnalysis.ts`)
  - 타입: PascalCase (`interface AgentResult`)
  - 상수: UPPER_SNAKE_CASE (`KIS_BASE_URL`)
- **주석**: 한국어, 복잡한 비즈니스 로직에만 작성
- **파일 크기**: 단일 파일 300줄 이하 권장, 초과 시 분리

### Vercel 배포 고려사항

- **Serverless Function 타임아웃**: Vercel Hobby 플랜 기준 60초
- **환경 변수**: Vercel Dashboard > Settings > Environment Variables에 등록
- **Edge Runtime 사용 불가**: KIS API fetch + Gemini SDK는 Node.js 런타임 필요
  - 모든 API 라우트에 `export const runtime = "nodejs"` 명시

---

## 주의사항

- **투자 면책**: 모든 분석 결과에 "본 분석은 AI 기반이며 투자 판단의 참고자료입니다. 투자 결정은 본인 책임 하에 이루어져야 합니다." 문구 필수 포함
- **API 키 보안**: 모든 API 키는 서버사이드에서만 사용, 클라이언트에 노출 금지
- **KIS API 호출 제한**: 초당 20건 이내, 429 에러 발생 시 재시도 로직 구현
- **Gemini API 비용**: `gemini-3.1-pro-preview`는 유료, 분석 1회당 약 5개 LLM 호출 발생
- **장외 시간 대응**: 장 마감 후에도 분석 가능하도록 전일 종가 기반 분석 지원
