"use client";

import type {
  AgentResult,
  NewsAgentResult,
  MarketDataAgentResult,
  FinancialAgentResult,
  RiskAgentResult,
} from "@/types/agent";
import { Badge } from "@/components/ui/badge";

// 숫자 포맷 (null/NaN → "-")
function fmt(n: number | null | undefined, suffix = ""): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toLocaleString("ko-KR") + suffix;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/30 border border-border/30 px-2 py-1.5 text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function NewsDetails({ r }: { r: NewsAgentResult }) {
  if (!r.sentiment) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">센티먼트</span>
      <Badge variant="secondary" className="text-[10px]">
        {r.sentiment}
      </Badge>
    </div>
  );
}

function MarketDetails({ r }: { r: MarketDataAgentResult }) {
  const rateColor =
    r.changeRate > 0
      ? "text-red-400"
      : r.changeRate < 0
        ? "text-blue-400"
        : "text-muted-foreground";
  const sign = r.changeRate > 0 ? "+" : "";
  return (
    <div className="flex items-end gap-2">
      <span className="text-lg font-bold">{fmt(r.currentPrice)}원</span>
      <span className={`text-sm font-semibold ${rateColor}`}>
        {sign}
        {fmt(r.changeRate)}%
      </span>
    </div>
  );
}

function FinancialDetails({ r }: { r: FinancialAgentResult }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Metric label="PER" value={fmt(r.per)} />
      <Metric label="PBR" value={fmt(r.pbr)} />
      <Metric label="ROE" value={fmt(r.roe, "%")} />
      <Metric label="부채비율" value={fmt(r.debtRatio, "%")} />
      <Metric label="유동비율" value={fmt(r.currentRatio, "%")} />
    </div>
  );
}

function RiskDetails({ r }: { r: RiskAgentResult }) {
  if (!r.riskLevel) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">리스크 레벨</span>
      <Badge variant="outline" className="text-[10px]">
        {r.riskLevel}
      </Badge>
    </div>
  );
}

export function AgentCardDetails({ result }: { result: AgentResult }) {
  switch (result.agentId) {
    case "news":
      return <NewsDetails r={result} />;
    case "market-data":
      return <MarketDetails r={result} />;
    case "financial":
      return <FinancialDetails r={result} />;
    case "risk":
      return <RiskDetails r={result} />;
    default:
      // synthesizer는 ReportSummary가 별도 렌더링
      return null;
  }
}
