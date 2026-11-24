import { z } from "zod";
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const sendCodeSchema = z.object({ email: emailSchema });
export const signUpSchema = z.object({ email: emailSchema, password: z.string().min(8).max(128), code: z.string().regex(/^\d{6}$/) });
export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });

