import { NextResponse } from "next/server";
import { searchStocks } from "@/lib/stock-code";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`search:${ip}`, 30)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";

  if (query.length > 50) {
    return NextResponse.json([], { status: 400 });
  }

  const results = await searchStocks(query, 10);
  return NextResponse.json(results);
}
