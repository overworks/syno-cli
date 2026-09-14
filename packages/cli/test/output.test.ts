import { describe, expect, it } from "vitest";
import { displayWidth, printTable } from "../src/output.js";

function capture(fn: () => void): string {
  const chunks: string[] = [];
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array): boolean => {
    chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  }) as typeof process.stdout.write;
  try {
    fn();
  } finally {
    process.stdout.write = original;
  }
  return chunks.join("");
}

describe("displayWidth", () => {
  it("counts CJK characters as two columns", () => {
    expect(displayWidth("abc")).toBe(3);
    expect(displayWidth("사진")).toBe(4);
    expect(displayWidth("写真.jpg")).toBe(8);
  });
});

describe("printTable", () => {
  it("aligns columns by display width, not string length", () => {
    const out = capture(() => printTable([{ name: "사진", size: "1K" }, { name: "photo", size: "2K" }]));
    const lines = out.split("\n");
    // "사진" (4 cols) + 1 pad + 2 sep == "photo" (5 cols) + 2 sep
    expect(lines[2]).toBe("사진   1K");
    expect(lines[3]).toBe("photo  2K");
  });

  it("prints a placeholder for no rows", () => {
    expect(capture(() => printTable([]))).toBe("(no rows)\n");
  });
});
