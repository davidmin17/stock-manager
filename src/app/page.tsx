"use client";

import { StockSearch } from "@/components/stock-search";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import { useAnalysis } from "@/hooks/use-analysis";
import { BarChart3 } from "lucide-react";

export default function Home() {
  const { agentStates, isAnalyzing, currentStock, startAnalysis } =
    useAnalysis();

  const hasResults = agentStates.some((s) => s.status !== "idle");

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Stock Manager
            </h1>
          </div>
          <span className="hidden sm:inline text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            AI Multi-Agent
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Hero Section */}
        {!hasResults && (
          <div className="text-center space-y-3 py-8 sm:py-16">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              AI 멀티에이전트 주식 분석
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              5개의 AI 에이전트가 뉴스, 시세, 재무, 리스크를 병렬 분석하여
              종합 투자 리포트를 생성합니다
            </p>
          </div>
        )}

        {/* Search */}
        <div className="max-w-2xl mx-auto w-full">
          <StockSearch onAnalyze={startAnalysis} isAnalyzing={isAnalyzing} />
        </div>

        {/* Current Stock Badge */}
        {currentStock && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
              <span className="font-semibold">{currentStock.name}</span>
              <span className="text-sm text-muted-foreground">
                {currentStock.code}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {currentStock.market}
              </span>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {hasResults && <AnalysisDashboard agentStates={agentStates} />}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-muted-foreground">
          본 서비스는 AI 기반 분석이며 투자 판단의 참고자료입니다.
        </div>
      </footer>
    </main>
  );
}
