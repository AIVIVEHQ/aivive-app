import { Metadata } from "next";

import { auth } from "@/auth";
import SignIn from "@/components/sign/sign_in";
import TwitterPublisherClient from "@/components/twitter-publisher/TwitterPublisherClient";

export const metadata: Metadata = {
  title: "Twitter/X AI Publisher",
  description: "Generate one tweet with a matching image and publish it to Twitter/X.",
};

export default async function TwitterPublisherPage() {
  const session = await auth();

  if (!session?.user?.uuid) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-semibold">Twitter/X AI Publisher</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to generate tweet copy, create a matching image, and publish to Twitter/X.
        </p>
        <div className="mt-6">
          <SignIn />
        </div>
      </div>
    );
  }

  return <TwitterPublisherClient />;
}
