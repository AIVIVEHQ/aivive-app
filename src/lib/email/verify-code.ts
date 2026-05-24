import {
  findActiveCode,
  incrementAttempts,
  markCodeUsed,
  VERIFICATION_LIMITS,
  VerificationPurpose,
} from "@/models/verification_code";

export type VerifyResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function consumeVerificationCode(
  email: string,
  code: string,
  purpose: VerificationPurpose
): Promise<VerifyResult> {
  if (!/^\d{6}$/.test(code || "")) {
    return { ok: false, status: 400, error: "Invalid verification code." };
  }

  const active = await findActiveCode(email, purpose);
  if (!active) {
    return {
      ok: false,
      status: 400,
      error: "Code expired or not found. Please request a new one.",
    };
  }

  if (active.code !== code) {
    const attempts = await incrementAttempts(active.id);
    if (attempts >= VERIFICATION_LIMITS.MAX_ATTEMPTS) {
      await markCodeUsed(active.id);
      return {
        ok: false,
        status: 429,
        error: "Too many incorrect attempts. Please request a new code.",
      };
    }
    return {
      ok: false,
      status: 400,
      error: "Incorrect verification code.",
    };
  }

  await markCodeUsed(active.id);
  return { ok: true };
}
