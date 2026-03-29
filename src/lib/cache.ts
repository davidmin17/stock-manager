import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const u = new URL(url);
    const useTls = u.protocol === "rediss:" || u.port === "6380";
    redis = new Redis({
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : 6379,
      username: u.username || undefined,
      password: decodeURIComponent(u.password) || undefined,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 5000,
      ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
    });
    redis.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });
    redis.connect().catch(() => {});
    return redis;
  } catch {
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const value = await r.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.error("[Redis] cacheGet failed:", (err as Error).message);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error("[Redis] cacheSet failed:", (err as Error).message);
  }
}
