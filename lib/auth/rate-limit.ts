export interface KVLike { get(key: string, type: "json"): Promise<unknown>; put(key: string, value: string, options: { expirationTtl: number }): Promise<void>; }
export async function hitLimit(kv: KVLike, key: string, limit: number, windowSeconds: number, now = Date.now()) {
  const bucket = Math.floor(now / (windowSeconds * 1000));
  const storageKey = `rl:${key}:${bucket}`;
  const current = await kv.get(storageKey, "json") as { count?: number } | null;
  const count = (current?.count ?? 0) + 1;
  await kv.put(storageKey, JSON.stringify({ count }), { expirationTtl: windowSeconds * 2 });
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfter: windowSeconds - Math.floor((now / 1000) % windowSeconds) };
}

