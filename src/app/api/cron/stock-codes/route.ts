import { NextResponse } from "next/server";
import { refreshStocks } from "@/lib/stock-code";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stocks = await refreshStocks();
  return NextResponse.json({ ok: true, count: stocks.length });
}
