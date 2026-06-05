import { getPrice, getDailyPrice, getInvestorTrend } from "@/lib/kis-api";
import { callGemini } from "@/lib/gemini";
import { UNIFIED_SYSTEM_PROMPT } from "./prompts";
import type {
  UnifiedAnalysisResult,
  MarketDataAgentResult,
} from "@/types/agent";

const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

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
      close: num(d.stck_clpr),
      volume: num(d.acml_vol),
    }))
    .reverse();

  const recentVolumes = priceHistory.slice(-20).map((p) => p.volume);
  const avgVolume =
    recentVolumes.length > 0
      ? Math.round(
          recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length
        )
      : 0;
  const volume = num(priceData.output.acml_vol);

  // Gemini 해석 필드 + KIS 실데이터 수치 필드 병합
  const marketData: MarketDataAgentResult = {
    ...combined.marketData,
    agentId: "market-data",
    currentPrice: num(priceData.output.stck_prpr),
    changeRate: num(priceData.output.prdy_ctrt),
    volume,
    avgVolume,
    volumeRatio: avgVolume > 0 ? Number((volume / avgVolume).toFixed(2)) : 0,
    priceHistory,
  };

  return { ...combined, marketData };
}
