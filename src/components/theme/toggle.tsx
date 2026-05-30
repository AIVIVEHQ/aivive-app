"use client";

import { BsMoonStars, BsSun } from "react-icons/bs";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Keep the DOM structure stable across mount to avoid downstream `useId`
  // path shifts that cause hydration mismatches in sibling Radix components.
  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <div
      className="flex items-center gap-x-2 px-2"
      suppressHydrationWarning
    >
      {isDark ? (
        <BsSun
          className="cursor-pointer text-lg text-muted-foreground"
          onClick={() => mounted && setTheme("light")}
          width={80}
          height={20}
        />
      ) : (
        <BsMoonStars
          className="cursor-pointer text-lg text-muted-foreground"
          onClick={() => mounted && setTheme("dark")}
          width={80}
          height={20}
        />
      )}
    </div>
  );
}
