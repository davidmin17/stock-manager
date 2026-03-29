import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return ai;
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

  // Google Search 사용 시 responseMimeType: "application/json" 불가
  const response = await getAI().models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: systemPrompt,
      tools,
      temperature,
      ...(!useSearch && { responseMimeType: "application/json" }),
    },
  });

  const text = response.text ?? "{}";
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
    throw new Error("Gemini API 응답을 파싱할 수 없습니다");
  }
}
