import { GoogleGenAI } from "@google/genai";
import { UserFacingError } from "@/lib/errors";

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return ai;
}

// 단일 호출 타임아웃 (정상 성공 ~80s보다 크고, 함수 maxDuration보다 짧게)
const TIMEOUT_MS = 115_000;
// 빠르게 실패하는 일시적 오류(503 등)에 한해 재시도 (503 스파이크 대비)
const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 일시적(재시도 가치 있음) 오류 판별 — 타임아웃/429는 제외
function isTransient(message: string): boolean {
  return (
    /\b(500|502|503|UNAVAILABLE)\b/.test(message) ||
    /ECONNRESET|ETIMEDOUT|fetch failed|socket hang up/i.test(message)
  );
}

export async function callGemini(params: {
  systemPrompt: string;
  userPrompt: string;
  useSearch?: boolean;
  temperature?: number;
}): Promise<Record<string, unknown>> {
  const {
    systemPrompt,
    userPrompt,
    useSearch = false,
    temperature = 0.3,
  } = params;

  const tools = useSearch ? [{ googleSearch: {} }] : undefined;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  let text = "{}";
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await getAI().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          tools,
          temperature,
          abortSignal: controller.signal,
          ...(!useSearch && { responseMimeType: "application/json" }),
        },
      });
      text = response.text ?? "{}";
      break;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      // 타임아웃(abort) → 재시도 없이 명확히 실패
      if (controller.signal.aborted) {
        console.error(`[Gemini] Timeout after ${TIMEOUT_MS / 1000}s (model: ${model})`);
        throw new UserFacingError(
          "AI 분석이 지연되어 완료하지 못했습니다. 잠시 후 다시 시도해주세요."
        );
      }

      // 레이트 리밋 → 재시도 무의미, 즉시 안내
      if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
        console.error(`[Gemini] Rate limit exceeded (model: ${model})`);
        throw new UserFacingError(
          "AI 분석 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
        );
      }

      // 일시적 오류(503 등) → 지수 백오프 후 재시도
      if (attempt < MAX_RETRIES && isTransient(message)) {
        console.warn(
          `[Gemini] Transient error, retrying (${attempt + 1}/${MAX_RETRIES}): ${message}`
        );
        await sleep(2_000 * (attempt + 1));
        continue;
      }

      console.error("[Gemini] API error:", message);
      // 재시도까지 실패한 일시적 과부하(503)는 사용자에게 명확히 안내
      if (isTransient(message)) {
        throw new UserFacingError(
          "AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요."
        );
      }
      throw new UserFacingError("AI 분석 중 오류가 발생했습니다");
    } finally {
      clearTimeout(timer);
    }
  }

  // 마크다운 코드블록 제거 후 JSON 부분만 추출
  let cleaned = text.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
  // Search 모드에서는 응답에 텍스트가 섞일 수 있으므로 JSON 객체만 추출
  if (useSearch) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("[Gemini] Failed to parse JSON response:", cleaned.slice(0, 200));
    throw new UserFacingError(
      "AI 응답을 처리하지 못했습니다. 잠시 후 다시 시도해주세요."
    );
  }
}
