import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserHistory from "@/components/history/UserHistory";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("history");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function MyHistoryPage() {
  // Require authentication
  const session = await auth();
  if (!session?.user?.uuid) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            My Generations
          </h1>
          <p className="text-muted-foreground">
            View and manage all your AI-generated images
          </p>
        </div>

        {/* History component */}
        <UserHistory />
      </div>
    </div>
  );
}
