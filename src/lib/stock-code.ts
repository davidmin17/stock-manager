import { cacheGet, cacheSet } from "./cache";
import type { StockInfo } from "@/types/stock";

const CACHE_KEY = "stock:codes";
const CACHE_UPDATED_KEY = "stock:codes:updated";

// L1: 인메모리 캐시
let memStocks: StockInfo[] | null = null;
let memUpdatedDate: string | null = null;

// 동시 갱신 중복 방지
let refreshing: Promise<StockInfo[]> | null = null;

/** 오늘 오전 9시(KST) 날짜 문자열 반환 — 9시 이전이면 전날 */
function getTodayKey(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  if (kst.getUTCHours() < 9) {
    kst.setUTCDate(kst.getUTCDate() - 1);
  }
  return kst.toISOString().slice(0, 10);
}

interface NaverStock {
  itemCode: string;
  stockName: string;
  stockEndType: string;
}

async function fetchMarket(market: "KOSPI" | "KOSDAQ"): Promise<StockInfo[]> {
  const stocks: StockInfo[] = [];
  const pageSize = 100;
  let page = 1;

  while (true) {
    const url = `https://m.stock.naver.com/api/stocks/marketValue/${market}?page=${page}&pageSize=${pageSize}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });

    if (!res.ok) break;

    const data = await res.json();
    const items: NaverStock[] = data.stocks ?? [];
    if (items.length === 0) break;

    for (const item of items) {
      if (item.stockEndType !== "stock") continue;
      stocks.push({ code: item.itemCode, name: item.stockName, market });
    }

    if (items.length < pageSize) break;
    page++;
    await new Promise((r) => setTimeout(r, 200));
  }

  return stocks;
}

async function fetchAllStocks(): Promise<StockInfo[]> {
  const [kospi, kosdaq] = await Promise.all([
    fetchMarket("KOSPI"),
    fetchMarket("KOSDAQ"),
  ]);
  return [...kospi, ...kosdaq].sort((a, b) => a.code.localeCompare(b.code));
}

export async function refreshStocks(): Promise<StockInfo[]> {
  const todayKey = getTodayKey();

  console.log(`[StockCodes] Fetching fresh data for ${todayKey}...`);
  const stocks = await fetchAllStocks();

  if (stocks.length === 0) {
    console.error("[StockCodes] Fetch returned 0 stocks, skipping update");
    // 기존 데이터 유지
    const existing = memStocks ?? (await cacheGet<StockInfo[]>(CACHE_KEY));
    return existing ?? [];
  }

  // Redis 저장 (TTL 25시간 — 다음 갱신 전까지 충분히 유지)
  await cacheSet(CACHE_KEY, stocks, 90000);
  await cacheSet(CACHE_UPDATED_KEY, todayKey, 90000);

  // 메모리 캐시 갱신
  memStocks = stocks;
  memUpdatedDate = todayKey;

  console.log(`[StockCodes] Updated ${stocks.length} stocks (${todayKey})`);
  return stocks;
}

/** 종목 데이터 로드 — 오전 9시 기준 하루 1회 갱신 */
async function getStocks(): Promise<StockInfo[]> {
  const todayKey = getTodayKey();

  // L1: 메모리 캐시 (오늘 데이터)
  if (memStocks && memUpdatedDate === todayKey) {
    return memStocks;
  }

  // L2: Redis 캐시
  const [cached, cachedDate] = await Promise.all([
    cacheGet<StockInfo[]>(CACHE_KEY),
    cacheGet<string>(CACHE_UPDATED_KEY),
  ]);

  if (cached && cached.length > 0 && cachedDate === todayKey) {
    memStocks = cached;
    memUpdatedDate = todayKey;
    return cached;
  }

  // L3: 네이버 API에서 갱신 (중복 방지)
  if (refreshing) return refreshing;
  refreshing = refreshStocks().finally(() => { refreshing = null; });
  return refreshing;
}

// 초성 검색
const CHO = [
  "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ",
  "ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ",
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

export async function searchStocks(query: string, limit = 10): Promise<StockInfo[]> {
  if (!query.trim()) return [];

  const stocks = await getStocks();
  const q = query.trim().toLowerCase();

  if (isChosung(q)) {
    return stocks
      .filter((s) => getChosung(s.name).startsWith(q))
      .slice(0, limit);
  }

  return stocks
    .filter((s) => s.name.toLowerCase().includes(q) || s.code.includes(q))
    .slice(0, limit);
}

export async function findStockByCode(code: string): Promise<StockInfo | undefined> {
  const stocks = await getStocks();
  return stocks.find((s) => s.code === code);
}

export async function findStockByName(name: string): Promise<StockInfo | undefined> {
  const stocks = await getStocks();
  return stocks.find((s) => s.name === name);
}
