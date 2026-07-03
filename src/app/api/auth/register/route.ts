import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

// Simple in-memory rate limiter for registrations
const registerLimitMap = new Map<string, { count: number; resetTime: number }>();

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

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = "client"; // Always force to client role
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      avatar,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
