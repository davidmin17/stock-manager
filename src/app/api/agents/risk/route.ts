import { NextResponse } from "next/server";
import { runRiskAgent } from "@/lib/agents/risk-agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { stockName, stockCode } = await req.json();
    const result = await runRiskAgent(stockName, stockCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Agent Error] risk:", error);
    return NextResponse.json(
      { error: "리스크 분석 실패" },
      { status: 502 }
    );
  }
}
