import { NextResponse } from "next/server";
import { fetchGeminiStream } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const encoder = new TextEncoder();

    // Fallback: If no API Key, stream simulated response word-by-word
    if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_api_key_here")) {
      const simulatedText = `Hello! I am the **Synapse AI Enterprise Assistant** running in simulated demo mode. 
      
To enable live AI completions and playground answers, please configure a valid \`GEMINI_API_KEY\` in your local \`.env\` file. 

Here is a quick summary of your query: You asked about *"${prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt}"*. Let me know if you would like me to assist with ticketing or documentation settings!`;
      
      const words = simulatedText.split(" ");
      const stream = new ReadableStream({
        async start(controller) {
          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i === words.length - 1 ? "" : " ");
            controller.enqueue(encoder.encode(chunk));
            await new Promise((resolve) => setTimeout(resolve, 35));
          }
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Stream from Gemini API
    const geminiResponse = await fetchGeminiStream(prompt);
    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      return NextResponse.json({ error: `Gemini stream connection failed: ${err}` }, { status: 500 });
    }

    const reader = geminiResponse.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "Gemini stream response body is null" }, { status: 500 });
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let yieldedLength = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const textChunk = decoder.decode(value, { stream: true });
            buffer += textChunk;

            // Regex match for completed "text" properties inside JSON chunks
            let match;
            const regex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
            const matches: string[] = [];
            while ((match = regex.exec(buffer)) !== null) {
              try {
                const parsedVal = JSON.parse(`"${match[1]}"`);
                matches.push(parsedVal);
              } catch {
                // Incomplete string escape sequence, skip until next buffer load
              }
            }

            const fullTextCombined = matches.join("");
            if (fullTextCombined.length > yieldedLength) {
              const newChunk = fullTextCombined.slice(yieldedLength);
              yieldedLength = fullTextCombined.length;
              controller.enqueue(encoder.encode(newChunk));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
