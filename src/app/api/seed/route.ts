import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Ticket } from "@/models/Ticket";
import { Document } from "@/models/Document";
import { mockTickets, mockDocuments } from "@/services/mockData";
import { getSessionUser, hasAdminAccess } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const confirm = searchParams.get("confirm");
    if (confirm !== "true") {
      return NextResponse.json({ error: "Missing confirmation parameter (?confirm=true)" }, { status: 400 });
    }

    // Enforce admin check
    const currentUser = await getSessionUser();
    if (!currentUser || !hasAdminAccess(currentUser)) {
      return NextResponse.json({ error: "Forbidden: Only administrators can reset the workspace data" }, { status: 403 });
    }

    await connectToDatabase();

    // 1. Clear database
    await User.deleteMany({});
    await Ticket.deleteMany({});
    await Document.deleteMany({});

    // 2. Create Default Users with customized passwords
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

    // 3. Create default Documents
    const docs = mockDocuments.map(doc => ({
      title: doc.title,
      category: doc.category,
      content: doc.content,
      date: doc.date,
      tags: doc.tags,
      views: doc.views,
      isPublic: doc.category === "HR" || doc.category === "Finance", // HR and Finance public, others internal
    }));
    await Document.insertMany(docs);

    // 4. Create default Tickets associated with Client ID
    const tickets = mockTickets.map(ticket => ({
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
      messages: ticket.messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        senderName: msg.sender === "customer" ? clientUser.name : employeeUser.name,
        text: msg.text,
        timestamp: msg.timestamp,
      })),
    }));
    await Ticket.insertMany(tickets);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      users: {
        client: { email: clientUser.email, password: "cli@123" },
        employee: { email: employeeUser.email, password: "emp#123" },
        admin: { email: adminUser.email, password: "admin@1234" },
      },
      documentsSeededCount: docs.length,
      ticketsSeededCount: tickets.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
