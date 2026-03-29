import { getKisAccessToken } from "./kis-token";
import type {
  KisPriceResponse,
  KisDailyPriceResponse,
  KisInvestorResponse,
} from "@/types/kis";

const KIS_BASE_URL = process.env.KIS_BASE_URL!;
const KIS_APP_KEY = process.env.KIS_APP_KEY!;
const KIS_APP_SECRET = process.env.KIS_APP_SECRET!;

async function kisGet<T>(
  path: string,
  trId: string,
  params: Record<string, string>
): Promise<T> {
  const token = await getKisAccessToken();
  const url = new URL(path, KIS_BASE_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      authorization: `Bearer ${token}`,
      appkey: KIS_APP_KEY,
      appsecret: KIS_APP_SECRET,
      tr_id: trId,
      custtype: "P",
    },
  });

  if (!res.ok) {
    throw new Error(`KIS API error [${trId}]: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/** 현재가 시세 조회 */
export async function getPrice(stockCode: string): Promise<KisPriceResponse> {
  return kisGet<KisPriceResponse>(
    "/uapi/domestic-stock/v1/quotations/inquire-price",
    "FHKST01010100",
    {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: stockCode,
    }
  );
}

/** 일자별 시세 조회 (최근 30일) */
export async function getDailyPrice(
  stockCode: string
): Promise<KisDailyPriceResponse> {
  return kisGet<KisDailyPriceResponse>(
    "/uapi/domestic-stock/v1/quotations/inquire-daily-price",
    "FHKST01010400",
    {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: stockCode,
      FID_PERIOD_DIV_CODE: "D",
      FID_ORG_ADJ_PRC: "0",
    }
  );
}

/** 투자자별 매매동향 조회 */
export async function getInvestorTrend(
  stockCode: string
): Promise<KisInvestorResponse> {
  return kisGet<KisInvestorResponse>(
    "/uapi/domestic-stock/v1/quotations/inquire-investor",
    "FHKST01010600",
    {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: stockCode,
    }
  );
}
