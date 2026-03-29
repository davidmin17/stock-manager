import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 간이 인메모리 레이트 리밋 (IP 기반, 분석 API용)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1분
const RATE_LIMIT_MAX_ANALYZE = 5; // 분석: 분당 5회
const RATE_LIMIT_MAX_SEARCH = 30; // 검색: 분당 30회

function checkRateLimit(ip: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// 오래된 엔트리 주기적 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 보안 헤더
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // API 라우트 레이트 리밋
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const limit = pathname.startsWith("/api/analyze")
      ? RATE_LIMIT_MAX_ANALYZE
      : RATE_LIMIT_MAX_SEARCH;

    if (!checkRateLimit(`${ip}:${pathname}`, limit)) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
