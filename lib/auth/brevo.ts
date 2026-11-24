import type { Env } from "@/lib/env";
export async function sendVerificationCode(env: Env, email: string, code: string) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { name: "LFTarena", email: env.EMAIL_FROM }, to: [{ email }], subject: "Your LFTarena code", textContent: `Your LFTarena verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.` }),
  });
  if (!response.ok) throw new Error(`Brevo request failed (${response.status})`);
}

