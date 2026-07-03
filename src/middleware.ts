import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exempt public endpoints
  if (
    pathname.startsWith("/api/auth/login") || 
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  // Protect all other API routes
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("synapse-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
