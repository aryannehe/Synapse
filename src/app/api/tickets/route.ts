import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Ticket } from "@/models/Ticket";
import { generateAIContent } from "@/lib/ai";

// Input validation schema for ticket creation
const createTicketSchema = z.object({
  category: z.string().min(1, "Category is required"),
  summary: z.string().min(3, "Summary must be at least 3 characters").max(250, "Summary is too long"),
  message: z.string().min(5, "Message must be at least 5 characters").max(5000, "Message is too long"),
});

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    await connectToDatabase();

    // Query configuration based on Role-Based Access Control
    const query: Record<string, unknown> = {};
    if (user.role === "client") {
      query.clientId = user._id;
    }

    // Apply Filters
    if (status && status !== "All") {
      query.status = status.toLowerCase();
    }
    if (priority && priority !== "All") {
      query.priority = priority.toLowerCase();
    }
    
    // Escape regex characters to prevent regex injection attacks
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (search && search.trim() !== "") {
      const escapedSearch = escapeRegex(search.trim());
      const regex = new RegExp(escapedSearch, "i");
      query.$or = [
        { id: regex },
        { customerName: regex },
        { summary: regex }
      ];
    }

    // Pagination Parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "100", 10))); // default limit 100 to prevent truncated UI list views

    const total = await Ticket.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const tickets = await Ticket.find(query)
      .sort({ lastUpdated: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      tickets,
      total,
      page,
      totalPages
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input fields", details: parsed.error.format() }, { status: 400 });
    }

    const { category, summary, message } = parsed.data;

    await connectToDatabase();

    // Generate unique serial ticket ID avoiding collision risk
    const uniqueSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const ticketId = `SYN-${Date.now().toString().slice(-6)}-${uniqueSuffix}`;

    const timestamp = new Date().toISOString();

    // 1. Dynamic Sentiment & Priority Assistant Engine (Gemini LLM powered)
    let sentiment: "positive" | "neutral" | "negative" = "neutral";
    let recommendedPriority: "low" | "medium" | "high" | "urgent" = "medium";
    let suggestedTags = ["Support Ticket", category];

    const aiPrompt = `Analyze the customer support message below and extract:
1. Sentiment: strictly "positive", "neutral", or "negative".
2. Recommended priority: strictly "low", "medium", "high", or "urgent".
3. Suggested tags: A short JSON string array of up to 4 tags (e.g. ["Database Issue", "Login Failure", "Critical Error"]).

Format the response strictly as a JSON object with these keys: "sentiment", "recommendedPriority", "suggestedTags". Do not include any markdown wrapper or other text.
Category of support ticket: "${category}"
Message: "${message.replace(/"/g, '\\"')}"`;

    try {
      const aiResponse = await generateAIContent(aiPrompt, true);
      if (aiResponse) {
        const result = JSON.parse(aiResponse);
        if (["positive", "neutral", "negative"].includes(result.sentiment)) {
          sentiment = result.sentiment;
        }
        if (["low", "medium", "high", "urgent"].includes(result.recommendedPriority)) {
          recommendedPriority = result.recommendedPriority;
        }
        if (Array.isArray(result.suggestedTags)) {
          suggestedTags = [...new Set(["Support Ticket", category, ...result.suggestedTags])];
        }
      } else {
        throw new Error("Empty response from Gemini API");
      }
    } catch (e) {
      // Fallback heuristics
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes("urgent") || lowerMessage.includes("broken") || lowerMessage.includes("fail") || lowerMessage.includes("down") || lowerMessage.includes("crash")) {
        sentiment = "negative";
        recommendedPriority = lowerMessage.includes("down") || lowerMessage.includes("critical") ? "urgent" : "high";
        suggestedTags.push("System Alert");
      } else if (lowerMessage.includes("thanks") || lowerMessage.includes("great") || lowerMessage.includes("solved") || lowerMessage.includes("thank you")) {
        sentiment = "positive";
        recommendedPriority = "low";
        suggestedTags.push("User Praise");
      }
    }

    const messages = [{
      id: `msg-${Date.now()}`,
      sender: "customer" as const,
      senderName: user.name,
      text: message,
      timestamp,
    }];

    const newTicket = await Ticket.create({
      id: ticketId,
      customerName: user.name,
      customerEmail: user.email,
      clientId: user._id,
      assignedAgent: "Unassigned",
      priority: recommendedPriority,
      status: "open",
      category,
      lastUpdated: timestamp,
      createdAt: timestamp,
      summary,
      sentiment,
      recommendedPriority,
      suggestedTags,
      messages,
      internalNotes: [],
    });

    return NextResponse.json(newTicket);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
