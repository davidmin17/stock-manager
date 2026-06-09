import { NextResponse } from "next/server";
import { runUnifiedAnalysis } from "@/lib/agents/unified-agent";
import { isValidStockCode, isValidStockName } from "@/lib/validate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { UserFacingError } from "@/lib/errors";

export const runtime = "nodejs";
// Hobby 플랜 한도(300s) 이내. 단일 그라운딩 호출(~80s)+재시도 여유 확보
export const maxDuration = 180;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`analyze:${ip}`, 5)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const { stockName, stockCode } = await req.json();

  if (!isValidStockName(stockName) || !isValidStockCode(stockCode)) {
    return NextResponse.json(
      { error: "유효하지 않은 종목 정보입니다" },
      { status: 400 }
    );
  }

  try {
    const result = await runUnifiedAnalysis(stockName, stockCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Analyze Error]", error);
    // 사용자용 안전 메시지만 그대로 노출, 그 외(KIS 등 내부 오류)는 일반 메시지
    const message =
      error instanceof UserFacingError
        ? error.message
        : "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
