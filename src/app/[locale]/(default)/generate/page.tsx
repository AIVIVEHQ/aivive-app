import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import GenerationForm from "@/components/generation/GenerationForm";
import SignIn from "@/components/sign/sign_in";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("generation");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function GeneratePage() {
  const t = await getTranslations("generation");
  const session = await auth();
  if (!session?.user?.uuid) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-2">AI Image Generation</h2>
        <p className="text-muted-foreground mb-6">Sign in to start generating images</p>
        <div className="flex justify-center">
          <SignIn />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            AI Image Generation
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform your ideas into stunning images with AI
          </p>
        </div>

        {process.env.IMAGE_GENERATION_PAUSED === "true" ? (
          <div className="mx-auto max-w-xl rounded-xl border-2 border-destructive/30 bg-destructive/5 backdrop-blur-sm p-6 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <span className="text-destructive text-lg">⚠</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive mb-1">
                {t("insufficient_credits")}
              </p>
            </div>
          </div>
        ) : (
          <GenerationForm />
        )}
      </div>
    </div>
  );
}
