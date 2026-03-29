import { cacheGet, cacheSet } from "./cache";

const CACHE_KEY = "kis:access_token";

// L1: 인메모리 캐시
let memToken: { value: string; expiresAt: number } | null = null;

// 동시 요청 중복 방지
let pending: Promise<string> | null = null;

function memGet(): string | null {
  if (memToken && Date.now() < memToken.expiresAt) {
    return memToken.value;
  }
  memToken = null;
  return null;
}

function memSet(value: string, ttlSeconds: number) {
  memToken = { value, expiresAt: Date.now() + ttlSeconds * 1000 };
}

async function fetchNewToken(): Promise<{ token: string; ttl: number }> {
  const baseUrl = process.env.KIS_BASE_URL!;
  const appKey = process.env.KIS_APP_KEY!;
  const appSecret = process.env.KIS_APP_SECRET!;

  const res = await fetch(`${baseUrl}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: appKey,
      appsecret: appSecret,
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.error_code) {
    console.error("[KIS Token Error]", JSON.stringify(data));
    throw new Error(
      `KIS token request failed: ${data.error_description ?? data.msg1 ?? res.statusText}`
    );
  }

  // 만료 1시간 전까지 유효하게, 최소 1시간
  const ttl = Math.max((data.expires_in ?? 86400) - 3600, 3600);

  return { token: data.access_token, ttl };
}

export async function getKisAccessToken(): Promise<string> {
  // L1: 메모리 캐시
  const mem = memGet();
  if (mem) return mem;

  // 동시 요청 중복 방지
  if (pending) return pending;

  pending = (async () => {
    try {
      // L2: Redis 캐시
      const cached = await cacheGet<string>(CACHE_KEY);
      if (cached) {
        memSet(cached, 82800); // 23시간
        return cached;
      }

      // L3: KIS API 신규 발급
      const { token, ttl } = await fetchNewToken();
      memSet(token, ttl);
      await cacheSet(CACHE_KEY, token, ttl);

      return token;
    } finally {
      pending = null;
    }
  })();

  return pending;
}

/** 토큰 만료 시 강제 갱신 */
export async function refreshKisToken(): Promise<string> {
  memToken = null;

  const { token, ttl } = await fetchNewToken();
  memSet(token, ttl);
  await cacheSet(CACHE_KEY, token, ttl);

  return token;
}
