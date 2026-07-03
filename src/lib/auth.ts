import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectToDatabase } from "./db";
import { User, IUser } from "@/models/User";

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
})();

export interface JWTPayload {
  userId: string;
  email: string;
  role: "admin" | "employee" | "client";
}

// 1. Sign token for session
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// 2. Verify token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// 3. Retrieve logged-in user details from Request context (cookies)
export async function getSessionUser(): Promise<IUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("synapse-token")?.value;
    
    if (!token) return null;
    
    const payload = verifyToken(token);
    if (!payload) return null;

    await connectToDatabase();
    const user = await User.findById(payload.userId).select("-password");
    return user;
  } catch {
    return null;
  }
}

// 4. Role Authorization Guards
export function hasAdminAccess(user: IUser | null): boolean {
  return !!user && user.role === "admin";
}

export function hasEmployeeAccess(user: IUser | null): boolean {
  return !!user && (user.role === "employee" || user.role === "admin");
}

export function hasClientAccess(user: IUser | null): boolean {
  return !!user && (user.role === "client" || user.role === "admin");
}
