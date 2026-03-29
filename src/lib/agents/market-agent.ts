import { getPrice, getDailyPrice, getInvestorTrend } from "@/lib/kis-api";
import { callGemini } from "@/lib/gemini";
import { MARKET_DATA_SYSTEM_PROMPT } from "./prompts";
import type { MarketDataAgentResult } from "@/types/agent";

export async function runMarketDataAgent(
  stockCode: string
): Promise<MarketDataAgentResult> {
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
