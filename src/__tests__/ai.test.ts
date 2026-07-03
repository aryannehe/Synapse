import { describe, it, expect } from "vitest";
import { generateAIContent } from "../lib/ai";

describe("Gemini AI Client Helper", () => {
  it("should return empty string if API key is not set or unset", async () => {
    const oldKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "";

    const response = await generateAIContent("Test prompt");
    expect(response).toBe("");

    process.env.GEMINI_API_KEY = oldKey;
  });
});
