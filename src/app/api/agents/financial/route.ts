import { NextResponse } from "next/server";
import { runFinancialAgent } from "@/lib/agents/financial-agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { stockName, stockCode } = await req.json();
    const result = await runFinancialAgent(stockName, stockCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Agent Error] financial:", error);
    return NextResponse.json(
      { error: "재무 분석 실패" },
      { status: 502 }
    );
  }
}
