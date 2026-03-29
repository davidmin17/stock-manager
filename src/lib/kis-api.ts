import { getKisAccessToken, refreshKisToken } from "./kis-token";
import type {
  KisPriceResponse,
  KisDailyPriceResponse,
  KisInvestorResponse,
} from "@/types/kis";

async function kisGet<T>(
  path: string,
  trId: string,
  params: Record<string, string>,
  isRetry = false
): Promise<T> {
  const baseUrl = process.env.KIS_BASE_URL!;
  const appKey = process.env.KIS_APP_KEY!;
  const appSecret = process.env.KIS_APP_SECRET!;

  const token = await getKisAccessToken();
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
      "Content-Type": "application/json; charset=UTF-8",
      authorization: `Bearer ${token}`,
      appkey: appKey,
      appsecret: appSecret,
      tr_id: trId,
      custtype: "P",
    },
    });
  } finally {
    clearTimeout(timeout);
  }

  const body = await res.json();

  // 토큰 만료(EGW00121) 시 갱신 후 1회 재시도
  if (!isRetry && body.msg_cd === "EGW00121") {
    console.log(`[KIS] Token expired, refreshing and retrying ${trId}...`);
    await refreshKisToken();
    return kisGet<T>(path, trId, params, true);
  }

  if (!res.ok || body.rt_cd === "1") {
    console.error(`[KIS API Error] ${trId}:`, JSON.stringify(body));
    throw new Error(`KIS API error [${trId}]: ${body.msg1 ?? res.statusText}`);
  }

  return body as T;
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
