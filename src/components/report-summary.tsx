"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScoreGauge } from "./score-gauge";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import type { SynthesizerAgentResult } from "@/types/agent";

interface ReportSummaryProps {
  result: SynthesizerAgentResult;
}

const RECOMMENDATION_STYLE: Record<string, string> = {
  강력매수: "bg-green-500/20 text-green-400 border-green-500/30",
  매수: "bg-green-500/15 text-green-400 border-green-500/20",
  중립: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  매도: "bg-red-500/15 text-red-400 border-red-500/20",
  강력매도: "bg-red-500/20 text-red-400 border-red-500/30",
};

const SWOT_STYLE: Record<string, { color: string; bg: string }> = {
  강점: { color: "text-green-400", bg: "bg-green-500/10" },
  약점: { color: "text-red-400", bg: "bg-red-500/10" },
  기회: { color: "text-blue-400", bg: "bg-blue-500/10" },
  위협: { color: "text-orange-400", bg: "bg-orange-500/10" },
};

export function ReportSummary({ result }: ReportSummaryProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-purple-500/10">
            <Trophy className="h-5 w-5 text-purple-400" />
          </div>
          <span className="text-lg">종합 평가</span>
          <Badge
            variant="outline"
            className={`ml-auto text-sm px-3 py-1 ${RECOMMENDATION_STYLE[result.recommendation] ?? "bg-muted"}`}
          >
            {result.recommendation}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score + Summary */}
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <ScoreGauge score={result.totalScore} size="lg" />
          <div className="flex-1 space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {result.summary}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
              {result.targetPrice && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-bold text-green-400">
                    목표가: {result.targetPrice}
                  </span>
                </div>
              )}
              {result.stopLossPrice && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <TrendingDown className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-bold text-red-400">
                    손절가: {result.stopLossPrice}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "뉴스", score: result.scoreBreakdown.news, weight: "20%" },
            { label: "시세", score: result.scoreBreakdown.marketData, weight: "25%" },
            { label: "재무", score: result.scoreBreakdown.financial, weight: "30%" },
            { label: "리스크", score: result.scoreBreakdown.risk, weight: "25%" },
          ].map(({ label, score, weight }) => (
            <div
              key={label}
              className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center"
            >
              <div className="text-xs text-muted-foreground mb-1">
                {label}
                <span className="ml-1 opacity-50">({weight})</span>
              </div>
              <div className="text-xl font-bold">{score}</div>
            </div>
          ))}
        </div>

        {/* SWOT Investment Points */}
        {result.keyInvestmentPoints &&
          result.keyInvestmentPoints.length > 0 && (
            <>
              <Separator className="bg-border/30" />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">투자 포인트 (SWOT)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.keyInvestmentPoints.map((p, i) => {
                    const style = SWOT_STYLE[p.type] ?? { color: "", bg: "" };
                    return (
                      <div
                        key={i}
                        className={`flex gap-2 text-sm p-2 rounded-md ${style.bg}`}
                      >
                        <span className={`font-semibold shrink-0 ${style.color}`}>
                          [{p.type}]
                        </span>
                        <span className="text-muted-foreground">{p.point}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        <Separator className="bg-border/30" />

        {/* Conclusion */}
        <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
          <p className="text-sm font-medium leading-relaxed">
            {result.conclusion}
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-muted-foreground/60 text-center">
          {result.disclaimer}
        </p>
      </CardContent>
    </Card>
  );
}
