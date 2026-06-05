# 단일 Gemini 호출 기반 주식 분석 — 설계 문서

- 작성일: 2026-06-05
- 상태: 승인 대기

## 1. 배경 / 문제

현재 종목 분석은 클라이언트([use-analysis.ts](../../../src/hooks/use-analysis.ts))가 5개 라우트를 거의 동시에 호출한다:

- `/api/agents/news` (Gemini + Google Search)
- `/api/agents/market-data` (KIS API + Gemini)
- `/api/agents/financial` (Gemini + Google Search)
- `/api/agents/risk` (Gemini + Google Search)
- `/api/agents/synthesizer` (Gemini)

분석 1건당 **Gemini 호출 5회**(그 중 3회는 Google Search)가 분당 발생하여
`RESOURCE_EXHAUSTED`(429) — "AI 분석 요청 한도를 초과했습니다" 로그가 발생한다.

> 참고: `/api/analyze` SSE 오케스트레이터 라우트도 존재하나 현재 프론트엔드에서 사용하지 않는다.

## 2. 목표

- 분석 1건당 **Gemini 호출을 1회로 축소**하여 레이트 리밋 문제를 근본 해결.
- 분석 항목은 그대로 유지:
  1. 뉴스 / 커뮤니티 센티먼트
  2. 펀더멘탈 (매출액, 순이익, ROE, 부채비율, 유동비율, PER, PBR)
  3. 주가 흐름 / 거래량 / 수급(기관·외인) / 이동평균 / 보조지표
  4. 거시경제·시장 리스크 (금리, 환율, 원자재, 유가)
- 기존 5개 카드 UI 유지.
- KIS 실데이터(시세/수급)는 계속 사용.

## 3. 결정 사항 (승인됨)

| 항목 | 결정 |
|------|------|
| UI | 기존 5개 카드 레이아웃 유지 — 단일 응답으로 한 번에 채움 |
| 시세 데이터 | KIS API 실데이터 유지, Gemini 호출 전 선조회하여 주입 |
| 미사용 코드 | 개별 라우트/에이전트 파일 삭제 |
| 유동비율 | `FinancialAgentResult`에 `currentRatio` 필드 신규 추가 (타입·프롬프트·재무 카드 반영) |

## 4. 아키텍처

```
클라이언트
 └─ POST /api/analyze   (단일 JSON 요청/응답)
        │  (서버, runtime=nodejs, maxDuration=120)
        ▼
   ① KIS API 조회: getPrice / getDailyPrice / getInvestorTrend  ← Gemini 아님
        ▼
   ② Gemini 1회 호출 (useSearch: true)
       · 뉴스 + 재무 + 리스크 + 시세 해석 + 종합 평가를 한 프롬프트로 수행
       · KIS 실데이터를 프롬프트에 주입
       · 통합 JSON 반환: { news, marketData, financial, risk, synthesizer }
        ▼
   ③ 통합 JSON → 5개 개별 result 객체로 분해
       · marketData의 수치 필드(currentPrice/volume/priceHistory 등)는
         KIS 실데이터에서 직접 채움 (Gemini 출력 부담↓, 정확도↑)
        ▼
   ④ { news, marketData, financial, risk, synthesizer } JSON 응답
```

## 5. 컴포넌트별 변경

### (A) 프롬프트 — `src/lib/agents/prompts.ts`
- 새 상수 `UNIFIED_SYSTEM_PROMPT` 추가.
  - 1명의 종합 분석가 역할. 4개 영역 분석 + 종합 평가 수행.
  - 기존 5개 스키마를 그대로 포함한 **하나의 통합 JSON** 반환 지시:
    ```jsonc
    {
      "news":       { ...NewsAgentResult },
      "marketData": { ...MarketDataAgentResult },
      "financial":  { ...FinancialAgentResult },
      "risk":       { ...RiskAgentResult },
      "synthesizer":{ ...SynthesizerAgentResult }
    }
    ```
  - 종합 가중치(뉴스 20 / 시세 25 / 재무 30 / 리스크 25), 목표가·손절가·SWOT 규칙 포함.
- 기존 `NEWS_/MARKET_DATA_/FINANCIAL_/RISK_/SYNTHESIZER_SYSTEM_PROMPT` 제거.

### (B) 통합 에이전트 — 새 파일 `src/lib/agents/unified-agent.ts`
- `runUnifiedAnalysis(stockName, stockCode)`:
  1. KIS 조회: `Promise.all([getPrice, getDailyPrice, getInvestorTrend])`
  2. 시세 데이터 JSON을 userPrompt에 주입 (market-agent.ts 기존 방식 재사용)
  3. `callGemini({ systemPrompt: UNIFIED_SYSTEM_PROMPT, userPrompt, useSearch: true })` 1회
  4. 통합 응답을 5개 result로 분해. `marketData`의 수치 필드는 KIS 데이터로 덮어씀.
  5. 반환: `{ news, marketData, financial, risk, synthesizer }`

### (C) 라우트 — `src/app/api/analyze/route.ts`
- SSE/ReadableStream 제거 → `runUnifiedAnalysis` 호출 후 단일 JSON 응답.
- 레이트 리밋(`checkRateLimit`, 분당 5회) + 입력 검증 유지.
- `runtime = "nodejs"`, `maxDuration = 120` 유지.

### (D) 삭제 대상
- 라우트: `src/app/api/agents/{news,market-data,financial,risk,synthesizer}/route.ts`
- 에이전트: `src/lib/agents/{news,market,financial,risk,synthesizer}-agent.ts`

### (E) 프론트엔드 — `src/hooks/use-analysis.ts`
- 5회 병렬 fetch + synthesizer 후속 호출 제거.
- `/api/analyze`에 단일 fetch. 시작 시 5개 카드 모두 `running` 설정.
- 응답 수신 후 5개 카드를 한 번에 `completed`로 채움. 에러 시 5개 모두 `error`.
- 카드/대시보드 컴포넌트 레이아웃은 유지(유동비율 표시만 추가).

### (F) 유동비율 추가 — `src/types/agent.ts` + 프롬프트
- `FinancialAgentResult`에 `currentRatio: number | null` 추가.
- `UNIFIED_SYSTEM_PROMPT`의 financial 스키마에 `currentRatio`(유동비율 %) 포함.
- 재무 카드(`agent-card.tsx`)는 개별 지표(PER/PBR/ROE 등)를 렌더링하지 않고 `summary`만
  표시하므로, 유동비율은 `summary` 텍스트로 반영된다. **별도 카드 UI 변경 없음.**

## 6. 트레이드오프 / 리스크

- **통합 JSON 비대화 → 파싱 실패/토큰 절단 위험**: 수치 필드를 KIS에서 직접 채워 Gemini 출력량을 줄여 완화. 기존 `callGemini`의 `\{[\s\S]*\}` JSON 추출 로직 활용.
- **부분 실패 격리 약화**: 한 영역이 부실해도 단일 응답. 단, 호출 수 감소로 전체 성공률은 상승.
- **점진 스트리밍 상실**: 카드별 순차 표시 → 일괄 표시. UI 결정에서 합의됨.

## 7. 검증 방법
- `pnpm lint` / `pnpm build` 통과.
- 로컬에서 실제 종목 분석 1건 실행 → 5개 카드 정상 표시, Gemini 호출 1회 확인.
- KIS 실데이터(현재가/거래량)가 marketData 카드에 정확히 반영되는지 확인.
