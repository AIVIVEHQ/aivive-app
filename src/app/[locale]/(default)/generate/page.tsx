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

        <GenerationForm />
      </div>
    </div>
  );
}
