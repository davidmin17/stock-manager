# StockPilot Phase 1+2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 풀스택 앱의 기반을 구축하고 5개 AI 분석 에이전트를 구현한다.

**Architecture:** Next.js 15 App Router 기반. KIS Open API로 시세 데이터 수집, Google Gemini API로 AI 분석. 서버사이드 API 라우트에서 모든 외부 API 호출 처리.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, shadcn/ui, Tailwind CSS 4, @google/genai, pnpm

**Reference:** 상세 스펙은 `CLAUDE.md` 참조

---

### Task 1: Next.js 프로젝트 초기 세팅

**Files:**
- Create: 프로젝트 루트 전체 (Next.js scaffolding)
- Create: `.env.example`
- Create: `.env.local` (기존 키 유지)

- [ ] **Step 1: Next.js 프로젝트 생성**

프로젝트 루트(`/Users/a201903062/workspace/stock-manager`)에서 Next.js를 초기화한다. 이미 CLAUDE.md가 있으므로 임시 디렉토리에 생성 후 파일을 옮긴다.

```bash
cd /Users/a201903062/workspace/stock-manager
npx create-next-app@latest tmp-next --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-pnpm
# tmp-next 내 파일들을 현재 디렉토리로 이동
cp -r tmp-next/* tmp-next/.* . 2>/dev/null || true
rm -rf tmp-next
```

- [ ] **Step 2: shadcn/ui 초기화**

```bash
pnpm dlx shadcn@latest init -d
```

- [ ] **Step 3: 필요한 의존성 설치**

```bash
pnpm add @google/genai recharts framer-motion lucide-react
```

- [ ] **Step 4: shadcn/ui 컴포넌트 추가**

```bash
pnpm dlx shadcn@latest add button input card badge skeleton separator scroll-area
```

- [ ] **Step 5: 환경변수 파일 작성**

`.env.example`:
```bash
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# 한국투자증권 Open API (실전투자)
KIS_APP_KEY=your_appkey_36chars
KIS_APP_SECRET=your_appsecret_180chars
KIS_BASE_URL=https://openapi.koreainvestment.com:9443
```

`.env.local`에 실제 키 값을 설정한다. `KIS_BASE_URL=https://openapi.koreainvestment.com:9443`도 추가한다.

- [ ] **Step 6: .gitignore 확인**

`.env.local`이 .gitignore에 포함되어 있는지 확인. Next.js 기본 .gitignore에 포함되어 있을 것이나 확인 필요.

- [ ] **Step 7: 개발 서버 실행 확인**

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속하여 Next.js 기본 페이지가 표시되는지 확인.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "feat: initialize Next.js 15 project with shadcn/ui and dependencies"
```

---

### Task 2: 타입 정의

**Files:**
- Create: `src/types/stock.ts`
- Create: `src/types/agent.ts`
- Create: `src/types/kis.ts`

- [ ] **Step 1: 주식 관련 타입 정의**

`src/types/stock.ts`:
```typescript
export interface StockInfo {
  code: string;       // 종목코드 (예: "005930")
  name: string;       // 종목명 (예: "삼성전자")
  market: "KOSPI" | "KOSDAQ";
}
```

- [ ] **Step 2: 에이전트 응답 타입 정의**

`src/types/agent.ts`:
```typescript
export type AgentId = "news" | "market-data" | "financial" | "risk" | "synthesizer";
export type AgentStatus = "idle" | "running" | "completed" | "error";

export interface NewsAgentResult {
  agentId: "news";
  score: number;
  sentiment: "매우긍정" | "긍정" | "중립" | "부정" | "매우부정";
  summary: string;
  keyNews: {
    title: string;
    source: string;
    date: string;
    impact: "긍정" | "부정" | "중립";
    summary: string;
  }[];
  sectorTrend: string;
  communityOpinion: string;
  investmentPoints: string[];
}

export interface MarketDataAgentResult {
  agentId: "market-data";
  score: number;
  currentPrice: number;
  changeRate: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  summary: string;
  trend: "상승추세" | "하락추세" | "횡보" | "추세전환";
  foreignBuy: string;
  institutionBuy: string;
  technicalSignals: string[];
  priceHistory: {
    date: string;
    close: number;
    volume: number;
  }[];
}

export interface FinancialAgentResult {
  agentId: "financial";
  score: number;
  summary: string;
  revenue: string;
  operatingProfit: string;
  netIncome: string;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  debtRatio: number | null;
  revenueGrowth: string;
  profitTrend: string;
  consensus: string;
  investmentPoints: string[];
  financialData: {
    year: string;
    revenue: number;
    operatingProfit: number;
    netIncome: number;
  }[];
}

export interface RiskAgentResult {
  agentId: "risk";
  score: number;
  riskLevel: "매우높음" | "높음" | "보통" | "낮음" | "매우낮음";
  summary: string;
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
  mitigationPoints: string[];
}

export interface SynthesizerAgentResult {
  agentId: "synthesizer";
  totalScore: number;
  scoreBreakdown: {
    news: number;
    marketData: number;
    financial: number;
    risk: number;
  };
  recommendation: "강력매수" | "매수" | "중립" | "매도" | "강력매도";
  targetPrice: string;
  summary: string;
  keyInvestmentPoints: {
    type: "강점" | "약점" | "기회" | "위협";
    point: string;
  }[];
  conclusion: string;
  disclaimer: string;
}

export type AgentResult =
  | NewsAgentResult
  | MarketDataAgentResult
  | FinancialAgentResult
  | RiskAgentResult
  | SynthesizerAgentResult;

export interface AgentCardState {
  agentId: AgentId;
  status: AgentStatus;
  result: AgentResult | null;
  error: string | null;
}

// SSE 이벤트 타입
export interface SSEAgentStartEvent {
  agentId: AgentId;
  status: "running";
}

export interface SSEAgentCompleteEvent {
  agentId: AgentId;
  result: AgentResult;
}

export interface SSEAgentErrorEvent {
  agentId: AgentId;
  error: string;
}

export interface SSEAnalysisCompleteEvent {
  status: "done";
}
```

- [ ] **Step 3: KIS API 응답 타입 정의**

`src/types/kis.ts`:
```typescript
// KIS OAuth 토큰 응답
export interface KisTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// 현재가 시세 응답 (FHKST01010100) — 주요 필드만
export interface KisPriceResponse {
  output: {
    stck_prpr: string;      // 현재가
    prdy_vrss: string;      // 전일 대비
    prdy_vrss_sign: string; // 전일 대비 부호 (1:상한, 2:상승, 3:보합, 4:하한, 5:하락)
    prdy_ctrt: string;      // 전일 대비율
    acml_vol: string;       // 누적 거래량
    acml_tr_pbmn: string;   // 누적 거래대금
    stck_oprc: string;      // 시가
    stck_hgpr: string;      // 고가
    stck_lwpr: string;      // 저가
    per: string;             // PER
    pbr: string;             // PBR
    hts_avls: string;        // 시가총액
  };
  rt_cd: string;
  msg_cd: string;
  msg1: string;
}

// 일자별 시세 응답 (FHKST01010400)
export interface KisDailyPriceItem {
  stck_bsop_date: string;  // 영업일자
  stck_clpr: string;       // 종가
  stck_oprc: string;       // 시가
  stck_hgpr: string;       // 고가
  stck_lwpr: string;       // 저가
  acml_vol: string;        // 누적 거래량
  prdy_vrss: string;       // 전일 대비
  prdy_vrss_sign: string;  // 전일 대비 부호
}

export interface KisDailyPriceResponse {
  output: KisDailyPriceItem[];
  rt_cd: string;
  msg_cd: string;
  msg1: string;
}

// 투자자별 매매동향 응답 (FHKST01010600)
export interface KisInvestorItem {
  stck_bsop_date: string;  // 영업일자
  prsn_ntby_qty: string;   // 개인 순매수 수량
  frgn_ntby_qty: string;   // 외국인 순매수 수량
  orgn_ntby_qty: string;   // 기관 순매수 수량
}

export interface KisInvestorResponse {
  output: KisInvestorItem[];
  rt_cd: string;
  msg_cd: string;
  msg1: string;
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/types/
git commit -m "feat: add type definitions for stock, agent, and KIS API"
```

---

### Task 3: KIS 토큰 관리

**Files:**
- Create: `src/lib/kis-token.ts`

- [ ] **Step 1: KIS 토큰 발급/캐싱 구현**

`src/lib/kis-token.ts`:
```typescript
interface KisToken {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
}

let cachedToken: KisToken | null = null;

const KIS_BASE_URL = process.env.KIS_BASE_URL!;
const KIS_APP_KEY = process.env.KIS_APP_KEY!;
const KIS_APP_SECRET = process.env.KIS_APP_SECRET!;

export async function getKisAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const res = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: KIS_APP_KEY,
      appsecret: KIS_APP_SECRET,
    }),
  });

  if (!res.ok) {
    throw new Error(`KIS token request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/kis-token.ts
git commit -m "feat: add KIS OAuth token management with caching"
```

---

### Task 4: KIS API 클라이언트

**Files:**
- Create: `src/lib/kis-api.ts`

- [ ] **Step 1: KIS API 클라이언트 구현**

`src/lib/kis-api.ts`:
```typescript
import { getKisAccessToken } from "./kis-token";
import type {
  KisPriceResponse,
  KisDailyPriceResponse,
  KisInvestorResponse,
} from "@/types/kis";

const KIS_BASE_URL = process.env.KIS_BASE_URL!;
const KIS_APP_KEY = process.env.KIS_APP_KEY!;
const KIS_APP_SECRET = process.env.KIS_APP_SECRET!;

async function kisGet<T>(
  path: string,
  trId: string,
  params: Record<string, string>
): Promise<T> {
  const token = await getKisAccessToken();
  const url = new URL(path, KIS_BASE_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      authorization: `Bearer ${token}`,
      appkey: KIS_APP_KEY,
      appsecret: KIS_APP_SECRET,
      tr_id: trId,
      custtype: "P",
    },
  });

  if (!res.ok) {
    throw new Error(`KIS API error [${trId}]: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/** 현재가 시세 조회 */
export async function getPrice(stockCode: string): Promise<KisPriceResponse> {
  return kisGet<KisPriceResponse>(
    "/uapi/domestic-stock/v1/quotations/inquire-price",
    "FHKST01010100",
    {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: stockCode,
    }
  );
}

/** 일자별 시세 조회 (최근 30일) */
export async function getDailyPrice(
  stockCode: string
): Promise<KisDailyPriceResponse> {
  return kisGet<KisDailyPriceResponse>(
    "/uapi/domestic-stock/v1/quotations/inquire-daily-price",
    "FHKST01010400",
    {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: stockCode,
      FID_PERIOD_DIV_CODE: "D",
      FID_ORG_ADJ_PRC: "0",
    }
  );
}

/** 투자자별 매매동향 조회 */
export async function getInvestorTrend(
  stockCode: string
): Promise<KisInvestorResponse> {
  return kisGet<KisInvestorResponse>(
    "/uapi/domestic-stock/v1/quotations/inquire-investor",
    "FHKST01010600",
    {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: stockCode,
    }
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/kis-api.ts
git commit -m "feat: add KIS API client for price, daily-price, and investor data"
```

---

### Task 5: Gemini API 클라이언트

**Files:**
- Create: `src/lib/gemini.ts`

- [ ] **Step 1: Gemini 클라이언트 래퍼 구현**

`src/lib/gemini.ts`:
```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function callGemini(params: {
  systemPrompt: string;
  userPrompt: string;
  useSearch?: boolean;
  temperature?: number;
}): Promise<Record<string, unknown>> {
  const {
    systemPrompt,
    userPrompt,
    useSearch = false,
    temperature = 0.3,
  } = params;

  const tools = useSearch ? [{ googleSearch: {} }] : undefined;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro-preview-05-06",
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: systemPrompt,
      tools,
      temperature,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "{}";
  // Gemini가 가끔 ```json ... ``` 으로 감싸는 경우 처리
  const cleaned = text.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
  return JSON.parse(cleaned);
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/lib/gemini.ts
git commit -m "feat: add Gemini API client wrapper with search grounding support"
```

---

### Task 6: 종목코드 매핑 및 검색

**Files:**
- Create: `data/stock-codes.json`
- Create: `src/lib/stock-code.ts`
- Create: `src/app/api/search/route.ts`

- [ ] **Step 1: 종목코드 JSON 데이터 준비**

KRX에서 KOSPI/KOSDAQ 종목 데이터를 스크립트로 가져와서 `data/stock-codes.json`에 저장한다. 형식:

```json
[
  { "code": "005930", "name": "삼성전자", "market": "KOSPI" },
  { "code": "000660", "name": "SK하이닉스", "market": "KOSPI" },
  { "code": "373220", "name": "LG에너지솔루션", "market": "KOSPI" }
]
```

스크립트로 KRX에서 전종목 데이터를 다운로드한다:

```bash
# scripts/fetch-stock-codes.ts 생성 후 실행
pnpm tsx scripts/fetch-stock-codes.ts
```

스크립트 내용 (`scripts/fetch-stock-codes.ts`):
```typescript
// KRX 전종목 기본정보 API에서 KOSPI/KOSDAQ 종목코드를 가져와 data/stock-codes.json에 저장
import fs from "fs";
import path from "path";

interface StockEntry {
  code: string;
  name: string;
  market: "KOSPI" | "KOSDAQ";
}

async function fetchMarket(market: "STK" | "KSQ"): Promise<StockEntry[]> {
  const res = await fetch(
    "http://data.krx.co.kr/comm/bldAttend498/getJsonData.cmd",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: new URLSearchParams({
        bld: "dbms/MDC/STAT/standard/MDCSTAT01901",
        mktId: market,
        share: "1",
        csvxls_isNo: "false",
      }),
    }
  );
  const data = await res.json();
  return (data.OutBlock_1 || []).map((item: Record<string, string>) => ({
    code: item.ISU_SRT_CD,
    name: item.ISU_ABBRV,
    market: market === "STK" ? "KOSPI" : "KOSDAQ",
  }));
}

async function main() {
  const [kospi, kosdaq] = await Promise.all([
    fetchMarket("STK"),
    fetchMarket("KSQ"),
  ]);
  const all = [...kospi, ...kosdaq].sort((a, b) => a.code.localeCompare(b.code));
  const outPath = path.join(process.cwd(), "data", "stock-codes.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(all, null, 2), "utf-8");
  console.log(`Saved ${all.length} stocks to ${outPath}`);
}

main().catch(console.error);
```

만약 KRX API가 접근 불가하면 주요 종목 100개 정도를 수동으로 작성한다.

- [ ] **Step 2: 종목 검색 유틸 구현**

`src/lib/stock-code.ts`:
```typescript
import stockData from "../../data/stock-codes.json";
import type { StockInfo } from "@/types/stock";

const stocks: StockInfo[] = stockData as StockInfo[];

// 초성 매핑 테이블
const CHO = [
  "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ",
  "ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ",
];

function getChosung(str: string): string {
  return [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return ch;
      return CHO[Math.floor(code / 588)];
    })
    .join("");
}

function isChosung(str: string): boolean {
  return [...str].every((ch) => CHO.includes(ch));
}

export function searchStocks(query: string, limit = 10): StockInfo[] {
  if (!query.trim()) return [];

  const q = query.trim().toLowerCase();

  if (isChosung(q)) {
    // 초성 검색
    return stocks
      .filter((s) => getChosung(s.name).startsWith(q))
      .slice(0, limit);
  }

  // 부분 문자열 매칭 (이름 또는 코드)
  return stocks
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.code.includes(q)
    )
    .slice(0, limit);
}

export function findStockByCode(code: string): StockInfo | undefined {
  return stocks.find((s) => s.code === code);
}

export function findStockByName(name: string): StockInfo | undefined {
  return stocks.find((s) => s.name === name);
}
```

- [ ] **Step 3: 검색 API 라우트 구현**

`src/app/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { searchStocks } from "@/lib/stock-code";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";

  const results = searchStocks(query, 10);
  return NextResponse.json(results);
}
```

- [ ] **Step 4: 커밋**

```bash
git add data/ scripts/ src/lib/stock-code.ts src/app/api/search/
git commit -m "feat: add stock code data, search utility with chosung support, and search API"
```

---

### Task 7: 에이전트 프롬프트 및 공통 로직

**Files:**
- Create: `src/lib/agents/types.ts`
- Create: `src/lib/agents/prompts.ts`

- [ ] **Step 1: 에이전트 공통 타입**

`src/lib/agents/types.ts`:
```typescript
export interface AgentConfig {
  agentId: string;
  systemPrompt: string;
  useSearch: boolean;
  temperature: number;
}
```

- [ ] **Step 2: 에이전트별 시스템 프롬프트 정의**

`src/lib/agents/prompts.ts`:
```typescript
export const NEWS_SYSTEM_PROMPT = `당신은 한국 주식 시장 전문 뉴스/센티먼트 분석가입니다.
주어진 종목에 대해 최신 뉴스, 섹터 동향, 투자 커뮤니티 의견을 종합 분석하세요.

반드시 아래 JSON 형식으로 응답하세요:
{
  "agentId": "news",
  "score": (0-100 투자 매력도 점수),
  "sentiment": ("매우긍정" | "긍정" | "중립" | "부정" | "매우부정"),
  "summary": "(3-5줄 요약)",
  "keyNews": [
    { "title": "뉴스 제목", "source": "출처", "date": "YYYY-MM-DD", "impact": ("긍정"|"부정"|"중립"), "summary": "한줄 요약" }
  ],
  "sectorTrend": "(섹터 동향 요약)",
  "communityOpinion": "(커뮤니티 의견 요약)",
  "investmentPoints": ["핵심 투자 포인트 1", "포인트 2", ...]
}`;

export const MARKET_DATA_SYSTEM_PROMPT = `당신은 한국 주식 시장 전문 기술적 분석가입니다.
주어진 시세 데이터를 분석하여 주가 흐름, 거래량, 수급 동향을 평가하세요.

반드시 아래 JSON 형식으로 응답하세요:
{
  "agentId": "market-data",
  "score": (0-100 기술적 매력도 점수),
  "currentPrice": (현재가 숫자),
  "changeRate": (등락률 숫자),
  "volume": (거래량 숫자),
  "avgVolume": (20일 평균 거래량 숫자),
  "volumeRatio": (거래량 비율 숫자),
  "summary": "(분석 요약)",
  "trend": ("상승추세" | "하락추세" | "횡보" | "추세전환"),
  "foreignBuy": "(외국인 매매동향 요약)",
  "institutionBuy": "(기관 매매동향 요약)",
  "technicalSignals": ["시그널 1", "시그널 2", ...],
  "priceHistory": [
    { "date": "YYYY-MM-DD", "close": 숫자, "volume": 숫자 }
  ]
}`;

export const FINANCIAL_SYSTEM_PROMPT = `당신은 한국 주식 시장 전문 재무 분석가입니다.
주어진 종목의 재무 정보를 검색하고 분석하여 재무 건전성을 평가하세요.

반드시 아래 JSON 형식으로 응답하세요:
{
  "agentId": "financial",
  "score": (0-100 재무 건전성 점수),
  "summary": "(재무 분석 요약)",
  "revenue": "(최근 매출)",
  "operatingProfit": "(최근 영업이익)",
  "netIncome": "(최근 순이익)",
  "per": (PER 숫자 또는 null),
  "pbr": (PBR 숫자 또는 null),
  "roe": (ROE % 숫자 또는 null),
  "debtRatio": (부채비율 % 숫자 또는 null),
  "revenueGrowth": "(매출 성장률 요약)",
  "profitTrend": "(수익성 추이 요약)",
  "consensus": "(증권사 컨센서스 요약)",
  "investmentPoints": ["포인트 1", "포인트 2", ...],
  "financialData": [
    { "year": "2024", "revenue": 숫자, "operatingProfit": 숫자, "netIncome": 숫자 }
  ]
}`;

export const RISK_SYSTEM_PROMPT = `당신은 한국 주식 시장 전문 리스크 분석가입니다.
주어진 종목의 투자 리스크를 거시경제, 섹터, 기업 차원에서 종합 분석하세요.
점수는 높을수록 리스크가 낮음(안전)을 의미합니다.

반드시 아래 JSON 형식으로 응답하세요:
{
  "agentId": "risk",
  "score": (0-100, 높을수록 안전),
  "riskLevel": ("매우높음" | "높음" | "보통" | "낮음" | "매우낮음"),
  "summary": "(리스크 종합 요약)",
  "macroRisks": [
    { "factor": "요인명", "level": ("높음"|"보통"|"낮음"), "description": "설명" }
  ],
  "sectorRisks": [
    { "factor": "요인명", "level": ("높음"|"보통"|"낮음"), "description": "설명" }
  ],
  "companyRisks": [
    { "factor": "요인명", "level": ("높음"|"보통"|"낮음"), "description": "설명" }
  ],
  "mitigationPoints": ["완화 요인 1", ...]
}`;

export const SYNTHESIZER_SYSTEM_PROMPT = `당신은 한국 주식 투자 종합 평가 전문가입니다.
4개 에이전트(뉴스/센티먼트, 시세/거래량, 재무, 리스크)의 분석 결과를 종합하여 최종 투자 가치를 평가하세요.

가중치:
- 뉴스/센티먼트: 20%
- 시세/수급: 25%
- 재무: 30%
- 리스크: 25%

반드시 아래 JSON 형식으로 응답하세요:
{
  "agentId": "synthesizer",
  "totalScore": (0-100 종합 점수),
  "scoreBreakdown": {
    "news": (뉴스 점수),
    "marketData": (시세 점수),
    "financial": (재무 점수),
    "risk": (리스크 점수)
  },
  "recommendation": ("강력매수" | "매수" | "중립" | "매도" | "강력매도"),
  "targetPrice": "(목표 주가 + 근거)",
  "summary": "(종합 평가 요약 5-7줄)",
  "keyInvestmentPoints": [
    { "type": ("강점"|"약점"|"기회"|"위협"), "point": "설명" }
  ],
  "conclusion": "(최종 결론 2-3줄)",
  "disclaimer": "본 분석은 AI 기반이며 투자 판단의 참고자료입니다. 투자 결정은 본인 책임 하에 이루어져야 합니다."
}`;
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/agents/
git commit -m "feat: add agent types and system prompts for all 5 agents"
```

---

### Task 8: 뉴스/센티먼트 에이전트 (Agent 1)

**Files:**
- Create: `src/lib/agents/news-agent.ts`
- Create: `src/app/api/agents/news/route.ts`

- [ ] **Step 1: 뉴스 에이전트 로직 구현**

`src/lib/agents/news-agent.ts`:
```typescript
import { callGemini } from "@/lib/gemini";
import { NEWS_SYSTEM_PROMPT } from "./prompts";
import type { NewsAgentResult } from "@/types/agent";

export async function runNewsAgent(
  stockName: string,
  stockCode: string
): Promise<NewsAgentResult> {
  const userPrompt = `종목명: ${stockName} (종목코드: ${stockCode})

다음 항목을 분석해주세요:
1. 최근 1주일 이내 해당 종목 관련 주요 뉴스
2. 해당 섹터/업종의 최근 동향
3. 투자 커뮤니티(네이버 종목토론방, 증권사 리포트 등)의 의견
4. 종합적인 뉴스/센티먼트 기반 투자 매력도 점수 (0-100)`;

  const result = await callGemini({
    systemPrompt: NEWS_SYSTEM_PROMPT,
    userPrompt,
    useSearch: true,
    temperature: 0.3,
  });

  return result as unknown as NewsAgentResult;
}
```

- [ ] **Step 2: 뉴스 에이전트 API 라우트**

`src/app/api/agents/news/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { runNewsAgent } from "@/lib/agents/news-agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { stockName, stockCode } = await req.json();
    const result = await runNewsAgent(stockName, stockCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Agent Error] news:", error);
    return NextResponse.json(
      { error: "뉴스 분석 실패", details: String(error) },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/agents/news-agent.ts src/app/api/agents/news/
git commit -m "feat: add news/sentiment analysis agent"
```

---

### Task 9: 시세/거래량 에이전트 (Agent 2)

**Files:**
- Create: `src/lib/agents/market-agent.ts`
- Create: `src/app/api/agents/market-data/route.ts`

- [ ] **Step 1: 시세 에이전트 로직 구현**

`src/lib/agents/market-agent.ts`:
```typescript
import { getPrice, getDailyPrice, getInvestorTrend } from "@/lib/kis-api";
import { callGemini } from "@/lib/gemini";
import { MARKET_DATA_SYSTEM_PROMPT } from "./prompts";
import type { MarketDataAgentResult } from "@/types/agent";

export async function runMarketDataAgent(
  stockCode: string
): Promise<MarketDataAgentResult> {
  // KIS API에서 데이터 수집 (병렬)
  const [priceData, dailyData, investorData] = await Promise.all([
    getPrice(stockCode),
    getDailyPrice(stockCode),
    getInvestorTrend(stockCode),
  ]);

  const marketDataJson = JSON.stringify(
    {
      currentPrice: priceData.output,
      dailyPrices: dailyData.output?.slice(0, 30),
      investorTrend: investorData.output?.slice(0, 20),
    },
    null,
    2
  );

  const userPrompt = `종목코드: ${stockCode}

아래는 한국투자증권 API에서 조회한 실시간 시세 데이터입니다:

${marketDataJson}

이 데이터를 기반으로 기술적 분석을 수행해주세요:
1. 주가 추세 분석 (이동평균선, 지지/저항)
2. 거래량 분석 (평균 대비 비율, 특이 거래량)
3. 외국인/기관 수급 분석
4. 종합 기술적 매력도 점수 (0-100)`;

  const result = await callGemini({
    systemPrompt: MARKET_DATA_SYSTEM_PROMPT,
    userPrompt,
    useSearch: false,
    temperature: 0.3,
  });

  return result as unknown as MarketDataAgentResult;
}
```

- [ ] **Step 2: 시세 에이전트 API 라우트**

`src/app/api/agents/market-data/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { runMarketDataAgent } from "@/lib/agents/market-agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { stockCode } = await req.json();
    const result = await runMarketDataAgent(stockCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Agent Error] market-data:", error);
    return NextResponse.json(
      { error: "시세 분석 실패", details: String(error) },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/agents/market-agent.ts src/app/api/agents/market-data/
git commit -m "feat: add market data analysis agent with KIS API integration"
```

---

### Task 10: 재무 분석 에이전트 (Agent 3)

**Files:**
- Create: `src/lib/agents/financial-agent.ts`
- Create: `src/app/api/agents/financial/route.ts`

- [ ] **Step 1: 재무 에이전트 로직 구현**

`src/lib/agents/financial-agent.ts`:
```typescript
import { callGemini } from "@/lib/gemini";
import { FINANCIAL_SYSTEM_PROMPT } from "./prompts";
import type { FinancialAgentResult } from "@/types/agent";

export async function runFinancialAgent(
  stockName: string,
  stockCode: string
): Promise<FinancialAgentResult> {
  const userPrompt = `종목명: ${stockName} (종목코드: ${stockCode})

다음 항목을 검색하고 분석해주세요:
1. 최근 분기 실적 (매출, 영업이익, 순이익)
2. 연간 실적 추이 (최근 3년)
3. 핵심 재무비율 (PER, PBR, ROE, 부채비율)
4. 증권사 컨센서스 (실적 전망)
5. 종합 재무 건전성 점수 (0-100)`;

  const result = await callGemini({
    systemPrompt: FINANCIAL_SYSTEM_PROMPT,
    userPrompt,
    useSearch: true,
    temperature: 0.3,
  });

  return result as unknown as FinancialAgentResult;
}
```

- [ ] **Step 2: 재무 에이전트 API 라우트**

`src/app/api/agents/financial/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { runFinancialAgent } from "@/lib/agents/financial-agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { stockName, stockCode } = await req.json();
    const result = await runFinancialAgent(stockName, stockCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Agent Error] financial:", error);
    return NextResponse.json(
      { error: "재무 분석 실패", details: String(error) },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/agents/financial-agent.ts src/app/api/agents/financial/
git commit -m "feat: add financial analysis agent"
```

---

### Task 11: 리스크 분석 에이전트 (Agent 4)

**Files:**
- Create: `src/lib/agents/risk-agent.ts`
- Create: `src/app/api/agents/risk/route.ts`

- [ ] **Step 1: 리스크 에이전트 로직 구현**

`src/lib/agents/risk-agent.ts`:
```typescript
import { callGemini } from "@/lib/gemini";
import { RISK_SYSTEM_PROMPT } from "./prompts";
import type { RiskAgentResult } from "@/types/agent";

export async function runRiskAgent(
  stockName: string,
  stockCode: string
): Promise<RiskAgentResult> {
  const userPrompt = `종목명: ${stockName} (종목코드: ${stockCode})

다음 항목을 검색하고 분석해주세요:
1. 국내외 거시경제 동향 (금리, 환율, 유가 등)이 해당 종목에 미치는 영향
2. 해당 산업/섹터의 리스크 요인
3. 규제 변화 및 정책 리스크
4. 지정학적 리스크
5. 기업 고유 리스크 (경영권, 소송, ESG 등)
6. 종합 안전성 점수 (0-100, 높을수록 안전)`;

  const result = await callGemini({
    systemPrompt: RISK_SYSTEM_PROMPT,
    userPrompt,
    useSearch: true,
    temperature: 0.3,
  });

  return result as unknown as RiskAgentResult;
}
```

- [ ] **Step 2: 리스크 에이전트 API 라우트**

`src/app/api/agents/risk/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { runRiskAgent } from "@/lib/agents/risk-agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { stockName, stockCode } = await req.json();
    const result = await runRiskAgent(stockName, stockCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Agent Error] risk:", error);
    return NextResponse.json(
      { error: "리스크 분석 실패", details: String(error) },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/agents/risk-agent.ts src/app/api/agents/risk/
git commit -m "feat: add risk analysis agent"
```

---

### Task 12: 종합 평가 에이전트 (Agent 5)

**Files:**
- Create: `src/lib/agents/synthesizer-agent.ts`
- Create: `src/app/api/agents/synthesizer/route.ts`

- [ ] **Step 1: 종합 평가 에이전트 로직 구현**

`src/lib/agents/synthesizer-agent.ts`:
```typescript
import { callGemini } from "@/lib/gemini";
import { SYNTHESIZER_SYSTEM_PROMPT } from "./prompts";
import type { SynthesizerAgentResult, AgentResult } from "@/types/agent";

export async function runSynthesizerAgent(
  agentResults: PromiseSettledResult<AgentResult>[]
): Promise<SynthesizerAgentResult> {
  const settled = agentResults.map((r, i) => {
    const ids = ["news", "market-data", "financial", "risk"];
    if (r.status === "fulfilled") return r.value;
    return { agentId: ids[i], error: String(r.reason), score: 0 };
  });

  const userPrompt = `아래는 4개 분석 에이전트의 결과입니다:

${JSON.stringify(settled, null, 2)}

위 결과를 종합하여 최종 투자 가치를 평가해주세요.
가중치: 뉴스/센티먼트 20%, 시세/수급 25%, 재무 30%, 리스크 25%
SWOT 분석 형태로 8-12개 투자 포인트를 제시해주세요.`;

  const result = await callGemini({
    systemPrompt: SYNTHESIZER_SYSTEM_PROMPT,
    userPrompt,
    useSearch: false,
    temperature: 0.3,
  });

  return result as unknown as SynthesizerAgentResult;
}
```

- [ ] **Step 2: 종합 평가 에이전트 API 라우트**

`src/app/api/agents/synthesizer/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { runSynthesizerAgent } from "@/lib/agents/synthesizer-agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { agentResults } = await req.json();
    const settled = agentResults.map((r: Record<string, unknown>) => ({
      status: "fulfilled" as const,
      value: r,
    }));
    const result = await runSynthesizerAgent(settled);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Agent Error] synthesizer:", error);
    return NextResponse.json(
      { error: "종합 평가 실패", details: String(error) },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/lib/agents/synthesizer-agent.ts src/app/api/agents/synthesizer/
git commit -m "feat: add synthesizer agent for comprehensive evaluation"
```

---

### Task 13: SSE 오케스트레이터

**Files:**
- Create: `src/app/api/analyze/route.ts`

- [ ] **Step 1: SSE 오케스트레이터 구현**

`src/app/api/analyze/route.ts`:
```typescript
import { runNewsAgent } from "@/lib/agents/news-agent";
import { runMarketDataAgent } from "@/lib/agents/market-agent";
import { runFinancialAgent } from "@/lib/agents/financial-agent";
import { runRiskAgent } from "@/lib/agents/risk-agent";
import { runSynthesizerAgent } from "@/lib/agents/synthesizer-agent";
import type { AgentId, AgentResult } from "@/types/agent";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const { stockName, stockCode } = await req.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const agentConfigs: {
        id: AgentId;
        run: () => Promise<AgentResult>;
      }[] = [
        { id: "news", run: () => runNewsAgent(stockName, stockCode) },
        { id: "market-data", run: () => runMarketDataAgent(stockCode) },
        { id: "financial", run: () => runFinancialAgent(stockName, stockCode) },
        { id: "risk", run: () => runRiskAgent(stockName, stockCode) },
      ];

      // 모든 에이전트 시작 알림
      for (const { id } of agentConfigs) {
        send("agent-start", { agentId: id, status: "running" });
      }

      // 1~4번 에이전트 병렬 실행, 각각 완료 시 즉시 전송
      const results = await Promise.allSettled(
        agentConfigs.map(async ({ id, run }) => {
          try {
            const result = await run();
            send("agent-complete", { agentId: id, result });
            return result;
          } catch (error) {
            send("agent-error", { agentId: id, error: String(error) });
            throw error;
          }
        })
      );

      // 5번 종합 에이전트 순차 실행
      send("agent-start", { agentId: "synthesizer", status: "running" });
      try {
        const synthesized = await runSynthesizerAgent(results);
        send("agent-complete", { agentId: "synthesizer", result: synthesized });
      } catch (error) {
        send("agent-error", { agentId: "synthesizer", error: String(error) });
      }

      send("analysis-complete", { status: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/api/analyze/
git commit -m "feat: add SSE orchestrator for parallel agent execution"
```

---

### Task 14: 프론트엔드 — 종목 검색 컴포넌트

**Files:**
- Create: `src/hooks/use-stock-search.ts`
- Create: `src/components/stock-search.tsx`

- [ ] **Step 1: 종목 검색 훅**

`src/hooks/use-stock-search.ts`:
```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import type { StockInfo } from "@/types/stock";

export function useStockSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<StockInfo | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data: StockInfo[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const selectStock = (stock: StockInfo) => {
    setSelected(stock);
    setQuery(stock.name);
    setResults([]);
  };

  const clear = () => {
    setQuery("");
    setSelected(null);
    setResults([]);
  };

  return { query, setQuery, results, isLoading, selected, selectStock, clear };
}
```

- [ ] **Step 2: 종목 검색 UI 컴포넌트**

`src/components/stock-search.tsx`:
```tsx
"use client";

import { useStockSearch } from "@/hooks/use-stock-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { StockInfo } from "@/types/stock";

interface StockSearchProps {
  onAnalyze: (stock: StockInfo) => void;
  isAnalyzing: boolean;
}

export function StockSearch({ onAnalyze, isAnalyzing }: StockSearchProps) {
  const { query, setQuery, results, selected, selectStock, clear } =
    useStockSearch();

  return (
    <div className="flex gap-3 items-start">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="종목명을 입력하세요... (예: 삼성전자, ㅅㅅ)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
          disabled={isAnalyzing}
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
            {results.map((stock) => (
              <button
                key={stock.code}
                onClick={() => selectStock(stock)}
                className="w-full px-4 py-2 text-left hover:bg-accent flex justify-between items-center"
              >
                <span className="font-medium">{stock.name}</span>
                <span className="text-sm text-muted-foreground">
                  {stock.code} · {stock.market}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={() => selected && onAnalyze(selected)}
        disabled={!selected || isAnalyzing}
        size="lg"
      >
        {isAnalyzing ? "분석 중..." : "분석 시작"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/use-stock-search.ts src/components/stock-search.tsx
git commit -m "feat: add stock search component with autocomplete and chosung support"
```

---

### Task 15: 프론트엔드 — 분석 상태 관리 훅

**Files:**
- Create: `src/hooks/use-analysis.ts`

- [ ] **Step 1: SSE 기반 분석 상태 관리 훅**

`src/hooks/use-analysis.ts`:
```typescript
"use client";

import { useState, useCallback } from "react";
import type {
  AgentId,
  AgentCardState,
  AgentResult,
} from "@/types/agent";
import type { StockInfo } from "@/types/stock";

const AGENT_IDS: AgentId[] = ["news", "market-data", "financial", "risk", "synthesizer"];

function createInitialStates(): AgentCardState[] {
  return AGENT_IDS.map((id) => ({
    agentId: id,
    status: "idle",
    result: null,
    error: null,
  }));
}

export function useAnalysis() {
  const [agentStates, setAgentStates] = useState<AgentCardState[]>(createInitialStates());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStock, setCurrentStock] = useState<StockInfo | null>(null);

  const updateAgent = useCallback(
    (agentId: AgentId, update: Partial<AgentCardState>) => {
      setAgentStates((prev) =>
        prev.map((s) => (s.agentId === agentId ? { ...s, ...update } : s))
      );
    },
    []
  );

  const startAnalysis = useCallback(
    async (stock: StockInfo) => {
      setCurrentStock(stock);
      setIsAnalyzing(true);
      setAgentStates(createInitialStates());

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stockName: stock.name,
            stockCode: stock.code,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Analysis request failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              handleSSEEvent(eventType, data, updateAgent);
            }
          }
        }
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [updateAgent]
  );

  const reset = useCallback(() => {
    setAgentStates(createInitialStates());
    setIsAnalyzing(false);
    setCurrentStock(null);
  }, []);

  return { agentStates, isAnalyzing, currentStock, startAnalysis, reset };
}

function handleSSEEvent(
  event: string,
  data: Record<string, unknown>,
  updateAgent: (id: AgentId, update: Partial<AgentCardState>) => void
) {
  switch (event) {
    case "agent-start":
      updateAgent(data.agentId as AgentId, { status: "running" });
      break;
    case "agent-complete":
      updateAgent(data.agentId as AgentId, {
        status: "completed",
        result: data.result as AgentResult,
      });
      break;
    case "agent-error":
      updateAgent(data.agentId as AgentId, {
        status: "error",
        error: data.error as string,
      });
      break;
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/use-analysis.ts
git commit -m "feat: add SSE-based analysis state management hook"
```

---

### Task 16: 프론트엔드 — 에이전트 카드 컴포넌트

**Files:**
- Create: `src/components/agent-card.tsx`
- Create: `src/components/score-gauge.tsx`

- [ ] **Step 1: 점수 게이지 컴포넌트**

`src/components/score-gauge.tsx`:
```tsx
"use client";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "lg";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-yellow-500";
  if (score >= 40) return "stroke-orange-500";
  return "stroke-red-500";
}

export function ScoreGauge({ score, size = "sm" }: ScoreGaugeProps) {
  const radius = size === "lg" ? 45 : 30;
  const svgSize = size === "lg" ? 120 : 80;
  const strokeWidth = size === "lg" ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={getScoreBg(score)}
        />
      </svg>
      <span
        className={`absolute font-bold ${getScoreColor(score)} ${
          size === "lg" ? "text-2xl" : "text-sm"
        }`}
      >
        {score}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: 에이전트 카드 컴포넌트**

`src/components/agent-card.tsx`:
```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreGauge } from "./score-gauge";
import { Newspaper, BarChart3, DollarSign, ShieldAlert, Trophy } from "lucide-react";
import type { AgentCardState, AgentId } from "@/types/agent";

const AGENT_META: Record<AgentId, { icon: React.ElementType; title: string; color: string }> = {
  news: { icon: Newspaper, title: "뉴스/센티먼트", color: "text-blue-500" },
  "market-data": { icon: BarChart3, title: "시세/거래량", color: "text-emerald-500" },
  financial: { icon: DollarSign, title: "재무 분석", color: "text-amber-500" },
  risk: { icon: ShieldAlert, title: "리스크 분석", color: "text-red-500" },
  synthesizer: { icon: Trophy, title: "종합 평가", color: "text-purple-500" },
};

export function AgentCard({ agentId, status, result, error }: AgentCardState) {
  const meta = AGENT_META[agentId];
  const Icon = meta.icon;

  return (
    <Card className={`transition-all duration-300 ${status === "idle" ? "opacity-50" : ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-5 w-5 ${meta.color}`} />
          {meta.title}
          {status === "running" && (
            <Badge variant="secondary" className="ml-auto animate-pulse">
              분석 중...
            </Badge>
          )}
          {status === "error" && (
            <Badge variant="destructive" className="ml-auto">오류</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === "running" && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {status === "completed" && result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ScoreGauge score={"score" in result ? (result.score as number) : ("totalScore" in result ? (result.totalScore as number) : 0)} />
              <p className="text-sm text-muted-foreground flex-1">
                {result.summary}
              </p>
            </div>
          </div>
        )}
        {status === "idle" && (
          <p className="text-sm text-muted-foreground">대기 중</p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/agent-card.tsx src/components/score-gauge.tsx
git commit -m "feat: add agent card and score gauge components"
```

---

### Task 17: 프론트엔드 — 대시보드 및 리포트

**Files:**
- Create: `src/components/analysis-dashboard.tsx`
- Create: `src/components/report-summary.tsx`

- [ ] **Step 1: 대시보드 컨테이너**

`src/components/analysis-dashboard.tsx`:
```tsx
"use client";

import { AgentCard } from "./agent-card";
import { ReportSummary } from "./report-summary";
import type { AgentCardState } from "@/types/agent";
import type { SynthesizerAgentResult } from "@/types/agent";

interface AnalysisDashboardProps {
  agentStates: AgentCardState[];
}

export function AnalysisDashboard({ agentStates }: AnalysisDashboardProps) {
  const subAgents = agentStates.filter((s) => s.agentId !== "synthesizer");
  const synthesizer = agentStates.find((s) => s.agentId === "synthesizer");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subAgents.map((state) => (
          <AgentCard key={state.agentId} {...state} />
        ))}
      </div>

      {synthesizer && synthesizer.status !== "idle" && (
        <div>
          {synthesizer.status === "completed" && synthesizer.result ? (
            <ReportSummary result={synthesizer.result as SynthesizerAgentResult} />
          ) : (
            <AgentCard {...synthesizer} />
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 최종 리포트 요약 카드**

`src/components/report-summary.tsx`:
```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "./score-gauge";
import { Trophy } from "lucide-react";
import type { SynthesizerAgentResult } from "@/types/agent";

interface ReportSummaryProps {
  result: SynthesizerAgentResult;
}

const RECOMMENDATION_COLOR: Record<string, string> = {
  강력매수: "bg-green-600",
  매수: "bg-green-500",
  중립: "bg-yellow-500",
  매도: "bg-red-500",
  강력매도: "bg-red-600",
};

const SWOT_COLOR: Record<string, string> = {
  강점: "text-green-600",
  약점: "text-red-500",
  기회: "text-blue-500",
  위협: "text-orange-500",
};

export function ReportSummary({ result }: ReportSummaryProps) {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-purple-500" />
          종합 평가
          <Badge className={`ml-auto ${RECOMMENDATION_COLOR[result.recommendation] ?? "bg-gray-500"} text-white`}>
            {result.recommendation}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 점수 + 요약 */}
        <div className="flex items-start gap-6">
          <ScoreGauge score={result.totalScore} size="lg" />
          <div className="flex-1 space-y-2">
            <p className="text-sm leading-relaxed">{result.summary}</p>
            {result.targetPrice && (
              <p className="text-sm font-medium">목표가: {result.targetPrice}</p>
            )}
          </div>
        </div>

        {/* 점수 내역 */}
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          {[
            { label: "뉴스", score: result.scoreBreakdown.news },
            { label: "시세", score: result.scoreBreakdown.marketData },
            { label: "재무", score: result.scoreBreakdown.financial },
            { label: "리스크", score: result.scoreBreakdown.risk },
          ].map(({ label, score }) => (
            <div key={label} className="p-2 rounded bg-muted/50">
              <div className="text-muted-foreground">{label}</div>
              <div className="font-bold text-lg">{score}</div>
            </div>
          ))}
        </div>

        {/* SWOT 투자 포인트 */}
        {result.keyInvestmentPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">투자 포인트</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {result.keyInvestmentPoints.map((p, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span className={`font-medium ${SWOT_COLOR[p.type] ?? ""}`}>
                    [{p.type}]
                  </span>
                  <span>{p.point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 결론 */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">{result.conclusion}</p>
        </div>

        {/* 면책 */}
        <p className="text-xs text-muted-foreground text-center">
          {result.disclaimer}
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/analysis-dashboard.tsx src/components/report-summary.tsx
git commit -m "feat: add analysis dashboard and report summary components"
```

---

### Task 18: 메인 페이지 조립

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: 메인 페이지 구현**

`src/app/page.tsx`:
```tsx
"use client";

import { StockSearch } from "@/components/stock-search";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import { useAnalysis } from "@/hooks/use-analysis";

export default function Home() {
  const { agentStates, isAnalyzing, currentStock, startAnalysis } =
    useAnalysis();

  const hasResults = agentStates.some((s) => s.status !== "idle");

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            StockPilot
          </h1>
          <p className="text-muted-foreground">
            AI 멀티에이전트 주식 분석 시스템
          </p>
        </div>

        {/* 종목 검색 */}
        <StockSearch onAnalyze={startAnalysis} isAnalyzing={isAnalyzing} />

        {/* 현재 분석 종목 표시 */}
        {currentStock && (
          <div className="text-center">
            <span className="text-lg font-semibold">{currentStock.name}</span>
            <span className="text-muted-foreground ml-2">
              ({currentStock.code} · {currentStock.market})
            </span>
          </div>
        )}

        {/* 대시보드 */}
        {hasResults && <AnalysisDashboard agentStates={agentStates} />}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 레이아웃 수정**

`src/app/layout.tsx` — 메타데이터를 StockPilot에 맞게 수정:
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StockPilot — AI 주식 분석",
  description: "AI 멀티에이전트 한국 주식 분석 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: globals.css 정리**

기본 Next.js globals.css에서 불필요한 데모 스타일을 제거하고 Tailwind base만 유지:
```css
@import "tailwindcss";
```

(shadcn/ui 초기화 시 이미 적절히 설정되었을 수 있으므로 확인 후 수정)

- [ ] **Step 4: 빌드 확인**

```bash
pnpm build
```

빌드 에러가 없는지 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add src/app/
git commit -m "feat: wire up main page with stock search and analysis dashboard"
```

---

### Task 19: 통합 테스트 및 디버깅

- [ ] **Step 1: 개발 서버 실행 후 수동 테스트**

```bash
pnpm dev
```

1. 브라우저에서 `http://localhost:3000` 접속
2. 종목 검색 테스트: "삼성전자" 입력 → 자동완성 → 선택
3. "분석 시작" 클릭 → 에이전트 카드가 순차적으로 활성화되는지 확인
4. 최종 리포트가 정상 출력되는지 확인

- [ ] **Step 2: 발견된 버그 수정**

테스트 중 발견된 이슈를 수정한다.

- [ ] **Step 3: 최종 커밋**

```bash
git add -A
git commit -m "fix: resolve integration issues from manual testing"
```
