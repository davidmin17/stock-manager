"use client";

import { useState, useCallback } from "react";
import type {
  AgentId,
  AgentCardState,
  AgentResult,
  UnifiedAnalysisResult,
} from "@/types/agent";
import type { StockInfo } from "@/types/stock";

const AGENT_IDS: AgentId[] = [
  "news",
  "market-data",
  "financial",
  "risk",
  "synthesizer",
];

// 모든 카드를 동일 status로 일괄 생성 (단일 setAgentStates로 리렌더 1회)
function buildStates(
  status: AgentCardState["status"],
  fields: (id: AgentId) => Pick<AgentCardState, "result" | "error">
): AgentCardState[] {
  return AGENT_IDS.map((id) => ({ agentId: id, status, ...fields(id) }));
}

const EMPTY = () => ({ result: null, error: null });

function createInitialStates(): AgentCardState[] {
  return buildStates("idle", EMPTY);
}

export function useAnalysis() {
  const [agentStates, setAgentStates] =
    useState<AgentCardState[]>(createInitialStates());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStock, setCurrentStock] = useState<StockInfo | null>(null);

  const startAnalysis = useCallback(
    async (stock: StockInfo) => {
      setCurrentStock(stock);
      setIsAnalyzing(true);
      // 5개 카드 모두 분석 중 표시
      setAgentStates(buildStates("running", EMPTY));

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
        const resultById: Record<AgentId, AgentResult> = {
          news: data.news,
          "market-data": data.marketData,
          financial: data.financial,
          risk: data.risk,
          synthesizer: data.synthesizer,
        };

        setAgentStates(
          buildStates("completed", (id) => ({
            result: resultById[id],
            error: null,
          }))
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setAgentStates(
          buildStates("error", () => ({ result: null, error: message }))
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setAgentStates(createInitialStates());
    setIsAnalyzing(false);
    setCurrentStock(null);
  }, []);

  return { agentStates, isAnalyzing, currentStock, startAnalysis, reset };
}
