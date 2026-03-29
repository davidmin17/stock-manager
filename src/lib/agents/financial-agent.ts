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
