"use client";

import { StockSearch } from "@/components/stock-search";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import { useAnalysis } from "@/hooks/use-analysis";

export default function Home() {
  const { agentStates, isAnalyzing, currentStock, startAnalysis } =
    useAnalysis();

  const hasResults = agentStates.some((s) => s.status !== "idle");

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">StockPilot</h1>
          <p className="text-muted-foreground">
            AI 멀티에이전트 주식 분석 시스템
          </p>
        </div>

        <StockSearch onAnalyze={startAnalysis} isAnalyzing={isAnalyzing} />

        {currentStock && (
          <div className="text-center">
            <span className="text-lg font-semibold">{currentStock.name}</span>
            <span className="text-muted-foreground ml-2">
              ({currentStock.code} · {currentStock.market})
            </span>
          </div>
        )}

        {hasResults && <AnalysisDashboard agentStates={agentStates} />}
      </div>
    </main>
  );
}
