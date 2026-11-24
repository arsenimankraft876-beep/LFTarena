import { describe, expect, it } from "vitest";
import { constantTimeEqual, hashPassword, verifyPassword } from "../lib/auth/crypto";
import { hitLimit, type KVLike } from "../lib/auth/rate-limit";

class MemoryKV implements KVLike {
  data = new Map<string, unknown>();
  async get(key: string) { return this.data.get(key) ?? null; }
  async put(key: string, value: string) { this.data.set(key, JSON.parse(value)); }
}
describe("auth primitives", () => {
  it("compares matching and differing code hashes without early exit", async () => {
    expect(await constantTimeEqual("hash-value", "hash-value")).toBe(true);
    expect(await constantTimeEqual("hash-value", "hash-valuf")).toBe(false);
    expect(await constantTimeEqual("short", "longer")).toBe(false);
  });
  it("hashes passwords with PBKDF2 and verifies the password", async () => {
    const hash = await hashPassword("correct horse battery staple", "test-salt-123456");
    expect(hash).toMatch(/^pbkdf2-sha256\$310000\$/);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("incorrect", hash)).toBe(false);
  });
  it("applies a fixed-window rate limit and returns a retry delay", async () => {
    const kv = new MemoryKV(), now = 1_800_000_000_000;
    expect(await hitLimit(kv, "email:test", 2, 30, now)).toMatchObject({ allowed: true, remaining: 1 });
    expect(await hitLimit(kv, "email:test", 2, 30, now)).toMatchObject({ allowed: true, remaining: 0 });
    expect(await hitLimit(kv, "email:test", 2, 30, now)).toMatchObject({ allowed: false, retryAfter: 30 });
  });
});

