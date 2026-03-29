interface KisToken {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
}

let cachedToken: KisToken | null = null;

const KIS_BASE_URL = process.env.KIS_BASE_URL!;
const KIS_APP_KEY = process.env.KIS_APP_KEY!;
const KIS_APP_SECRET = process.env.KIS_APP_SECRET!;

export async function getKisAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const res = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: KIS_APP_KEY,
      appsecret: KIS_APP_SECRET,
    }),
  });

  if (!res.ok) {
    throw new Error(`KIS token request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}
