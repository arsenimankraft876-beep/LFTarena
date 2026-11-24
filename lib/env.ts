import type { KVLike } from "@/lib/auth/rate-limit";
export interface Env {
  DATABASE_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BREVO_API_KEY: string;
  EMAIL_FROM: string;
  APP_URL: string;
  RATE_LIMITS: KVLike;
}

