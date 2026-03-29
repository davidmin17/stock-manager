"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreGauge } from "./score-gauge";
import {
  Newspaper,
  BarChart3,
  DollarSign,
  ShieldAlert,
  Trophy,
} from "lucide-react";
import type { AgentCardState, AgentId } from "@/types/agent";

const AGENT_META: Record<
  AgentId,
  { icon: React.ElementType; title: string; color: string; gradient: string }
> = {
  news: {
    icon: Newspaper,
    title: "뉴스/센티먼트",
    color: "text-blue-400",
    gradient: "from-blue-500/10 to-transparent",
  },
  "market-data": {
    icon: BarChart3,
    title: "시세/거래량",
    color: "text-emerald-400",
    gradient: "from-emerald-500/10 to-transparent",
  },
  financial: {
    icon: DollarSign,
    title: "재무 분석",
    color: "text-amber-400",
    gradient: "from-amber-500/10 to-transparent",
  },
  risk: {
    icon: ShieldAlert,
    title: "리스크 분석",
    color: "text-red-400",
    gradient: "from-red-500/10 to-transparent",
  },
  synthesizer: {
    icon: Trophy,
    title: "종합 평가",
    color: "text-purple-400",
    gradient: "from-purple-500/10 to-transparent",
  },
};

function getScore(result: AgentCardState["result"]): number {
  if (!result) return 0;
  if ("totalScore" in result) return result.totalScore;
  if ("score" in result) return result.score;
  return 0;
}

export const AgentCard = memo(function AgentCard({
  agentId,
  status,
  result,
  error,
}: AgentCardState) {
  const meta = AGENT_META[agentId];
  const Icon = meta.icon;

  return (
    <Card
      className={`transition-all duration-300 border-border/50 overflow-hidden ${
        status === "idle" ? "opacity-40" : ""
      } ${status === "completed" ? "hover:border-border" : ""}`}
    >
      <div className={`bg-gradient-to-r ${meta.gradient}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className={`p-1 rounded ${meta.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            {meta.title}
            {status === "running" && (
              <Badge
                variant="secondary"
                className="ml-auto animate-pulse text-xs"
              >
                분석 중...
              </Badge>
            )}
            {status === "completed" && result && (
              <div className="ml-auto">
                <ScoreGauge score={getScore(result)} size="sm" />
              </div>
            )}
            {status === "error" && (
              <Badge variant="destructive" className="ml-auto text-xs">
                오류
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </div>
      <CardContent className="pt-3">
        {status === "running" && (
          <div className="space-y-2.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {status === "completed" && result && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.summary}
          </p>
        )}
        {status === "idle" && (
          <p className="text-sm text-muted-foreground/50">대기 중</p>
        )}
      </CardContent>
    </Card>
  );
});
