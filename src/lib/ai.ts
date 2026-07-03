const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Interface representing the structured sentiment response.
 */
export interface SentimentAnalysisResult {
  sentiment: "positive" | "neutral" | "negative";
  recommendedPriority: "low" | "medium" | "high" | "urgent";
  suggestedTags: string[];
}

/**
 * Generates content using Google's Gemini 1.5 Flash model.
 * Falls back to empty string if Gemini API Key is missing or request fails.
 * 
 * @param prompt The system/user instruction prompt.
 * @param forceJson Force the response format to be valid JSON.
 */
export async function generateAIContent(prompt: string, forceJson = false): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === "" || GEMINI_API_KEY.includes("your_api_key_here")) {
    return "";
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (forceJson) {
      payload.generationConfig = {
        responseMimeType: "application/json",
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini API returned error code ${response.status}:`, errText);
      return "";
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : "";
  } catch (error) {
    console.error("Gemini API connection error:", error);
    return "";
  }
}

/**
 * Fetches a raw stream connection from Gemini's streaming endpoint.
 * 
 * @param prompt Input user prompt.
 */
export async function fetchGeminiStream(prompt: string): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${GEMINI_API_KEY}`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
}
