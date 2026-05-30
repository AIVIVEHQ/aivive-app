"use client";

import googleOneTap from "google-one-tap";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function useOneTapLogin(enabled: boolean = true) {
  const { status } = useSession();

  useEffect(() => {
    if (!enabled) return;
    if (status !== "unauthenticated") return;

    const trigger = () => {
      const options = {
        client_id: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
        auto_select: false,
        cancel_on_tap_outside: false,
        context: "signin",
      };
      googleOneTap(options, async (response: any) => {
        const res = await signIn("google-one-tap", {
          credential: response.credential,
          redirect: false,
        });
        console.log("signIn ok", res);
      });
    };

    trigger();
    const intervalId = setInterval(trigger, 3000);
    return () => clearInterval(intervalId);
  }, [enabled, status]);
}
