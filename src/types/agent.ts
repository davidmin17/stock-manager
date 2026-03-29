export type AgentId = "news" | "market-data" | "financial" | "risk" | "synthesizer";
export type AgentStatus = "idle" | "running" | "completed" | "error";

export interface NewsAgentResult {
  agentId: "news";
  score: number;
  sentiment: "매우긍정" | "긍정" | "중립" | "부정" | "매우부정";
  summary: string;
  keyNews: {
    title: string;
    source: string;
    date: string;
    impact: "긍정" | "부정" | "중립";
    summary: string;
  }[];
  sectorTrend: string;
  communityOpinion: string;
  investmentPoints: string[];
}

export interface MarketDataAgentResult {
  agentId: "market-data";
  score: number;
  currentPrice: number;
  changeRate: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  summary: string;
  trend: "상승추세" | "하락추세" | "횡보" | "추세전환";
  foreignBuy: string;
  institutionBuy: string;
  technicalSignals: string[];
  priceHistory: {
    date: string;
    close: number;
    volume: number;
  }[];
}

export interface FinancialAgentResult {
  agentId: "financial";
  score: number;
  summary: string;
  revenue: string;
  operatingProfit: string;
  netIncome: string;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  debtRatio: number | null;
  revenueGrowth: string;
  profitTrend: string;
  consensus: string;
  investmentPoints: string[];
  financialData: {
    year: string;
    revenue: number;
    operatingProfit: number;
    netIncome: number;
  }[];
}

export interface RiskAgentResult {
  agentId: "risk";
  score: number;
  riskLevel: "매우높음" | "높음" | "보통" | "낮음" | "매우낮음";
  summary: string;
  macroRisks: {
    factor: string;
    level: "높음" | "보통" | "낮음";
    description: string;
  }[];
  sectorRisks: {
    factor: string;
    level: "높음" | "보통" | "낮음";
    description: string;
  }[];
  companyRisks: {
    factor: string;
    level: "높음" | "보통" | "낮음";
    description: string;
  }[];
  mitigationPoints: string[];
}

export interface SynthesizerAgentResult {
  agentId: "synthesizer";
  totalScore: number;
  scoreBreakdown: {
    news: number;
    marketData: number;
    financial: number;
    risk: number;
  };
  recommendation: "강력매수" | "매수" | "중립" | "매도" | "강력매도";
  targetPrice: string;
  stopLossPrice: string;
  summary: string;
  keyInvestmentPoints: {
    type: "강점" | "약점" | "기회" | "위협";
    point: string;
  }[];
  conclusion: string;
  disclaimer: string;
}

export type AgentResult =
  | NewsAgentResult
  | MarketDataAgentResult
  | FinancialAgentResult
  | RiskAgentResult
  | SynthesizerAgentResult;

export interface AgentCardState {
  agentId: AgentId;
  status: AgentStatus;
  result: AgentResult | null;
  error: string | null;
}
