import { describe, it, expect } from "vitest";

describe("Database Connection Utility", () => {
  it("should export a connection helper function", async () => {
    // Configure mock env vars before importing the module dynamically
    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/synapse-workspace";
    process.env.JWT_SECRET = "test-secret-key-configured-locally-for-vitest-32-chars-long";

    const { connectToDatabase } = await import("../lib/db");
    expect(connectToDatabase).toBeTypeOf("function");
  });
});
