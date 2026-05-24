import { NextRequest, NextResponse } from "next/server";

import { findUserByEmail, insertUser } from "@/models/user";
import { getClientIp } from "@/lib/ip";
import { getUuid } from "@/lib/hash";
import { hashPassword } from "@/lib/password";
import { consumeVerificationCode } from "@/lib/email/verify-code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, password, code } = await req.json();
    const email = String(rawEmail || "").toLowerCase().trim();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
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

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered." },
        { status: 409 }
      );
    }

    const verifyResult = await consumeVerificationCode(email, code, "register");
    if (!verifyResult.ok) {
      return NextResponse.json(
        { error: verifyResult.error },
        { status: verifyResult.status }
      );
    }

    const passwordHash = await hashPassword(password);
    await insertUser({
      uuid: getUuid(),
      email,
      nickname: email.split("@")[0],
      avatar_url: "",
      signin_type: "credentials",
      signin_provider: "credentials",
      signin_openid: email,
      signin_ip: await getClientIp(),
      created_at: new Date(),
      updated_at: new Date(),
      password_hash: passwordHash,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Register failed:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
