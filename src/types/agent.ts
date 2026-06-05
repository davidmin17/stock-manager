export type AgentId = "news" | "market-data" | "financial" | "risk" | "synthesizer";
export type AgentStatus = "idle" | "running" | "completed" | "error";

// 영역 카드는 미니멀 표시: 점수 + ≤3줄 요약 + 핵심 수치만 유지
export interface NewsAgentResult {
  agentId: "news";
  score: number;
  sentiment: "매우긍정" | "긍정" | "중립" | "부정" | "매우부정";
  summary: string;
}

export interface MarketDataAgentResult {
  agentId: "market-data";
  score: number;
  summary: string;
  // 핵심 수치 — KIS 실데이터로 채움
  currentPrice: number;
  changeRate: number;
}

export interface FinancialAgentResult {
  agentId: "financial";
  score: number;
  summary: string;
  // 핵심 재무비율
  per: number | null;
  pbr: number | null;
  roe: number | null;
  debtRatio: number | null;
  currentRatio: number | null;
}

export interface RiskAgentResult {
  agentId: "risk";
  score: number;
  riskLevel: "매우높음" | "높음" | "보통" | "낮음" | "매우낮음";
  summary: string;
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

export interface UnifiedAnalysisResult {
  news: NewsAgentResult;
  marketData: MarketDataAgentResult;
  financial: FinancialAgentResult;
  risk: RiskAgentResult;
  synthesizer: SynthesizerAgentResult;
}
