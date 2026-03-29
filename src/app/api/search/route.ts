import { NextResponse } from "next/server";
import { searchStocks } from "@/lib/stock-code";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";

  const results = searchStocks(query, 10);
  return NextResponse.json(results);
}
