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
