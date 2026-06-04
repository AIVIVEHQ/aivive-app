"use client";

import * as React from "react";
import { useEffect, useState } from "react";

import { SiGithub, SiGoogle } from "react-icons/si";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

export type AuthMode = "signin" | "signup" | "reset";

export default function AuthForm({
  className,
  defaultMode = "signin",
  callbackUrl,
}: {
  className?: string;
  defaultMode?: AuthMode;
  callbackUrl?: string;
}) {
  const t = useTranslations("sign_modal");
  const locale = useLocale();

  const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";
  const githubEnabled = process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true";
  const emailEnabled =
    process.env.NEXT_PUBLIC_AUTH_EMAIL_PASSWORD_ENABLED === "true";
  const hasOAuth = googleEnabled || githubEnabled;

  const redirectTarget = callbackUrl || "/generate";

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Reset transient state when switching modes
  useEffect(() => {
    setError("");
    setInfo("");
    setCode("");
    setPassword("");
  }, [mode]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  async function handleSendCode() {
    setError("");
    setInfo("");
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setIsSendingCode(true);
    try {
      const purpose = mode === "signup" ? "register" : "reset_password";
      const resp = await fetch("/api/auth/email-code/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose, locale }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Failed to send code.");
        if (data.cooldownSeconds) setCooldown(Number(data.cooldownSeconds));
        return;
      }
      setInfo(t("code_sent"));
      setCooldown(Number(data.cooldownSeconds) || 60);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: redirectTarget,
        });
        if (result?.error) {
          throw new Error("Invalid email or password");
        }
        window.location.href = redirectTarget;
        return;
      }

      if (mode === "signup") {
        const resp = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, code }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Registration failed");

        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: redirectTarget,
        });
        if (result?.error) throw new Error("Auto sign-in failed");
        window.location.href = redirectTarget;
        return;
      }

      // reset
      const resp = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: password }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Password reset failed");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: redirectTarget,
      });
      if (result?.error) throw new Error("Auto sign-in failed");
      window.location.href = redirectTarget;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const showCode = mode === "signup" || mode === "reset";
  const passwordLabel =
    mode === "reset" ? t("new_password_title") : t("password_title");
  const submitLabel =
    mode === "signin"
      ? t("submit_signin")
      : mode === "signup"
        ? t("submit_signup")
        : t("submit_reset");
  const titleKey =
    mode === "signin"
      ? "sign_in_title"
      : mode === "signup"
        ? "sign_up_title"
        : "reset_title";
  const descKey =
    mode === "signin"
      ? "sign_in_description"
      : mode === "signup"
        ? "sign_up_description"
        : "reset_description";

  return (
    <div className={cn("grid w-full gap-6", className)}>
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t(titleKey)}</h1>
        <p className="text-sm text-muted-foreground">{t(descKey)}</p>
      </div>

      <div className="grid items-start gap-4">
        {mode === "signin" && hasOAuth && (
          <>
            {googleEnabled && (
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => signIn("google", { callbackUrl: redirectTarget })}
                type="button"
              >
                <SiGoogle className="w-4 h-4" />
                {t("google_sign_in")}
              </Button>
            )}
            {githubEnabled && (
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => signIn("github", { callbackUrl: redirectTarget })}
                type="button"
              >
                <SiGithub className="w-4 h-4" />
                {t("github_sign_in")}
              </Button>
            )}
            {emailEnabled && (
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  {t("or")}
                </span>
              </div>
            )}
          </>
        )}

        {emailEnabled && (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="auth-email">{t("email_title")}</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {showCode && (
              <div className="grid gap-2">
                <Label htmlFor="auth-code">{t("code_title")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="auth-code"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder={t("code_placeholder")}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={isSendingCode || cooldown > 0}
                    className="whitespace-nowrap shrink-0"
                  >
                    {cooldown > 0
                      ? t("resend_in", { seconds: cooldown })
                      : t("send_code")}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="auth-password">{passwordLabel}</Label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                placeholder={t("password_placeholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === "signin" ? 1 : 8}
                required
              />
            </div>

            {info && !error && (
              <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                {info}
              </p>
            )}
            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("loading") : submitLabel}
            </Button>
          </form>
        )}

        <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground pt-1">
          {mode === "signin" && (
            <>
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="text-primary hover:underline underline-offset-4"
              >
                {t("forgot_password")}
              </button>
              <div>
                {t("no_account")}{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-primary hover:underline underline-offset-4"
                >
                  {t("sign_up_title")}
                </button>
              </div>
            </>
          )}
          {mode === "signup" && (
            <div>
              {t("have_account")}{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-primary hover:underline underline-offset-4"
              >
                {t("sign_in_title")}
              </button>
            </div>
          )}
          {mode === "reset" && (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-primary hover:underline underline-offset-4"
            >
              {t("back_to_signin")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
