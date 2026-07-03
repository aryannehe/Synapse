import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils";

describe("Class Merging Utility (cn)", () => {
  it("should merge basic classnames", () => {
    const result = cn("text-white", "bg-slate-900");
    expect(result).toBe("text-white bg-slate-900");
  });

  it("should ignore boolean parameters", () => {
    const result = cn("text-white", false && "bg-slate-900", true && "font-bold");
    expect(result).toBe("text-white font-bold");
  });
});
