import AuthForm, { AuthMode } from "@/components/sign/auth-form";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { isAuthEnabled } from "@/lib/auth";

// Right-side showcase image. Swap to any asset under /public.
const SHOWCASE_IMAGE = "/imgs/gallery/001.jpg";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; mode?: string }>;
}) {
  const locale = await getLocale();

  if (!isAuthEnabled()) {
    redirect({ href: "/", locale });
  }

  const { callbackUrl, mode } = await searchParams;
  const session = await auth();
  if (session) {
    redirect({ href: callbackUrl || "/", locale });
  }

  const defaultMode: AuthMode =
    mode === "signup" || mode === "reset" ? mode : "signin";

  return (
    <section className="container py-10 lg:py-16">
      <div className="mx-auto grid w-full max-w-6xl items-stretch gap-8 overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-2 lg:gap-0">
        {/* Showcase image — top on mobile, right on desktop */}
        <div className="relative order-1 h-48 w-full sm:h-64 lg:order-2 lg:h-auto lg:min-h-[560px]">
          <img
            src={SHOWCASE_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Form — bottom on mobile, left on desktop */}
        <div className="order-2 flex items-center justify-center p-6 sm:p-10 lg:order-1">
          <div className="w-full max-w-sm">
            <AuthForm defaultMode={defaultMode} callbackUrl={callbackUrl} />
            <p className="mt-8 text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
              By continuing, you agree to our{" "}
              <a href="/terms-of-service" target="_blank">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy-policy" target="_blank">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
