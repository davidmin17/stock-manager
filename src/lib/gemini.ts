import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro-preview-05-06",
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: systemPrompt,
      tools,
      temperature,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "{}";
  const cleaned = text.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "");
  return JSON.parse(cleaned);
}
