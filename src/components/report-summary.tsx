"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "./score-gauge";
import { Trophy } from "lucide-react";
import type { SynthesizerAgentResult } from "@/types/agent";

interface ReportSummaryProps {
  result: SynthesizerAgentResult;
}

const RECOMMENDATION_COLOR: Record<string, string> = {
  강력매수: "bg-green-600",
  매수: "bg-green-500",
  중립: "bg-yellow-500",
  매도: "bg-red-500",
  강력매도: "bg-red-600",
};

const SWOT_COLOR: Record<string, string> = {
  강점: "text-green-600",
  약점: "text-red-500",
  기회: "text-blue-500",
  위협: "text-orange-500",
};

export function ReportSummary({ result }: ReportSummaryProps) {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-purple-500" />
          종합 평가
          <Badge
            className={`ml-auto ${RECOMMENDATION_COLOR[result.recommendation] ?? "bg-gray-500"} text-white`}
          >
            {result.recommendation}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-6">
          <ScoreGauge score={result.totalScore} size="lg" />
          <div className="flex-1 space-y-2">
            <p className="text-sm leading-relaxed">{result.summary}</p>
            {result.targetPrice && (
              <p className="text-sm font-medium">
                목표가: {result.targetPrice}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          {[
            { label: "뉴스", score: result.scoreBreakdown.news },
            { label: "시세", score: result.scoreBreakdown.marketData },
            { label: "재무", score: result.scoreBreakdown.financial },
            { label: "리스크", score: result.scoreBreakdown.risk },
          ].map(({ label, score }) => (
            <div key={label} className="p-2 rounded bg-muted/50">
              <div className="text-muted-foreground">{label}</div>
              <div className="font-bold text-lg">{score}</div>
            </div>
          ))}
        </div>

        {result.keyInvestmentPoints &&
          result.keyInvestmentPoints.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">투자 포인트</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {result.keyInvestmentPoints.map((p, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span
                      className={`font-medium shrink-0 ${SWOT_COLOR[p.type] ?? ""}`}
                    >
                      [{p.type}]
                    </span>
                    <span>{p.point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">{result.conclusion}</p>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {result.disclaimer}
        </p>
      </CardContent>
    </Card>
  );
}
