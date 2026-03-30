"use client";

import { useState, useCallback } from "react";
import type { AgentId, AgentCardState, AgentResult } from "@/types/agent";
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

      const body = { stockName: stock.name, stockCode: stock.code };

      // Agent 1~4: 클라이언트에서 개별 병렬 호출
      const parallelAgents: { id: AgentId; path: string; body: Record<string, string> }[] = [
        { id: "news", path: "/api/agents/news", body },
        { id: "market-data", path: "/api/agents/market-data", body: { stockCode: stock.code } },
        { id: "financial", path: "/api/agents/financial", body },
        { id: "risk", path: "/api/agents/risk", body },
      ];

      for (const { id } of parallelAgents) {
        updateAgent(id, { status: "running" });
      }

      const results = await Promise.allSettled(
        parallelAgents.map(async ({ id, path, body: reqBody }) => {
          const res = await fetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody),
          });

          if (!res.ok) throw new Error(`${id} failed: ${res.status}`);

          const result: AgentResult = await res.json();
          updateAgent(id, { status: "completed", result });
          return result;
        })
      );

      // 실패한 에이전트 에러 처리
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === "rejected") {
          updateAgent(parallelAgents[i].id, {
            status: "error",
            error: String(r.reason),
          });
        }
      }

      // Agent 5: 성공한 결과만 모아 종합 평가
      const fulfilled = results
        .filter((r): r is PromiseFulfilledResult<AgentResult> => r.status === "fulfilled")
        .map((r) => r.value);

      if (fulfilled.length > 0) {
        updateAgent("synthesizer", { status: "running" });
        try {
          const res = await fetch("/api/agents/synthesizer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agentResults: fulfilled }),
          });

          if (!res.ok) throw new Error(`synthesizer failed: ${res.status}`);

          const result: AgentResult = await res.json();
          updateAgent("synthesizer", { status: "completed", result });
        } catch (error) {
          updateAgent("synthesizer", { status: "error", error: String(error) });
        }
      } else {
        updateAgent("synthesizer", {
          status: "error",
          error: "분석 에이전트 결과가 없어 종합 평가를 수행할 수 없습니다.",
        });
      }

      setIsAnalyzing(false);
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
