"use client";

import { AgentCard } from "./agent-card";
import { ReportSummary } from "./report-summary";
import type { AgentCardState, SynthesizerAgentResult } from "@/types/agent";

interface AnalysisDashboardProps {
  agentStates: AgentCardState[];
}

export function AnalysisDashboard({ agentStates }: AnalysisDashboardProps) {
  const subAgents = agentStates.filter((s) => s.agentId !== "synthesizer");
  const synthesizer = agentStates.find((s) => s.agentId === "synthesizer");

  return (
    <div className="space-y-6">
      {/* Agent Cards — 모바일 1열, 태블릿+ 2열 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subAgents.map((state) => (
          <AgentCard key={state.agentId} {...state} />
        ))}
      </div>

      {/* Synthesizer */}
      {synthesizer && synthesizer.status !== "idle" && (
        <div>
          {synthesizer.status === "completed" && synthesizer.result ? (
            <ReportSummary
              result={synthesizer.result as SynthesizerAgentResult}
            />
          ) : (
            <AgentCard {...synthesizer} />
          )}
        </div>
      )}
    </div>
  );
}
