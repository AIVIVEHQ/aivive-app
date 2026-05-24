import { auth } from "@/auth/index";
import { getUserCreditBalance } from "@/services/credit";
import HomepageGenerationClient from "./client";

export default async function HomepageGeneration() {
  const session = await auth();

  let creditBalance = 0;
  let hasCreditError = false;

  if (session?.user?.uuid) {
    try {
      creditBalance = await getUserCreditBalance(session.user.uuid);
    } catch (error) {
      console.error("Failed to get credit balance:", error);
      hasCreditError = true;
    }
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-6xl">
        <HomepageGenerationClient
          isAuthenticated={!!session?.user}
          creditBalance={creditBalance}
          hasCreditError={hasCreditError}
        />
      </div>
    </section>
  );
}
