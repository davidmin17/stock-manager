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
          const body = await res.json().catch(() => null);
          // 서버 에러 필드가 문자열일 때만 사용 (객체면 [object Object] 방지)
          const serverError =
            body && typeof body.error === "string" ? body.error : null;
          throw new Error(
            serverError ?? "분석에 실패했습니다. 잠시 후 다시 시도해주세요."
          );
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
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        setAgentStates(
          buildStates("error", () => ({ result: null, error: message }))
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  return { agentStates, isAnalyzing, currentStock, startAnalysis };
}
