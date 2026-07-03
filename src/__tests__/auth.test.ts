import { describe, it, expect } from "vitest";

describe("Authentication Utilities", () => {
  it("should successfully sign and verify a token payload", async () => {
    // Configure mock env vars before importing the module dynamically
    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/synapse-workspace";
    process.env.JWT_SECRET = "test-secret-key-configured-locally-for-vitest-32-chars-long";

    const { signToken, verifyToken } = await import("../lib/auth");

    const payload = {
      userId: "user-123",
      email: "test@synapse.com",
      role: "employee" as const,
    };

    const token = signToken(payload);
    expect(token).toBeTypeOf("string");

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(payload.role);
  });

  it("should return null for invalid or expired tokens", async () => {
    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/synapse-workspace";
    process.env.JWT_SECRET = "test-secret-key-configured-locally-for-vitest-32-chars-long";

    const { verifyToken } = await import("../lib/auth");
    const decoded = verifyToken("invalid-token-string");
    expect(decoded).toBeNull();
  });
});
