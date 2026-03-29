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

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stockName: stock.name,
            stockCode: stock.code,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Analysis request failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (eventType === "agent-start") {
                  updateAgent(data.agentId as AgentId, { status: "running" });
                } else if (eventType === "agent-complete") {
                  updateAgent(data.agentId as AgentId, {
                    status: "completed",
                    result: data.result as AgentResult,
                  });
                } else if (eventType === "agent-error") {
                  updateAgent(data.agentId as AgentId, {
                    status: "error",
                    error: data.error as string,
                  });
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
      } catch (error) {
        console.error("Analysis failed:", error);
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
