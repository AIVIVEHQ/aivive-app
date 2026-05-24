import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { verificationCodes } from "@/db/schema";

export type VerificationPurpose = "register" | "reset_password";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 3;
const MAX_PER_EMAIL_PER_DAY = 5;
const MAX_PER_IP_PER_HOUR = 10;

export type VerificationCode = typeof verificationCodes.$inferSelect;

export async function findActiveCode(
  email: string,
  purpose: VerificationPurpose
): Promise<VerificationCode | undefined> {
  const [row] = await db()
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.purpose, purpose),
        isNull(verificationCodes.used_at),
        gte(verificationCodes.expires_at, new Date())
      )
    )
    .orderBy(desc(verificationCodes.created_at))
    .limit(1);

  return row;
}

export async function findLatestCode(
  email: string,
  purpose: VerificationPurpose
): Promise<VerificationCode | undefined> {
  const [row] = await db()
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.purpose, purpose)
      )
    )
    .orderBy(desc(verificationCodes.created_at))
    .limit(1);

  return row;
}

export async function invalidateActiveCodes(
  email: string,
  purpose: VerificationPurpose
): Promise<void> {
  await db()
    .update(verificationCodes)
    .set({ used_at: new Date() })
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.purpose, purpose),
        isNull(verificationCodes.used_at)
      )
    );
}

export async function insertCode(data: {
  email: string;
  code: string;
  purpose: VerificationPurpose;
  ip: string | null;
}): Promise<VerificationCode> {
  const [row] = await db()
    .insert(verificationCodes)
    .values({
      email: data.email,
      code: data.code,
      purpose: data.purpose,
      ip: data.ip ?? undefined,
      expires_at: new Date(Date.now() + CODE_TTL_MS),
    })
    .returning();

  return row;
}

export async function deleteCodeById(id: number): Promise<void> {
  await db().delete(verificationCodes).where(eq(verificationCodes.id, id));
}

export async function markCodeUsed(id: number): Promise<void> {
  await db()
    .update(verificationCodes)
    .set({ used_at: new Date() })
    .where(eq(verificationCodes.id, id));
}

export async function incrementAttempts(id: number): Promise<number> {
  const [row] = await db()
    .update(verificationCodes)
    .set({ attempts: sql`${verificationCodes.attempts} + 1` })
    .where(eq(verificationCodes.id, id))
    .returning({ attempts: verificationCodes.attempts });
  return row?.attempts ?? 0;
}

export async function countByEmailSince(
  email: string,
  purpose: VerificationPurpose,
  since: Date
): Promise<number> {
  const [row] = await db()
    .select({ value: sql<number>`count(*)::int` })
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.purpose, purpose),
        gte(verificationCodes.created_at, since)
      )
    );
  return Number(row?.value ?? 0);
}

export async function countByIpSince(
  ip: string,
  since: Date
): Promise<number> {
  const [row] = await db()
    .select({ value: sql<number>`count(*)::int` })
    .from(verificationCodes)
    .where(
      and(eq(verificationCodes.ip, ip), gte(verificationCodes.created_at, since))
    );
  return Number(row?.value ?? 0);
}

export const VERIFICATION_LIMITS = {
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  MAX_ATTEMPTS,
  MAX_PER_EMAIL_PER_DAY,
  MAX_PER_IP_PER_HOUR,
};
