"use client";

import { useState, useCallback } from "react";
import type {
  AgentId,
  AgentCardState,
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

function createInitialStates(): AgentCardState[] {
  return AGENT_IDS.map((id) => ({
    agentId: id,
    status: "idle",
    result: null,
    error: null,
  }));
}

export function useAnalysis() {
  const [agentStates, setAgentStates] =
    useState<AgentCardState[]>(createInitialStates());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStock, setCurrentStock] = useState<StockInfo | null>(null);

  const updateAgent = useCallback(
    (agentId: AgentId, update: Partial<AgentCardState>) => {
      setAgentStates((prev) =>
        prev.map((s) => (s.agentId === agentId ? { ...s, ...update } : s))
      );
    },
    []
  );

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

  const reset = useCallback(() => {
    setAgentStates(createInitialStates());
    setIsAnalyzing(false);
    setCurrentStock(null);
  }, []);

  return { agentStates, isAnalyzing, currentStock, startAnalysis, reset };
}
