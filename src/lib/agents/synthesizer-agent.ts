import { callGemini } from "@/lib/gemini";
import { SYNTHESIZER_SYSTEM_PROMPT } from "./prompts";
import type { SynthesizerAgentResult, AgentResult } from "@/types/agent";

export async function runSynthesizerAgent(
  agentResults: PromiseSettledResult<AgentResult>[]
): Promise<SynthesizerAgentResult> {
  const agentIds = ["news", "market-data", "financial", "risk"] as const;
  const settled = agentResults.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return { agentId: agentIds[i], status: "failed", error: String(r.reason) };
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
