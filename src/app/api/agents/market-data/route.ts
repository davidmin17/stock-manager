import { NextResponse } from "next/server";
import { runMarketDataAgent } from "@/lib/agents/market-agent";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { stockCode } = await req.json();
    const result = await runMarketDataAgent(stockCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Agent Error] market-data:", error);
    return NextResponse.json(
      { error: "시세 분석 실패" },
      { status: 502 }
    );
  }
}
