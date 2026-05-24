import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";

import { findUserByEmail } from "@/models/user";
import { getClientIp } from "@/lib/ip";
import {
  countByEmailSince,
  countByIpSince,
  deleteCodeById,
  findLatestCode,
  insertCode,
  invalidateActiveCodes,
  VERIFICATION_LIMITS,
  VerificationPurpose,
} from "@/models/verification_code";
import { sendEmail } from "@/lib/email/send";
import {
  EmailLocale,
  renderRegisterCode,
  renderResetCode,
} from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PURPOSES: VerificationPurpose[] = ["register", "reset_password"];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normaliseLocale(input: unknown): EmailLocale {
  if (input === "zh") return "zh";
  return "en";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").toLowerCase().trim();
    const purpose = body?.purpose as VerificationPurpose;
    const locale = normaliseLocale(body?.locale);

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!VALID_PURPOSES.includes(purpose)) {
      return NextResponse.json({ error: "Invalid purpose." }, { status: 400 });
    }

    const ip = await getClientIp();

    // IP rate limit
    const ipCount = await countByIpSince(
      ip,
      new Date(Date.now() - 60 * 60 * 1000)
    );
    if (ipCount >= VERIFICATION_LIMITS.MAX_PER_IP_PER_HOUR) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    // Purpose-specific existence checks
    const existing = await findUserByEmail(email);
    if (purpose === "register" && existing) {
      return NextResponse.json(
        { error: "This email is already registered." },
        { status: 409 }
      );
    }
    // reset_password: even if user doesn't exist, return success to prevent enumeration
    const userExistsForReset =
      purpose === "reset_password" ? !!existing && !!existing.password_hash : true;

    // Per-email daily rate limit (count only when we'd actually send)
    if (purpose !== "reset_password" || userExistsForReset) {
      const dailyCount = await countByEmailSince(
        email,
        purpose,
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      if (dailyCount >= VERIFICATION_LIMITS.MAX_PER_EMAIL_PER_DAY) {
        return NextResponse.json(
          { error: "Daily limit reached for this email. Try again tomorrow." },
          { status: 429 }
        );
      }

      // Resend cooldown
      const latest = await findLatestCode(email, purpose);
      if (latest && latest.created_at) {
        const since = Date.now() - new Date(latest.created_at).getTime();
        if (since < VERIFICATION_LIMITS.RESEND_COOLDOWN_MS) {
          const wait = Math.ceil(
            (VERIFICATION_LIMITS.RESEND_COOLDOWN_MS - since) / 1000
          );
          return NextResponse.json(
            {
              error: `Please wait ${wait}s before requesting another code.`,
              cooldownSeconds: wait,
            },
            { status: 429 }
          );
        }
      }
    }

    if (purpose === "reset_password" && !userExistsForReset) {
      // pretend success to defeat enumeration
      return NextResponse.json({
        success: true,
        cooldownSeconds: VERIFICATION_LIMITS.RESEND_COOLDOWN_MS / 1000,
      });
    }

    const code = String(randomInt(100000, 1000000));

    // Invalidate any earlier active codes for this email+purpose so only the
    // newest one is acceptable.
    await invalidateActiveCodes(email, purpose);

    const inserted = await insertCode({ email, code, purpose, ip });

    const template =
      purpose === "register"
        ? renderRegisterCode(code, locale)
        : renderResetCode(code, locale);

    const sendResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!sendResult.ok) {
      // roll back: remove the code so user can retry without waiting
      await deleteCodeById(inserted.id);
      console.error("verification email send failed:", sendResult.error);
      return NextResponse.json(
        { error: "Email service is unavailable. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      cooldownSeconds: VERIFICATION_LIMITS.RESEND_COOLDOWN_MS / 1000,
    });
  } catch (e) {
    console.error("email-code/send failed:", e);
    return NextResponse.json(
      { error: "Failed to send code. Please try again." },
      { status: 500 }
    );
  }
}
