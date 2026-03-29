import { NextResponse } from "next/server";
import { searchStocks } from "@/lib/stock-code";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";

  if (query.length > 50) {
    return NextResponse.json([], { status: 400 });
  }

  const results = await searchStocks(query, 10);
  return NextResponse.json(results);
}
