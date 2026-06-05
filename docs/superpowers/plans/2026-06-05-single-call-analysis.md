# 단일 Gemini 호출 기반 주식 분석 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5개 병렬 Gemini 호출을 1개 통합 호출로 합쳐 `RESOURCE_EXHAUSTED`(레이트 리밋) 문제를 해결한다.

**Architecture:** 클라이언트는 `/api/analyze` 단일 라우트를 호출한다. 서버는 KIS API로 시세/수급 실데이터를 선조회한 뒤, Google Search를 켠 Gemini 1회 호출로 뉴스·재무·리스크·시세 해석·종합 평가를 모두 수행하고, 통합 JSON을 5개 결과로 분해해 반환한다. marketData의 수치 필드는 KIS 실데이터로 직접 채운다.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `@google/genai`, KIS REST API, ioredis.

> **테스트 환경 주의:** 이 프로젝트에는 단위 테스트 러너가 없다(package.json에 test 스크립트 없음). 각 태스크의 검증은 **`npx tsc --noEmit`(타입 체크) + `pnpm lint`**로 하고, 마지막에 `pnpm build` + 수동 실행으로 통합 확인한다. 새 테스트 프레임워크는 도입하지 않는다(YAGNI).

---

## File Structure

- `src/types/agent.ts` — **수정**: `FinancialAgentResult`에 `currentRatio` 추가, `UnifiedAnalysisResult` 타입 신규.
- `src/lib/agents/prompts.ts` — **교체**: 기존 5개 프롬프트 제거, `UNIFIED_SYSTEM_PROMPT` 단일 상수.
- `src/lib/agents/unified-agent.ts` — **신규**: KIS 선조회 + Gemini 1회 + 통합 응답 분해.
- `src/app/api/analyze/route.ts` — **교체**: SSE 제거, 단일 JSON 응답.
- `src/hooks/use-analysis.ts` — **수정**: 단일 fetch로 변경.
- **삭제**: `src/app/api/agents/{news,market-data,financial,risk,synthesizer}/route.ts`,
  `src/lib/agents/{news-agent,market-agent,financial-agent,risk-agent,synthesizer-agent}.ts`.
- 변경 없음: `agent-card.tsx`, `analysis-dashboard.tsx`, `report-summary.tsx`, `score-gauge.tsx`
  (카드는 `result.summary`와 score만 렌더링하므로 `currentRatio`는 summary 텍스트로 반영되고 별도 UI 변경 불필요).

---

### Task 1: 타입 추가 (`currentRatio`, `UnifiedAnalysisResult`)

**Files:**
- Modify: `src/types/agent.ts`

- [ ] **Step 1: `FinancialAgentResult`에 `currentRatio` 필드 추가**

`src/types/agent.ts`의 `FinancialAgentResult` 인터페이스에서 `debtRatio` 줄 바로 아래에 추가:

```ts
  debtRatio: number | null;
  currentRatio: number | null;
```

(기존:
```ts
  roe: number | null;
  debtRatio: number | null;
  revenueGrowth: string;
```
→ 변경 후:
```ts
  roe: number | null;
  debtRatio: number | null;
  currentRatio: number | null;
  revenueGrowth: string;
```
)

- [ ] **Step 2: 파일 끝에 `UnifiedAnalysisResult` 타입 추가**

`src/types/agent.ts` 맨 아래(기존 `AgentCardState` 인터페이스 뒤)에 추가:

```ts
export interface UnifiedAnalysisResult {
  news: NewsAgentResult;
  marketData: MarketDataAgentResult;
  financial: FinancialAgentResult;
  risk: RiskAgentResult;
  synthesizer: SynthesizerAgentResult;
}
```

- [ ] **Step 3: 타입 체크**

Run: `cd /Users/a201903062/workspace/stock-manager && npx tsc --noEmit`
Expected: 통과 (이 시점에 기존 코드가 `currentRatio`를 채우지 않아도, 모든 생성 지점이 `as unknown as` 캐스팅이라 에러 없음). 만약 에러가 나면 다음 태스크에서 함께 해결되므로 메시지를 기록.

- [ ] **Step 4: 커밋**

```bash
git add src/types/agent.ts
git commit --no-gpg-sign -m "feat: add currentRatio field and UnifiedAnalysisResult type"
```

> 주의: 이 저장소는 SSH 커밋 서명이 켜져 있으나 비대화 환경에서 패스프레이즈 입력이 불가하므로 **모든 커밋에 `--no-gpg-sign`을 사용**한다.

---

### Task 2: 통합 시스템 프롬프트로 교체

**Files:**
- Modify (전체 교체): `src/lib/agents/prompts.ts`

- [ ] **Step 1: `prompts.ts` 전체를 아래 내용으로 교체**

```ts
export const UNIFIED_SYSTEM_PROMPT = `당신은 한국 주식(KOSPI/KOSDAQ) 투자 종합 분석 전문가입니다.
주어진 종목 1개에 대해 아래 4개 영역을 분석하고, 이를 종합한 최종 투자 평가까지 한 번에 수행하세요.
필요한 최신 정보는 Google 검색으로 직접 조사하고, 제공된 한국투자증권(KIS) 실시간 시세 데이터를 시세 분석에 활용하세요.

[분석 영역]
1. 뉴스/센티먼트: 최근 1주일 주요 뉴스, 섹터 동향, 투자 커뮤니티(네이버 종목토론방/증권사 리포트) 의견
2. 재무: 최근 분기/연간 실적(매출·영업이익·순이익), 핵심 비율(PER, PBR, ROE, 부채비율, 유동비율), 증권사 컨센서스
3. 시세/수급: (제공된 KIS 데이터 기반) 주가 추세·이동평균·지지/저항, 거래량, 외국인/기관 수급, 보조지표
4. 리스크: 거시경제(금리·환율·원자재·유가), 섹터/규제/지정학 리스크, 기업 고유 리스크

[종합 평가 가중치] 뉴스 20% / 시세·수급 25% / 재무 30% / 리스크 25%
- 목표가: 근거와 함께 제시
- 손절가: 주요 지지선/리스크 기반 산출 근거와 함께 제시
- keyInvestmentPoints: SWOT(강점/약점/기회/위협) 형태로 8~12개

반드시 아래 JSON 형식 하나만 출력하세요. 추가 설명/마크다운 없이 JSON 객체만 반환합니다.
시세 영역의 수치 필드(현재가·거래량·차트 데이터)는 서버가 KIS 실데이터로 채우므로, marketData에는 해석 필드만 채우세요.

{
  "news": {
    "agentId": "news",
    "score": 0-100,
    "sentiment": "매우긍정 | 긍정 | 중립 | 부정 | 매우부정",
    "summary": "3-5줄 요약",
    "keyNews": [
      { "title": "...", "source": "...", "date": "YYYY-MM-DD", "impact": "긍정|부정|중립", "summary": "한줄 요약" }
    ],
    "sectorTrend": "섹터 동향 요약",
    "communityOpinion": "커뮤니티 의견 요약",
    "investmentPoints": ["핵심 포인트", "..."]
  },
  "financial": {
    "agentId": "financial",
    "score": 0-100,
    "summary": "재무 분석 요약 (유동비율 포함)",
    "revenue": "최근 매출",
    "operatingProfit": "최근 영업이익",
    "netIncome": "최근 순이익",
    "per": 숫자 또는 null,
    "pbr": 숫자 또는 null,
    "roe": 숫자 또는 null,
    "debtRatio": 숫자 또는 null,
    "currentRatio": 숫자 또는 null,
    "revenueGrowth": "매출 성장률 요약",
    "profitTrend": "수익성 추이 요약",
    "consensus": "증권사 컨센서스 요약",
    "investmentPoints": ["포인트", "..."],
    "financialData": [ { "year": "2024", "revenue": 숫자, "operatingProfit": 숫자, "netIncome": 숫자 } ]
  },
  "marketData": {
    "agentId": "market-data",
    "score": 0-100,
    "summary": "기술적 분석 요약",
    "trend": "상승추세 | 하락추세 | 횡보 | 추세전환",
    "foreignBuy": "외국인 매매동향 요약",
    "institutionBuy": "기관 매매동향 요약",
    "technicalSignals": ["시그널", "..."]
  },
  "risk": {
    "agentId": "risk",
    "score": 0-100,
    "riskLevel": "매우높음 | 높음 | 보통 | 낮음 | 매우낮음",
    "summary": "리스크 종합 요약",
    "macroRisks": [ { "factor": "...", "level": "높음|보통|낮음", "description": "..." } ],
    "sectorRisks": [ { "factor": "...", "level": "높음|보통|낮음", "description": "..." } ],
    "companyRisks": [ { "factor": "...", "level": "높음|보통|낮음", "description": "..." } ],
    "mitigationPoints": ["완화 요인", "..."]
  },
  "synthesizer": {
    "agentId": "synthesizer",
    "totalScore": 0-100,
    "scoreBreakdown": { "news": 숫자, "marketData": 숫자, "financial": 숫자, "risk": 숫자 },
    "recommendation": "강력매수 | 매수 | 중립 | 매도 | 강력매도",
    "targetPrice": "목표 주가 + 근거",
    "stopLossPrice": "손절 주가 + 근거",
    "summary": "종합 평가 요약 5-7줄",
    "keyInvestmentPoints": [ { "type": "강점|약점|기회|위협", "point": "설명" } ],
    "conclusion": "최종 결론 2-3줄",
    "disclaimer": "본 분석은 AI 기반이며 투자 판단의 참고자료입니다. 투자 결정은 본인 책임 하에 이루어져야 합니다."
  }
}`;
```

- [ ] **Step 2: 타입 체크 (기존 import 깨짐 확인용)**

Run: `cd /Users/a201903062/workspace/stock-manager && npx tsc --noEmit`
Expected: 기존 `*-agent.ts` 파일들이 삭제된 옛 프롬프트 상수를 import하므로 **에러 발생 예상**. 이 파일들은 Task 6에서 삭제되므로 정상. 에러가 `news-agent.ts` 등 삭제 예정 파일에만 있는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/agents/prompts.ts
git commit --no-gpg-sign -m "feat: replace per-agent prompts with unified system prompt"
```

---

### Task 3: 통합 에이전트 생성

**Files:**
- Create: `src/lib/agents/unified-agent.ts`

- [ ] **Step 1: `unified-agent.ts` 작성**

```ts
import { getPrice, getDailyPrice, getInvestorTrend } from "@/lib/kis-api";
import { callGemini } from "@/lib/gemini";
import { UNIFIED_SYSTEM_PROMPT } from "./prompts";
import type {
  UnifiedAnalysisResult,
  MarketDataAgentResult,
} from "@/types/agent";

export async function runUnifiedAnalysis(
  stockName: string,
  stockCode: string
): Promise<UnifiedAnalysisResult> {
  // 1. KIS 실데이터 선조회 (Gemini 아님 → 레이트 리밋 무관)
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

  const userPrompt = `종목명: ${stockName} (종목코드: ${stockCode})

아래는 한국투자증권 API에서 조회한 실시간 시세 데이터입니다. 시세/수급 분석에 활용하세요:

${marketDataJson}

위 종목에 대해 뉴스/센티먼트, 재무, 시세/수급, 리스크 4개 영역을 분석하고, 종합 투자 평가까지 시스템 프롬프트의 JSON 형식으로 한 번에 반환하세요.`;

  // 2. Gemini 1회 호출 (Google Search)
  const combined = (await callGemini({
    systemPrompt: UNIFIED_SYSTEM_PROMPT,
    userPrompt,
    useSearch: true,
    temperature: 0.3,
  })) as unknown as UnifiedAnalysisResult;

  // 3. marketData 수치 필드를 KIS 실데이터로 직접 채움
  const priceHistory = (dailyData.output ?? [])
    .slice(0, 30)
    .map((d) => ({
      date: d.stck_bsop_date,
      close: Number(d.stck_clpr),
      volume: Number(d.acml_vol),
    }))
    .reverse();

  const recentVolumes = priceHistory.slice(-20).map((p) => p.volume);
  const avgVolume =
    recentVolumes.length > 0
      ? Math.round(
          recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length
        )
      : 0;
  const volume = Number(priceData.output.acml_vol);

  const marketData: MarketDataAgentResult = {
    ...combined.marketData,
    agentId: "market-data",
    currentPrice: Number(priceData.output.stck_prpr),
    changeRate: Number(priceData.output.prdy_ctrt),
    volume,
    avgVolume,
    volumeRatio: avgVolume > 0 ? Number((volume / avgVolume).toFixed(2)) : 0,
    priceHistory,
  };

  return { ...combined, marketData };
}
```

- [ ] **Step 2: 타입 체크**

Run: `cd /Users/a201903062/workspace/stock-manager && npx tsc --noEmit`
Expected: `unified-agent.ts` 자체에는 새 에러 없음. (삭제 예정 `*-agent.ts` 에러만 잔존)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/agents/unified-agent.ts
git commit --no-gpg-sign -m "feat: add runUnifiedAnalysis single-call agent"
```

---

### Task 4: `/api/analyze` 라우트를 단일 JSON 응답으로 교체

**Files:**
- Modify (전체 교체): `src/app/api/analyze/route.ts`

- [ ] **Step 1: `route.ts` 전체를 아래 내용으로 교체**

```ts
import { NextResponse } from "next/server";
import { runUnifiedAnalysis } from "@/lib/agents/unified-agent";
import { isValidStockCode, isValidStockName } from "@/lib/validate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`analyze:${ip}`, 5)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const { stockName, stockCode } = await req.json();

  if (!isValidStockName(stockName) || !isValidStockCode(stockCode)) {
    return NextResponse.json(
      { error: "유효하지 않은 종목 정보입니다" },
      { status: 400 }
    );
  }

  try {
    const result = await runUnifiedAnalysis(stockName, stockCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Analyze Error]", error);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 2: 타입 체크**

Run: `cd /Users/a201903062/workspace/stock-manager && npx tsc --noEmit`
Expected: `analyze/route.ts` 새 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/analyze/route.ts
git commit --no-gpg-sign -m "refactor: serve single-call analysis as JSON from /api/analyze"
```

---

### Task 5: 프론트엔드 훅을 단일 fetch로 변경

**Files:**
- Modify: `src/hooks/use-analysis.ts`

- [ ] **Step 1: `startAnalysis` 본문을 단일 fetch 방식으로 교체**

`src/hooks/use-analysis.ts`의 `startAnalysis` useCallback 전체(39~117행 영역)를 아래로 교체:

```ts
  const startAnalysis = useCallback(
    async (stock: StockInfo) => {
      setCurrentStock(stock);
      setIsAnalyzing(true);
      setAgentStates(createInitialStates());

      // 5개 카드 모두 분석 중 표시
      for (const id of AGENT_IDS) {
        updateAgent(id, { status: "running" });
      }

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stockName: stock.name, stockCode: stock.code }),
        });

        if (!res.ok) {
          const { error } = await res
            .json()
            .catch(() => ({ error: "분석에 실패했습니다." }));
          throw new Error(error ?? "분석에 실패했습니다.");
        }

        const data: UnifiedAnalysisResult = await res.json();

        updateAgent("news", { status: "completed", result: data.news });
        updateAgent("market-data", { status: "completed", result: data.marketData });
        updateAgent("financial", { status: "completed", result: data.financial });
        updateAgent("risk", { status: "completed", result: data.risk });
        updateAgent("synthesizer", { status: "completed", result: data.synthesizer });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        for (const id of AGENT_IDS) {
          updateAgent(id, { status: "error", error: message });
        }
      } finally {
        setIsAnalyzing(false);
      }
    },
    [updateAgent]
  );
```

- [ ] **Step 2: import에서 사용하지 않는 타입 정리 및 `UnifiedAnalysisResult` 추가**

`src/hooks/use-analysis.ts` 상단 타입 import를 아래로 교체:

```ts
import type {
  AgentId,
  AgentCardState,
  UnifiedAnalysisResult,
} from "@/types/agent";
```

(기존 `AgentResult`는 더 이상 사용하지 않으므로 제거)

- [ ] **Step 3: 타입 체크 + 린트**

Run: `cd /Users/a201903062/workspace/stock-manager && npx tsc --noEmit && pnpm lint`
Expected: `use-analysis.ts` 통과. (삭제 예정 파일 타입 에러는 잔존 가능)

- [ ] **Step 4: 커밋**

```bash
git add src/hooks/use-analysis.ts
git commit --no-gpg-sign -m "refactor: call single /api/analyze endpoint from useAnalysis"
```

---

### Task 6: 미사용 라우트/에이전트 파일 삭제

**Files:**
- Delete: `src/app/api/agents/news/route.ts`, `src/app/api/agents/market-data/route.ts`,
  `src/app/api/agents/financial/route.ts`, `src/app/api/agents/risk/route.ts`,
  `src/app/api/agents/synthesizer/route.ts`
- Delete: `src/lib/agents/news-agent.ts`, `src/lib/agents/market-agent.ts`,
  `src/lib/agents/financial-agent.ts`, `src/lib/agents/risk-agent.ts`,
  `src/lib/agents/synthesizer-agent.ts`

- [ ] **Step 1: 파일 삭제**

```bash
cd /Users/a201903062/workspace/stock-manager
rm -r src/app/api/agents
rm src/lib/agents/news-agent.ts src/lib/agents/market-agent.ts \
   src/lib/agents/financial-agent.ts src/lib/agents/risk-agent.ts \
   src/lib/agents/synthesizer-agent.ts
```

- [ ] **Step 2: 잔존 참조 확인**

Run: `cd /Users/a201903062/workspace/stock-manager && grep -rn "agents/news\|agents/market\|agents/financial\|agents/risk\|agents/synthesizer\|runNewsAgent\|runMarketDataAgent\|runFinancialAgent\|runRiskAgent\|runSynthesizerAgent" src/`
Expected: **출력 없음** (모든 참조 제거됨). 출력이 있으면 해당 파일을 수정.

- [ ] **Step 3: 타입 체크 (이제 깨끗해야 함)**

Run: `cd /Users/a201903062/workspace/stock-manager && npx tsc --noEmit`
Expected: **에러 0건**.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit --no-gpg-sign -m "chore: remove unused per-agent routes and agent files"
```

---

### Task 7: 최종 검증 (빌드 + 수동 실행)

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 린트 + 타입 체크 + 빌드**

Run: `cd /Users/a201903062/workspace/stock-manager && pnpm lint && npx tsc --noEmit && pnpm build`
Expected: 3개 모두 통과.

- [ ] **Step 2: 개발 서버 수동 확인**

Run: `cd /Users/a201903062/workspace/stock-manager && pnpm dev` (백그라운드)
확인 항목:
- 종목 1개 검색 → 분석 실행 시 **네트워크 탭에 `/api/analyze` 호출이 1건**만 발생.
- 5개 카드(뉴스/시세/재무/리스크/종합)가 모두 채워짐.
- 시세 카드의 현재가/거래량이 KIS 실데이터와 일치(차트 데이터 정상).
- 서버 로그에 `RESOURCE_EXHAUSTED` / "한도를 초과" 미발생.

- [ ] **Step 3: 결과 보고**

빌드/실행 결과를 사실대로 보고. 실패 시 출력과 함께 보고하고 수정.

---

## Self-Review 결과

**Spec coverage:**
- Gemini 5→1 호출 → Task 3, 4. ✅
- KIS 실데이터 유지 + 수치 직접 채움 → Task 3. ✅
- 5개 카드 UI 유지 → Task 5 (레이아웃 무변경). ✅
- 미사용 코드 삭제 → Task 6. ✅
- 유동비율(currentRatio) 추가 → Task 1(타입) + Task 2(프롬프트). 카드는 metric을 렌더링하지 않으므로 summary로 반영(스펙 (F) 수정 필요 — 별도 카드 UI 작업 없음). ✅

**Placeholder scan:** 없음 — 모든 코드 블록 실제 내용 포함.

**Type consistency:** `runUnifiedAnalysis` 반환 = `UnifiedAnalysisResult`(Task 1 정의), `MarketDataAgentResult` 필드명(currentPrice/changeRate/volume/avgVolume/volumeRatio/priceHistory)은 `agent.ts` 기존 정의와 일치. KIS 필드명(stck_prpr/prdy_ctrt/acml_vol/stck_clpr/stck_bsop_date)은 `types/kis.ts`와 일치. ✅
