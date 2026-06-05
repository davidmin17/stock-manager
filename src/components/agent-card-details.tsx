"use client";

import type {
  AgentResult,
  NewsAgentResult,
  MarketDataAgentResult,
  FinancialAgentResult,
  RiskAgentResult,
} from "@/types/agent";
import { Badge } from "@/components/ui/badge";
import { PriceChart } from "./price-chart";

const IMPACT_COLOR: Record<string, string> = {
  긍정: "text-green-400",
  부정: "text-red-400",
  중립: "text-muted-foreground",
};

const LEVEL_COLOR: Record<string, string> = {
  높음: "text-red-400 border-red-500/30",
  보통: "text-yellow-400 border-yellow-500/30",
  낮음: "text-green-400 border-green-500/30",
};

// 숫자 포맷 (null/NaN → "-")
function fmt(n: number | null | undefined, suffix = ""): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toLocaleString("ko-KR") + suffix;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <h5 className="text-xs font-semibold text-foreground/80">{title}</h5>
      {children}
    </div>
  );
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
  return (
    <div className="space-y-3">
      {r.sentiment && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">센티먼트</span>
          <Badge variant="secondary" className="text-[10px]">
            {r.sentiment}
          </Badge>
        </div>
      )}
      {r.sectorTrend && (
        <Section title="섹터 동향">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {r.sectorTrend}
          </p>
        </Section>
      )}
      {r.communityOpinion && (
        <Section title="커뮤니티 의견">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {r.communityOpinion}
          </p>
        </Section>
      )}
      {r.keyNews?.length > 0 && (
        <Section title="주요 뉴스">
          <ul className="space-y-1.5">
            {r.keyNews.map((n, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs">
                <span
                  className={`shrink-0 ${IMPACT_COLOR[n.impact] ?? "text-muted-foreground"}`}
                >
                  ●
                </span>
                <div>
                  <span className="text-foreground/90">{n.title}</span>
                  <span className="block text-[10px] text-muted-foreground/60">
                    {n.source} · {n.date}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
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
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <span className="text-lg font-bold">{fmt(r.currentPrice)}원</span>
        <span className={`text-sm font-semibold ${rateColor}`}>
          {sign}
          {fmt(r.changeRate)}%
        </span>
        {r.trend && (
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {r.trend}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="거래량" value={fmt(r.volume)} />
        <Metric label="평균(20일)" value={fmt(r.avgVolume)} />
        <Metric label="거래량비" value={fmt(r.volumeRatio, "x")} />
      </div>

      {(r.foreignBuy || r.institutionBuy) && (
        <Section title="수급">
          {r.foreignBuy && (
            <p className="text-xs text-muted-foreground">외국인: {r.foreignBuy}</p>
          )}
          {r.institutionBuy && (
            <p className="text-xs text-muted-foreground">기관: {r.institutionBuy}</p>
          )}
        </Section>
      )}

      {r.technicalSignals?.length > 0 && (
        <Section title="이동평균·보조지표">
          <ul className="space-y-1">
            {r.technicalSignals.map((s, i) => (
              <li
                key={i}
                className="flex gap-1.5 text-xs text-muted-foreground"
              >
                <span className="shrink-0 text-emerald-400">•</span>
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {r.priceHistory?.length > 0 && (
        <Section title="주가 흐름 (30일)">
          <PriceChart data={r.priceHistory} />
        </Section>
      )}
    </div>
  );
}

function FinancialDetails({ r }: { r: FinancialAgentResult }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Metric label="PER" value={fmt(r.per)} />
        <Metric label="PBR" value={fmt(r.pbr)} />
        <Metric label="ROE" value={fmt(r.roe, "%")} />
        <Metric label="부채비율" value={fmt(r.debtRatio, "%")} />
        <Metric label="유동비율" value={fmt(r.currentRatio, "%")} />
      </div>

      <Section title="실적">
        <div className="space-y-0.5 text-xs text-muted-foreground">
          {r.revenue && <p>매출: {r.revenue}</p>}
          {r.operatingProfit && <p>영업이익: {r.operatingProfit}</p>}
          {r.netIncome && <p>순이익: {r.netIncome}</p>}
        </div>
      </Section>

      {r.consensus && (
        <Section title="컨센서스">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {r.consensus}
          </p>
        </Section>
      )}
    </div>
  );
}

function RiskDetails({ r }: { r: RiskAgentResult }) {
  const groups = [
    { title: "거시경제", items: r.macroRisks },
    { title: "섹터", items: r.sectorRisks },
    { title: "기업", items: r.companyRisks },
  ];

  return (
    <div className="space-y-3">
      {r.riskLevel && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">리스크 레벨</span>
          <Badge variant="outline" className="text-[10px]">
            {r.riskLevel}
          </Badge>
        </div>
      )}

      {groups.map(({ title, items }) =>
        items?.length > 0 ? (
          <Section key={title} title={`${title} 리스크`}>
            <ul className="space-y-1">
              {items.map((it, i) => (
                <li key={i} className="flex gap-1.5 text-xs">
                  <span
                    className={`shrink-0 rounded border px-1 font-medium ${LEVEL_COLOR[it.level] ?? ""}`}
                  >
                    {it.level}
                  </span>
                  <span className="text-muted-foreground">
                    <span className="text-foreground/80">{it.factor}</span> —{" "}
                    {it.description}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        ) : null
      )}

      {r.mitigationPoints?.length > 0 && (
        <Section title="완화 요인">
          <ul className="space-y-1">
            {r.mitigationPoints.map((m, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                <span className="shrink-0 text-green-400">•</span>
                {m}
              </li>
            ))}
          </ul>
        </Section>
      )}
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
