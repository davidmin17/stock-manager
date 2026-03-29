import { NextResponse } from "next/server";
import { runNewsAgent } from "@/lib/agents/news-agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { stockName, stockCode } = await req.json();
    const result = await runNewsAgent(stockName, stockCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Agent Error] news:", error);
    return NextResponse.json(
      { error: "뉴스 분석 실패", details: String(error) },
      { status: 502 }
    );
  }
}
