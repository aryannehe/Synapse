import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Ticket } from "@/models/Ticket";
import { generateAIContent } from "@/lib/ai";

// Schema for updating ticket attributes
const patchTicketSchema = z.object({
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedAgent: z.string().max(100).optional(),
});

// Schema for writing thread messages/internal notes
const postMessageSchema = z.object({
  text: z.string().min(1, "Message content is required").max(3000, "Message content is too long"),
  type: z.enum(["message", "note"]).optional().default("message"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId } = await params;

    await connectToDatabase();
    
    const ticket = await Ticket.findOne({ id: ticketId });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // RBAC: Client can only view their own ticket
    if (user.role === "client" && ticket.clientId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const ticketObj = ticket.toObject();
    
    // Call Gemini API to compute suggested replies based on context
    let suggestedReplies = [];
    if (ticket.status !== "closed" && ticket.status !== "resolved") {
      const messagesContext = ticket.messages.map((m: { senderName: string; text: string }) => `${m.senderName}: ${m.text}`).join("\n");
      const aiPrompt = `You are the SupportIQ Assistant. Analyze the support ticket thread below and draft 2 professional and helpful autocompleted replies that a support agent could send.
Return the suggestions strictly as a JSON string array of exactly 2 items.
Do not wrap in code blocks. Keep suggestions direct and personalized using the customer's name ("${ticket.customerName.split(" ")[0]}").

Thread history:
${messagesContext}`;

      try {
        const aiResponse = await generateAIContent(aiPrompt, true);
        if (aiResponse) {
          const parsed = JSON.parse(aiResponse);
          if (Array.isArray(parsed) && parsed.length >= 2) {
            suggestedReplies = parsed.slice(0, 2);
          }
        }
      } catch (e) {
        console.warn("Failed to generate real-time dynamic replies, falling back to static category defaults:", e);
      }
    }

    if (suggestedReplies.length === 0) {
      // Static defaults fallback
      if (ticket.category === "Billing") {
        suggestedReplies = [
          `Hi ${ticket.customerName.split(" ")[0]}, I am checking our billing system now. It looks like the seats were updated on June 5th. Let me verify our active logs.`,
          "Thank you for reaching out. I have credited the charge difference of 10 seats back to your payment account. It should reflect in 3-5 business days."
        ];
      } else if (ticket.category === "Technical") {
        suggestedReplies = [
          `Hi ${ticket.customerName.split(" ")[0]}, I apologize for this issue. Our engineering team is currently fixing the webhook mismatch. I will message you as soon as sync is restored.`,
          "I have reviewed the logs and identified a signature validation discrepancy. I am rolling out a patch to fix this immediately."
        ];
      } else {
        suggestedReplies = [
          "Hello, thank you for contacting Synapse Support. I have received your request and am looking into it right now.",
          "Can you provide additional logs or error screenshots so our team can troubleshoot this faster?"
        ];
      }
    }

    return NextResponse.json({ ...ticketObj, suggestedReplies });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Employees and Admins can patch ticket properties
    if (user.role === "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { ticketId } = await params;
    const body = await req.json();
    const parsed = patchTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid patch fields", details: parsed.error.format() }, { status: 400 });
    }

    const { status, priority, assignedAgent } = parsed.data;

    await connectToDatabase();

    const ticket = await Ticket.findOne({ id: ticketId });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const timestamp = new Date().toISOString();
    let auditMessageText = "";

    if (status && status !== ticket.status) {
      ticket.status = status;
      auditMessageText += `Status updated to ${status.toUpperCase()}. `;
    }
    if (priority && priority !== ticket.priority) {
      ticket.priority = priority;
      auditMessageText += `Priority changed to ${priority.toUpperCase()}. `;
    }
    if (assignedAgent && assignedAgent !== ticket.assignedAgent) {
      ticket.assignedAgent = assignedAgent;
      auditMessageText += `Case assigned to ${assignedAgent}. `;
    }

    if (auditMessageText) {
      ticket.messages.push({
        id: `sys-${Date.now()}`,
        sender: "system" as const,
        senderName: "System",
        text: auditMessageText.trim(),
        timestamp,
      });
      ticket.lastUpdated = timestamp;
      await ticket.save();
    }

    return NextResponse.json(ticket);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId } = await params;
    const body = await req.json();
    const parsed = postMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message payload", details: parsed.error.format() }, { status: 400 });
    }

    const { text, type } = parsed.data;

    await connectToDatabase();

    const ticket = await Ticket.findOne({ id: ticketId });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // RBAC check
    if (user.role === "client" && ticket.clientId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const timestamp = new Date().toISOString();

    if (type === "note") {
      if (user.role === "client") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      ticket.internalNotes.push(text);
    } else {
      const senderType = user.role === "client" ? ("customer" as const) : ("agent" as const);
      ticket.messages.push({
        id: `msg-${Date.now()}`,
        sender: senderType,
        senderName: user.name,
        text,
        timestamp,
      });
      ticket.lastUpdated = timestamp;
    }

    await ticket.save();
    return NextResponse.json(ticket);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
