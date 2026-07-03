# Synapse Workspace — Principal Technical & Architectural Documentation (Part 3)

This manual covers the **Remaining API Routes**, **Frontend State Stores**, **Views**, **Deployment Configurations**, and **Unit Testing** suites.

---

# 🌐 API Routes & Operations Layer

---

# File: src/app/api/auth/register/route.ts

### 1. Purpose of the File
`src/app/api/auth/register/route.ts` handles user registration requests. It belongs to the **Authentication API Module**.
- **Responsibilities**:
  - Enforces registration rate limiting (max 3 accounts per hour).
  - Hardcodes user roles to `"client"` to prevent unauthorized role escalations.
  - Hashes passwords using `bcrypt`.
- **Inputs**: HTTP POST request containing `name`, `email`, and `password`.
- **Outputs**: JSON success response with the new user record, or error details.
- **Dependencies**: `bcryptjs`, `@/models/User`, `@/lib/db`.

### 2. High-Level Overview
Coordinates user registrations. It checks the rate limiter, validates input fields, verifies email availability, hashes the password, overrides any incoming role parameters to save the user as `"client"`, and saves the user record in MongoDB.

### 3. Detailed Code Walkthrough
```typescript
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

const registerLimitMap = new Map<string, { count: number; resetTime: number }>();
```
- **Line 1-6**: Imports, and instantiates the registration rate limiter map in memory.

```typescript
function checkRegisterLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = registerLimitMap.get(ip);

  if (!record) {
    registerLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > record.resetTime) {
    registerLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  record.count += 1;
  return record.count <= limit;
}
```
- **Line 8-26**: Rate Limiter helper. Restricts registration attempts.

```typescript
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    
    // Rate limit check: 3 attempts per hour
    const isAllowed = checkRegisterLimit(ip, 3, 60 * 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json({ error: "Registration limit exceeded. Please try again in an hour." }, { status: 429 });
    }

    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
```
- **Line 28-44**: Checks the rate limiter (max 3 registration attempts per hour per IP address) and validates input fields.

```typescript
    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    // Hash user password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Hardcode user role to "client" to block escalation hacks
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "client",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 46-81**: Connects to the database, verifies email availability, hashes the password using `bcrypt`, creates the user document (forcing the role to `"client"` to prevent role escalations), and returns the created user details.

---

# File: src/app/api/auth/me/route.ts

### 1. Purpose of the File
`src/app/api/auth/me/route.ts` manages active session validation. It belongs to the **Authentication API Module**.
- **Responsibilities**:
  - Resolves active user sessions.
  - Returns user details for the active session.
- **Inputs**: Incoming HTTP session cookie header.
- **Outputs**: JSON response with user details, or error details.
- **Dependencies**: `@/lib/auth`.

### 2. High-Level Overview
Authenticates requests by reading the `synapse-token` session cookie. It calls `getSessionUser()` to verify the token, and returns user details.

### 3. Detailed Code Walkthrough
```typescript
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 1-24**: Verifies the session by calling `getSessionUser()`, returning user details or an HTTP 401 error if unauthorized.

---

# File: src/app/api/auth/profile/route.ts

### 1. Purpose of the File
`src/app/api/auth/profile/route.ts` manages profile updates. It belongs to the **Authentication API Module**.
- **Responsibilities**:
  - Validates input fields using a Zod schema.
  - Updates the user's name in MongoDB.
- **Inputs**: HTTP PATCH request containing `name`.
- **Outputs**: JSON success response with updated user details, or error details.
- **Dependencies**: `zod`, `@/lib/auth`, `@/lib/db`, `@/models/User`.

### 2. High-Level Overview
Handles profile updates. It verifies the session, validates the new display name using a Zod schema (min 2, max 100 characters), and updates the user's name in MongoDB.

### 3. Detailed Code Walkthrough
```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
});
```
- **Line 1-8**: Imports, and defines the Zod schema for profile name validations.

```typescript
export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile data", details: parsed.error.format() }, { status: 400 });
    }

    const { name } = parsed.data;

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: { name } },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 10-53**: Connects to the database, parses the display name using Zod, updates the user's name in MongoDB, and returns the updated user details.

---

# File: src/app/api/tickets/route.ts

### 1. Purpose of the File
`src/app/api/tickets/route.ts` manages support ticket list operations. It belongs to the **Support Ticketing Module**.
- **Responsibilities**:
  - Restricts ticket listings based on user role (clients can only view their own tickets; employee/admins can view all tickets).
  - Escapes search queries to prevent regex injections.
  - Implements database-level pagination.
  - Uses the Gemini API to analyze ticket priority/sentiment and suggest tags.
- **Inputs**: HTTP GET filters (status, priority, search text, page, limit), or HTTP POST ticket creation configurations.
- **Outputs**: JSON paginated ticket results, or the created ticket details.
- **Dependencies**: `zod`, `@/lib/auth`, `@/lib/db`, `@/models/Ticket`, `@/lib/ai`.

### 2. High-Level Overview
Handles ticket operations. GET requests fetch support tickets with filtering, regex escaping, and pagination. POST requests validate input fields using Zod, run Gemini AI analysis (sentiment scoring, priority recommendations, tag suggestions), generate unique ticket IDs, and save tickets to MongoDB.

### 3. Detailed Code Walkthrough
```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Ticket } from "@/models/Ticket";
import { generateAIContent } from "@/lib/ai";

const createTicketSchema = z.object({
  category: z.string().min(1, "Category is required"),
  summary: z.string().min(3, "Summary must be at least 3 characters").max(250, "Summary is too long"),
  message: z.string().min(5, "Message must be at least 5 characters").max(5000, "Message is too long"),
});
```
- **Line 1-13**: Imports, and defines the Zod schema for ticket validations.

```typescript
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

    const query: any = {};
    if (user.role === "client") {
      query.clientId = user._id;
    }

    if (status && status !== "All") {
      query.status = status.toLowerCase();
    }
    if (priority && priority !== "All") {
      query.priority = priority.toLowerCase();
    }
    
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
```
- **Line 15-53**: Checks user permissions, builds query parameters, escapes search inputs, and configures status/priority filters.

```typescript
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "100", 10)));

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 55-76**: Runs the paginated query, and returns the ticket results with pagination metadata.

```typescript
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

    const uniqueSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const ticketId = `SYN-${Date.now().toString().slice(-6)}-${uniqueSuffix}`;

    const timestamp = new Date().toISOString();
```
- **Line 78-102**: Checks user permissions, validates ticket fields using Zod, and generates a unique ticket ID.

```typescript
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
```
- **Line 104-149**: Runs sentiment analysis using the Gemini API, falling back to local simulated rules on API failures.

```typescript
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 151-187**: Creates the ticket record in MongoDB and returns the created ticket details.

---

# File: src/app/api/tickets/[ticketId]/route.ts

### 1. Purpose of the File
`src/app/api/tickets/[ticketId]/route.ts` manages support ticket detail operations. It belongs to the **Support Ticketing Module**.
- **Responsibilities**:
  - Restricts ticket access based on user role (clients can only view their own tickets).
  - Uses the Gemini API to analyze ticket context and suggest replies.
  - Updates ticket attributes (status, priority, assignment) or adds new messages/notes.
- **Inputs**: HTTP GET, PATCH, or POST request parameters.
- **Outputs**: JSON support ticket details.
- **Dependencies**: `zod`, `@/lib/auth`, `@/models/Ticket`, `@/lib/ai`.

### 2. High-Level Overview
Handles single ticket actions. GET requests return ticket details populated with Gemini-generated autocomplete suggestions. PATCH requests validate and update ticket status, priority, or agent assignments. POST requests validate and append new thread messages or internal staff notes.

### 3. Detailed Code Walkthrough
```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Ticket } from "@/models/Ticket";
import { generateAIContent } from "@/lib/ai";

const patchTicketSchema = z.object({
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedAgent: z.string().max(100).optional(),
});

const postMessageSchema = z.object({
  text: z.string().min(1, "Message content is required").max(3000, "Message content is too long"),
  type: z.enum(["message", "note"]).optional().default("message"),
});
```
- **Line 1-19**: Imports, and defines Zod schemas for ticket patches and message updates.

```typescript
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

    if (user.role === "client" && ticket.clientId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }
```
- **Line 21-44**: Checks user permissions and fetches ticket details.

```typescript
    const ticketObj = ticket.toObject();
    let suggestedReplies = [];
    if (ticket.status !== "closed" && ticket.status !== "resolved") {
      const messagesContext = ticket.messages.map((m: any) => `${m.senderName}: ${m.text}`).join("\n");
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
        console.warn("Failed to generate real-time dynamic replies:", e);
      }
    }
```
- **Line 46-72**: Calls the Gemini API to generate response autocompletes based on ticket history.

```typescript
    if (suggestedReplies.length === 0) {
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
```
- **Line 74-101**: Applies default response fallbacks on failures, and returns the response.

```typescript
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 103-172**: Verifies employee permissions, parses patch inputs using Zod, updates ticket attributes, appends system audit notes, and saves changes.

```typescript
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 174-233**: Appends new messages or internal staff notes, and saves the updated ticket.

---

# File: src/app/api/knowledge/route.ts

### 1. Purpose of the File
`src/app/api/knowledge/route.ts` manages search operations. It belongs to the **Intelligent Search Module**.
- **Responsibilities**:
  - Implements full-text keyword searches.
  - Employs the Gemini API to synthesize match content into markdown summary cards.
  - Restricts manual document creation to administrators.
- **Inputs**: HTTP GET keyword search queries, or HTTP POST document creation configurations.
- **Outputs**: JSON search results with AI summaries, or the created document details.
- **Dependencies**: `@/lib/auth`, `@/models/Document`, `@/lib/ai`.

### 2. High-Level Overview
Handles policy queries. GET requests search database guidelines, and if a search text is supplied, calls Gemini to synthesize matching text blocks into an AI Answer Card. POST requests allow administrators to add new guidelines.

### 3. Detailed Code Walkthrough
```typescript
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Document } from "@/models/Document";
import { generateAIContent } from "@/lib/ai";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy");
    const search = searchParams.get("search") || "";

    await connectToDatabase();

    const query: any = {};
    if (category && category !== "All") {
      query.category = category;
    }
```
- **Line 1-27**: Verifies the session, and checks URL parameters and categories.

```typescript
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (search.trim() !== "") {
      const escapedSearch = escapeRegex(search.trim());
      const regex = new RegExp(escapedSearch, "i");
      query.$or = [
        { title: regex },
        { content: regex },
        { tags: regex }
      ];
    }
```
- **Line 29-41**: Escapes input strings to prevent regex injections.

```typescript
    let sortOption: any = {};
    if (sortBy === "Newest") {
      sortOption = { _id: -1 };
    } else if (sortBy === "Oldest") {
      sortOption = { _id: 1 };
    } else if (sortBy === "Most Viewed") {
      sortOption = { views: -1 };
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));

    const total = await Document.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const documents = await Document.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);
```
- **Line 43-63**: Queries matching documents with sorting and pagination.

```typescript
    let aiAnswer: any = undefined;
    const lowerQuery = search.toLowerCase();
    const matchedSources = documents.slice(0, 3).map(d => d.title);

    if (search.trim() !== "") {
      const matchedContentContext = documents.slice(0, 3).map(d => `Document: ${d.title}\nCategory: ${d.category}\nContent: ${d.content}`).join("\n\n");
      
      const aiPrompt = `You are the Synapse Enterprise AI Assistant. The user searched for: "${search}"
Below are the top matching internal documentation policies retrieved from our database:
${matchedContentContext}

Task:
Generate a synthesized AI Answer Card for the user's query.
Format the response strictly as a JSON object with these keys:
- "answer": A structured summary/direct answer to the user's query (supporting markdown formatting, bold text, lists). Must be clear and informative.
- "confidence": A confidence float rating between 0.50 and 0.99.
- "summary": A brief 1-line key takeaway summary.
- "relatedTopics": An array of 3-4 related topic strings/queries.

Do not wrap the response in any markdown code block or extra text. Output only raw JSON.`;

      try {
        const aiResponse = await generateAIContent(aiPrompt, true);
        if (aiResponse) {
          const result = JSON.parse(aiResponse);
          aiAnswer = {
            answer: result.answer || "",
            confidence: result.confidence || 0.85,
            summary: result.summary || "",
            sources: matchedSources.length ? matchedSources : ["Internal Database"],
            relatedTopics: result.relatedTopics || ["Standard Operations", "Synapse Guidelines"]
          };
        } else {
          throw new Error("Empty AI response");
        }
      } catch (e) {
        console.warn("Gemini knowledge synthesis failed, using local simulated mapping:", e);
        if (lowerQuery.includes("leave") || lowerQuery.includes("vacation") || lowerQuery.includes("holiday")) {
          aiAnswer = {
            answer: "At **Synapse Technologies Pvt. Ltd.**, leaves are categorized into Annual (18PL accrued) and Sick/Casual (12SCL upfront). Submit requests via HR portal 2 weeks in advance for planned PL.",
            confidence: 0.96,
            summary: "Accrued leaves include 18 PL and 12 SCL. Manage submissions in the HR portal.",
            sources: matchedSources.length ? matchedSources : ["Synapse Employee Leave & Vacation Policy"],
            relatedTopics: ["Maternity Leave", "Paternity Leave", "Sick Leave Accrual", "Carry Forward Limits"],
          };
        } else if (lowerQuery.includes("reimburse") || lowerQuery.includes("expense") || lowerQuery.includes("travel")) {
          aiAnswer = {
            answer: "Synapse Technologies reimburses business-related travel and meal expenses. Claims require invoices, submitted within 30 days, processed on the 10th and 25th.",
            confidence: 0.94,
            summary: "Submit expense claims with receipts within 30 days. Payouts are bi-weekly.",
            sources: matchedSources.length ? matchedSources : ["Expense Reimbursement & Travel Policy Guidelines"],
            relatedTopics: ["Conveyance Mileage Rates", "Client Meals Limits", "Hotel Category Caps", "Travel Approval Form"],
          };
        } else if (documents.length > 0) {
          aiAnswer = {
            answer: `Based on the internal Synapse database, we retrieved ${total} document(s) matching your request. Please inspect **${documents[0].title}** for standard operational guidelines.`,
            confidence: 0.88,
            summary: `Retrieved ${total} guidelines for "${search}".`,
            sources: [documents[0].title],
            relatedTopics: [`${search} protocol`, "Standard Operations"],
          };
        }
      }
    }

    return NextResponse.json({
      documents,
      total,
      page,
      totalPages,
      aiAnswer
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 65-139**: Calls the Gemini API to synthesize matching document text blocks, falling back to local simulated rules on API failures.

```typescript
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, category, content, tags, isPublic } = body;

    if (!title || !category || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    const newDoc = await Document.create({
      title,
      category,
      content,
      tags: tags || [],
      views: 0,
      isPublic: isPublic || false,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    });

    return NextResponse.json(newDoc);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 141-177**: Verifies admin permissions, creates a new document, and saves it in MongoDB.

---

# File: src/app/api/analytics/route.ts

### 1. Purpose of the File
`src/app/api/analytics/route.ts` manages dashboard KPI stats calculations. It belongs to the **Analytics Module**.
- **Responsibilities**:
  - Restricts access to administrators.
  - Aggregates document page views.
  - Calculates ticket resolution durations.
  - Generates 7-day ticketing volume trends.
- **Inputs**: Incoming authenticated admin requests.
- **Outputs**: JSON analytics metrics.
- **Dependencies**: `@/lib/auth`, `@/models/Ticket`, `@/models/Document`, `@/models/User`.

### 2. High-Level Overview
Computes platform analytics. It verifies admin permissions, queries MongoDB metrics (ticket status counts, document view totals, user registrations), and calculates average ticket resolution SLA durations.

### 3. Detailed Code Walkthrough
```typescript
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Ticket } from "@/models/Ticket";
import { Document } from "@/models/Document";
import { User } from "@/models/User";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();
```
- **Line 1-20**: Verifies admin permissions and connects to MongoDB.

```typescript
    const openTicketsCount = await Ticket.countDocuments({ status: "open" });
    const pendingTicketsCount = await Ticket.countDocuments({ status: "pending" });
    const resolvedTicketsCount = await Ticket.countDocuments({ status: { $in: ["resolved", "closed"] } });
    const activeUsers = await User.countDocuments();
```
- **Line 22-26**: Queries database document counts.

```typescript
    const resolvedTickets = await Ticket.find({ status: { $in: ["resolved", "closed"] } });
    let averageResolutionTime = "2.4 hrs";
    if (resolvedTickets.length > 0) {
      let totalTimeMs = 0;
      resolvedTickets.forEach(t => {
        const created = new Date(t.createdAt).getTime();
        const updated = new Date(t.lastUpdated).getTime();
        totalTimeMs += Math.max(0, updated - created);
      });
      const avgHrs = (totalTimeMs / (1000 * 60 * 60 * resolvedTickets.length)).toFixed(1);
      averageResolutionTime = `${avgHrs} hrs`;
    }
```
- **Line 28-39**: Calculates average ticket resolution SLA durations.

```typescript
    const totalDocViews = await Document.aggregate([
      { $group: { _id: null, total: { $sum: "$views" } } }
    ]);
    const searchesToday = totalDocViews.length ? totalDocViews[0].total : 142;

    const categoryGroup = await Document.aggregate([
      { $group: { _id: "$category", value: { $sum: 1 } } }
    ]);
    
    const searchesDistribution = categoryGroup.map(g => ({
      name: g._id,
      value: g.value
    }));

    const categories = ["HR", "Engineering", "Finance", "Legal", "Marketing"];
    categories.forEach(cat => {
      if (!searchesDistribution.some(s => s.name === cat)) {
        searchesDistribution.push({ name: cat, value: 5 });
      }
    });
```
- **Line 41-61**: Aggregates document page views and category distributions using Mongoose aggregations.

```typescript
    const ticketsTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const resolvedCount = await Ticket.countDocuments({
        status: { $in: ["resolved", "closed"] },
        lastUpdated: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() }
      });

      const openCount = await Ticket.countDocuments({
        status: { $in: ["open", "pending"] },
        createdAt: { $lte: endOfDay.toISOString() }
      });

      ticketsTrend.push({
        date: dateStr,
        resolved: resolvedCount || Math.max(2, 10 + (6 - i) * 3),
        open: openCount || Math.max(1, 15 - i * 2)
      });
    }

    const allTickets = await Ticket.find({});
    let promptUsage = 85;
    allTickets.forEach(t => {
      promptUsage += t.messages.length;
    });

    return NextResponse.json({
      searchesToday,
      ticketsResolved: resolvedTicketsCount,
      activeUsers,
      promptUsage,
      averageResolutionTime,
      ticketsTrend,
      searchesDistribution,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 63-108**: Generates the 7-day ticketing volume trend and returns the metrics.

---

# File: src/app/api/seed/route.ts

### 1. Purpose of the File
`src/app/api/seed/route.ts` manages database seeding and resets. It belongs to the **Operational Database Seeding Module**.
- **Responsibilities**:
  - Restricts database seeding actions to administrators.
  - Verifies the confirmation query parameter (`?confirm=true`).
  - Clears existing document records and writes mock data.
- **Inputs**: HTTP GET request containing the query parameters.
- **Outputs**: JSON success response, or error details.
- **Dependencies**: `@/lib/auth`, `@/models/User`, `@/models/Ticket`, `@/models/Document`.

### 2. High-Level Overview
Seeds the database. It verifies admin permissions, checks the `?confirm=true` parameter, wipes existing collection records, hashes passwords, and writes fresh mock users, tickets, and document records.

### 3. Detailed Code Walkthrough
```typescript
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Ticket } from "@/models/Ticket";
import { Document } from "@/models/Document";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const confirm = searchParams.get("confirm");
    if (confirm !== "true") {
      return NextResponse.json({ error: "Parameter confirm=true is required to execute seeding" }, { status: 400 });
    }

    await connectToDatabase();
```
- **Line 1-23**: Verifies admin permissions and the confirmation parameter, and connects to MongoDB.

```typescript
    await User.deleteMany({});
    await Ticket.deleteMany({});
    await Document.deleteMany({});

    const hashedClientPassword = await bcrypt.hash("cli@123", 10);
    const hashedEmployeePassword = await bcrypt.hash("emp#123", 10);
    const hashedAdminPassword = await bcrypt.hash("admin@1234", 10);

    const clientUser = await User.create({
      name: "Sarah Jenkins",
      email: "sarah.j@techcorp.com",
      password: hashedClientPassword,
      role: "client",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    });

    const employeeUser = await User.create({
      name: "Aryan Nehe",
      email: "aryan.nehe@synapse.com",
      password: hashedEmployeePassword,
      role: "employee",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aryan"
    });

    const adminUser = await User.create({
      name: "Global Admin",
      email: "admin@synapse.com",
      password: hashedAdminPassword,
      role: "admin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
    });
```
- **Line 25-58**: Clears existing data, hashes passwords, and creates default user accounts.

```typescript
    const doc1 = await Document.create({
      title: "Employee Leave & Vacation Policy",
      category: "HR",
      content: `### Employee Leave Policy (HR-POL-042)
This document outlines the vacation, sick leave, and casual leave allocations at Synapse Technologies.

1. **Privilege Leave (PL)**: 18 days per calendar year, accrued at 1.5 days per month.
2. **Sick & Casual Leave (SCL)**: 12 days per year, credited upfront on January 1st.

**Request Procedure:**
- Submit Privilege Leave requests at least 2 weeks in advance.
- Manager approval is mandatory.`,
      date: "Jan 15, 2026",
      tags: ["HR", "Leave", "Policy", "Vacation"],
      views: 45,
      isPublic: true
    });

    const doc2 = await Document.create({
      title: "Travel & Expense Reimbursement Guidelines",
      category: "Finance",
      content: `### Travel & Expense Reimbursement Policy (FIN-POL-018)
This document provides guidelines for claiming business-related travel expenses at Synapse Technologies.

1. **Submission Window**: All expense claims must be filed within 30 days.
2. **Mandatory Documentation**: Original receipts are required for transactions exceeding $15.

**Daily Allowances:**
- Accommodation: Capped at $150/night in Tier-1 cities.
- Meals: Capped at $55/day.`,
      date: "Feb 22, 2026",
      tags: ["Finance", "Reimbursement", "Travel", "Expense"],
      views: 32,
      isPublic: true
    });

    const doc3 = await Document.create({
      title: "Production Deployment Pipeline & Coding Standards",
      category: "Engineering",
      content: `### Production Deployment Pipeline (ENG-REF-001)
This reference manual outlines the CI/CD and deployment standards at Synapse.

1. **Branching Strategy**: We enforce GitFlow. Create feature branches off 'develop'.
2. **Review Checks**: At least two approvals and 80% test coverage are required to merge.

**Deployment Stages:**
- Merges to 'develop' deploy to Staging.
- Tagged releases (e.g. v1.0.0) deploy to Production.`,
      date: "Mar 05, 2026",
      tags: ["Engineering", "Deployment", "CI/CD", "GitFlow"],
      views: 88,
      isPublic: true
    });
```
- **Line 60-112**: Creates default document records in MongoDB.

```typescript
    const timestamp = new Date().toISOString();
    
    await Ticket.create({
      id: "SYN-1025-SEED",
      customerName: "Sarah Jenkins",
      customerEmail: "sarah.j@techcorp.com",
      clientId: clientUser._id,
      assignedAgent: "Aryan Nehe",
      assignedAgentId: employeeUser._id,
      priority: "high",
      status: "pending",
      category: "Technical",
      lastUpdated: timestamp,
      createdAt: timestamp,
      summary: "Database connection timeout during dashboard load",
      sentiment: "negative",
      recommendedPriority: "high",
      suggestedTags: ["Technical", "Database", "Dashboard"],
      internalNotes: ["Checked staging logs. DB connection pool is exhausted.", "Client is on Enterprise plan. Treat as high priority."],
      messages: [
        {
          id: `msg-${Date.now() - 3600000}`,
          sender: "customer",
          senderName: "Sarah Jenkins",
          text: "Hi, I am getting a database connection timeout error when loading my dashboard. Can you help?",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: `msg-${Date.now() - 1800000}`,
          sender: "agent",
          senderName: "Aryan Nehe",
          text: "Hello Sarah, I see the database logs show socket pool limits are reached. I am adjusting server configs now.",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        }
      ],
    });

    return NextResponse.json({ success: true, message: "Database reset and seeded successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 114-159**: Creates default support ticket records in MongoDB and returns a success response.

---

# File: src/app/api/health/route.ts

### 1. Purpose of the File
`src/app/api/health/route.ts` manages monitoring and health checks. It belongs to the **Operational Architecture Module**.
- **Responsibilities**:
  - Exposes an unauthenticated status check endpoint.
  - Returns uptime metrics and timestamps.
- **Inputs**: Incoming HTTP GET request.
- **Outputs**: JSON response indicating system status.
- **Dependencies**: None.

### 2. High-Level Overview
Provides system status. It returns uptime metrics and timestamps, allowing hosting orchestrators (such as Docker) to monitor system health.

### 3. Detailed Code Walkthrough
```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```
- **Line 1-9**: Returns system status, timestamp, and uptime statistics.

---

# File: src/app/api/assistant/stream/route.ts

### 1. Purpose of the File
`src/app/api/assistant/stream/route.ts` manages streaming response generation. It belongs to the **Cognitive & AI Core Module**.
- **Responsibilities**:
  - Handles streaming chat generations.
  - Decodes and extracts text tokens from the Gemini stream.
  - Falls back to simulated word-by-word streaming if `GEMINI_API_KEY` is missing.
- **Inputs**: HTTP POST request containing `prompt`.
- **Outputs**: Streaming text response.
- **Dependencies**: `@/lib/ai`.

### 2. High-Level Overview
Pipes streaming responses. It receives prompts, and if `GEMINI_API_KEY` is set, calls Gemini's streaming endpoint, decodes JSON chunks in real-time, and yields text tokens. If unconfigured, it streams simulated text word-by-word with a slight delay.

### 3. Detailed Code Walkthrough
```typescript
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
```
- **Line 1-44**: Checks parameters, and if the API key is unconfigured, falls back to a simulated word-by-word stream using `ReadableStream`.

```typescript
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

            let match;
            const regex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
            const matches: string[] = [];
            while ((match = regex.exec(buffer)) !== null) {
              try {
                const parsedVal = JSON.parse(`"${match[1]}"`);
                matches.push(parsedVal);
              } catch {
                // Incomplete string sequence, skip until next loop iteration
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```
- **Line 46-118**: Initiates the Gemini stream, decodes JSON event-stream buffers in real-time, extracts text nodes using a regex tracker, and streams chunks back to the client.
