import { NextResponse } from "next/server";
import { runSynthesizerAgent } from "@/lib/agents/synthesizer-agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { agentResults } = await req.json();
    const settled = agentResults.map((r: Record<string, unknown>) => ({
      status: "fulfilled" as const,
      value: r,
    }));
    const result = await runSynthesizerAgent(settled);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Agent Error] synthesizer:", error);
    return NextResponse.json(
      { error: "종합 평가 실패" },
      { status: 502 }
    );
  }
}
