// Server-only helper for calling the Gemini API directly (chat completions).
// Do NOT import this file from client code — it reads GEMINI_API_KEY.

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type CallOptions = {
  model?: string;
  temperature?: number;
  response_format?: { type: "json_object" };
};

export async function callLovableChat(
  messages: ChatMessage[],
  options: CallOptions = {},
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");

  const model = options.model ?? process.env.GEMINI_MODEL ?? "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  // Gemini splits out the system prompt and only allows "user"/"model" roles in contents.
  const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = { contents };
  if (systemParts.length > 0) {
    body.systemInstruction = { parts: [{ text: systemParts.join("\n\n") }] };
  }
  const generationConfig: Record<string, unknown> = {};
  if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
  if (options.response_format?.type === "json_object") {
    generationConfig.responseMimeType = "application/json";
  }
  if (Object.keys(generationConfig).length > 0) body.generationConfig = generationConfig;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI is busy — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

export function extractJson<T = unknown>(raw: string): T | null {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}