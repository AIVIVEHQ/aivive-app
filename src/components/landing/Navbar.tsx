"use client";

import { MenuIcon, ChevronRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app";

export default function Navbar() {
  const { user, setShowSignModal } = useAppContext();
  const router = useRouter();

  const handlePrimary = () => {
    if (!user) {
      setShowSignModal(true);
      return;
    }
    router.push("/generate");
  };

  const handleSignIn = () => {
    setShowSignModal(true);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav transition-all duration-300 border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center cursor-pointer" onClick={() => router.push("/")}>
          <span className="text-lg font-display tracking-[0.18em] text-foreground">AIVIVE</span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-sm font-mono uppercase tracking-wider text-muted-foreground">
          {['Generate', 'Gallery', 'Pricing', 'Whitepaper'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-foreground transition-colors relative group">
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <button
              onClick={() => router.push("/my-credits")}
              className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-display text-primary text-sm">
                {(user.nickname || user.email || "A").charAt(0).toUpperCase()}
              </span>
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </button>
          )}
          <button
            onClick={handlePrimary}
            className="group bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-[0_0_20px_oklch(0.902_0.152_174.5/0.25)] hover:shadow-[0_0_30px_oklch(0.902_0.152_174.5/0.45)]"
          >
            <span>Start Creating</span>
            <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="md:hidden text-foreground">
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
