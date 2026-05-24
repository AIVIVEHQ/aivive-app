import { NextRequest, NextResponse } from "next/server";

import { findUserByEmail, updateUserPasswordByEmail } from "@/models/user";
import { hashPassword } from "@/lib/password";
import { consumeVerificationCode } from "@/lib/email/verify-code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, code, newPassword } = await req.json();
    const email = String(rawEmail || "").toLowerCase().trim();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (typeof code !== "string") {
      return NextResponse.json(
        { error: "Verification code is required." },
        { status: 400 }
      );
    }

    const verifyResult = await consumeVerificationCode(
      email,
      code,
      "reset_password"
    );
    if (!verifyResult.ok) {
      return NextResponse.json(
        { error: verifyResult.error },
        { status: verifyResult.status }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Should not happen since send-code already gated this, but be defensive.
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await updateUserPasswordByEmail(email, passwordHash);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("password/reset failed:", e);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
