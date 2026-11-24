const encoder = new TextEncoder();
const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
export function randomToken(size = 32) { const bytes = new Uint8Array(size); crypto.getRandomValues(bytes); return base64url(bytes); }
export async function sha256(value: string) { const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value)); return base64url(new Uint8Array(hash)); }
export async function constantTimeEqual(a: string, b: string) {
  const aa = encoder.encode(a), bb = encoder.encode(b);
  let diff = aa.length ^ bb.length;
  for (let i = 0; i < Math.max(aa.length, bb.length); i++) diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}
export async function hashPassword(password: string, salt = randomToken(16)) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 310_000 }, key, 256);
  return `pbkdf2-sha256$310000$${salt}$${base64url(new Uint8Array(bits))}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [algorithm, iterationsText, salt, expected] = stored.split("$");
  if (algorithm !== "pbkdf2-sha256" || iterationsText !== "310000" || !salt || !expected) return false;
  return constantTimeEqual((await hashPassword(password, salt)).split("$")[3], expected);
}

