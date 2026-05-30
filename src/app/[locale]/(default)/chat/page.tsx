import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import SignIn from "@/components/sign/sign_in";
import AvatarScripts from "./avatar-scripts";
import ChatClient from "./chat-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "chat" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.uuid) {
    const t = await getTranslations({ locale, namespace: "chat" });
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-semibold">{t("pageTitle")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("signInPrompt")}
        </p>
        <div className="mt-6">
          <SignIn />
        </div>
      </div>
    );
  }

  return (
    <>
      <AvatarScripts />
      <ChatClient />
    </>
  );
}
