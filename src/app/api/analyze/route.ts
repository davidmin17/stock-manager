import { runNewsAgent } from "@/lib/agents/news-agent";
import { runMarketDataAgent } from "@/lib/agents/market-agent";
import { runFinancialAgent } from "@/lib/agents/financial-agent";
import { runRiskAgent } from "@/lib/agents/risk-agent";
import { runSynthesizerAgent } from "@/lib/agents/synthesizer-agent";
import { isValidStockCode, isValidStockName } from "@/lib/validate";
import type { AgentId, AgentResult } from "@/types/agent";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const { stockName, stockCode } = await req.json();

  if (!isValidStockName(stockName) || !isValidStockCode(stockCode)) {
    return new Response(
      JSON.stringify({ error: "유효하지 않은 종목 정보입니다" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

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
        send("agent-complete", {
          agentId: "synthesizer",
          result: synthesized,
        });
      } catch (error) {
        send("agent-error", {
          agentId: "synthesizer",
          error: String(error),
        });
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
