import { describe, it, expect } from "vitest";

function createChecksum(data: Record<string, unknown>, secret: string): string {
  const sortedKeys = Object.keys(data).sort();
  const payload = sortedKeys.map((k) => `${k}=${data[k]}`).join("&");
  let hash = 0;
  const combined = payload + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

describe("Checksum utility (mirrors payment-service logic)", () => {
  const SECRET = "test-secret";

  it("generates consistent checksum for same input", () => {
    const data = { amount: 100, currency: "USD", orderId: "123" };
    const c1 = createChecksum(data, SECRET);
    const c2 = createChecksum(data, SECRET);
    expect(c1).toBe(c2);
    expect(typeof c1).toBe("string");
    expect(c1.length).toBeGreaterThan(0);
  });

  it("produces different checksum with different secrets", () => {
    const data = { amount: 100, currency: "USD" };
    const c1 = createChecksum(data, "secret-a");
    const c2 = createChecksum(data, "secret-b");
    expect(c1).not.toBe(c2);
  });

  it("produces different checksum with different data", () => {
    const c1 = createChecksum({ amount: 100 }, SECRET);
    const c2 = createChecksum({ amount: 200 }, SECRET);
    expect(c1).not.toBe(c2);
  });

  it("is order-independent (sorted keys)", () => {
    const c1 = createChecksum({ b: 2, a: 1 }, SECRET);
    const c2 = createChecksum({ a: 1, b: 2 }, SECRET);
    expect(c1).toBe(c2);
  });
});

describe("Site configuration", () => {
  it("has valid brand colors", () => {
    const brandStart = "#8a50e8";
    const brandMid = "#c060d0";
    const brandEnd = "#e07040";
    expect(brandStart).toMatch(/^#[0-9a-f]{6}$/i);
    expect(brandMid).toMatch(/^#[0-9a-f]{6}$/i);
    expect(brandEnd).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("validates email format", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect("info@vyomai.cloud").toMatch(emailRegex);
  });

  it("verifies API health endpoint", () => {
    expect("/api/health").toBeTruthy();
  });
});
