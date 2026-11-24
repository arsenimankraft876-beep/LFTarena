import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/lib/env";

export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  const databaseUrl = (env as unknown as Env).DATABASE_URL;
  if (!databaseUrl) throw new Error("Database is not configured");
  return drizzle(neon(databaseUrl), { schema });
}
export async function getEnv() { const { env } = await getCloudflareContext({ async: true }); return env as unknown as Env; }

