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
