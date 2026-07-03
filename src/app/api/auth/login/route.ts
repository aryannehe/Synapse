import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Ticket } from "@/models/Ticket";
import { Document } from "@/models/Document";
import { signToken } from "@/lib/auth";
import { mockTickets, mockDocuments } from "@/services/mockData";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  record.count += 1;
  return record.count <= limit;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    
    // Rate limit check: 10 attempts per 15 minutes
    const isAllowed = checkRateLimit(ip, 10, 15 * 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many login attempts. Please try again in 15 minutes." }, { status: 429 });
    }

    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Auto-seed database if User collection is empty to prevent login failures
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const hashedClientPassword = await bcrypt.hash("cli@123", 10);
      const hashedEmployeePassword = await bcrypt.hash("emp#123", 10);
      const hashedAdminPassword = await bcrypt.hash("admin@1234", 10);

      const clientUser = await User.create({
        name: "Sarah Jenkins",
        email: "sarah.j@techcorp.com",
        password: hashedClientPassword,
        role: "client",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah",
      });

      const employeeUser = await User.create({
        name: "Aryan Nehe",
        email: "aryan.nehe@synapse.com",
        password: hashedEmployeePassword,
        role: "employee",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
      });

      const adminUser = await User.create({
        name: "Corporate Admin",
        email: "admin@synapse.com",
        password: hashedAdminPassword,
        role: "admin",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Admin",
      });

      // Seed default documents & tickets
      const docs = mockDocuments.map((doc) => ({
        title: doc.title,
        category: doc.category,
        content: doc.content,
        date: doc.date,
        tags: doc.tags,
        views: doc.views,
        isPublic: doc.category === "HR" || doc.category === "Finance",
      }));
      await Document.insertMany(docs);

      const tickets = mockTickets.map((ticket) => ({
        id: ticket.id,
        customerName: clientUser.name,
        customerEmail: clientUser.email,
        clientId: clientUser._id,
        assignedAgent: ticket.id === "SYN-1025" ? "Unassigned" : employeeUser.name,
        assignedAgentId: ticket.id === "SYN-1025" ? undefined : employeeUser._id,
        priority: ticket.priority,
        status: ticket.status,
        category: ticket.category,
        lastUpdated: ticket.lastUpdated,
        createdAt: ticket.createdAt,
        summary: ticket.summary,
        sentiment: ticket.sentiment,
        recommendedPriority: ticket.recommendedPriority,
        suggestedTags: ticket.suggestedTags,
        internalNotes: ticket.internalNotes,
        messages: ticket.messages.map((msg) => ({
          id: msg.id,
          sender: msg.sender,
          senderName: msg.sender === "customer" ? clientUser.name : employeeUser.name,
          text: msg.text,
          timestamp: msg.timestamp,
        })),
      }));
      await Ticket.insertMany(tickets);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Generate JWT
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set cookie
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      } 
    });

    response.cookies.set("synapse-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
