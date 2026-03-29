import stockData from "../../data/stock-codes.json";
import type { StockInfo } from "@/types/stock";

const stocks: StockInfo[] = stockData as StockInfo[];

const CHO = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ",
  "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

function getChosung(str: string): string {
  return [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return ch;
      return CHO[Math.floor(code / 588)];
    })
    .join("");
}

function isChosung(str: string): boolean {
  return [...str].every((ch) => CHO.includes(ch));
}

export function searchStocks(query: string, limit = 10): StockInfo[] {
  if (!query.trim()) return [];

  const q = query.trim().toLowerCase();

  if (isChosung(q)) {
    return stocks
      .filter((s) => getChosung(s.name).startsWith(q))
      .slice(0, limit);
  }

  return stocks
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.code.includes(q)
    )
    .slice(0, limit);
}

export function findStockByCode(code: string): StockInfo | undefined {
  return stocks.find((s) => s.code === code);
}

export function findStockByName(name: string): StockInfo | undefined {
  return stocks.find((s) => s.name === name);
}
