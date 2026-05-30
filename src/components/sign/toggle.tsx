"use client";

import { useEffect, useState } from "react";
import SignIn from "./sign_in";
import User from "./user";
import { useAppContext } from "@/contexts/app";
import { isAuthEnabled } from "@/lib/auth";

export default function SignToggle() {
  const { user } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!isAuthEnabled()) {
    return null;
  }

  // Keep SSR and first client render identical so downstream Radix
  // components (e.g. the mobile Sheet) get a stable `useId` counter.
  if (!mounted) {
    return <div className="flex items-center gap-x-2 px-2" aria-hidden />;
  }

  return (
    <div className="flex items-center gap-x-2 px-2">
      {user ? <User user={user} /> : <SignIn />}
    </div>
  );
}
