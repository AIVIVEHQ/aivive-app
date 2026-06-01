"use client";

import * as React from "react";
import { UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Link } from "@/i18n/navigation";
import { User } from "@/types/user";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { NavItem } from "@/types/blocks/base";
import { getFallbackAvatarUri } from "@/lib/avatar";

function getInitials(name?: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const compact = trimmed.replace(/\s/g, "");
  const letterCount = (compact.match(/[\p{L}]/gu) || []).length;
  if (letterCount < 2 || letterCount / compact.length < 0.5) return null;
  const letters = trimmed
    .split(/[\s_\-.@]+/)
    .map((part) => part.match(/[\p{L}]/u)?.[0])
    .filter(Boolean) as string[];
  if (letters.length === 0) return null;
  return (letters[0] + (letters[1] ?? "")).toUpperCase().slice(0, 2);
}

export default function SignUser({ user }: { user: User }) {
  const t = useTranslations();

  const dropdownItems: NavItem[] = [
    {
      title: user.nickname,
    },
    {
      title: t("user.user_center"),
      url: "/my-orders",
    },
    {
      title: t("user.my_history"),
      url: "/my-history",
    },
    // {
    //   title: t("user.admin_system"),
    //   url: "/admin/users", 
    // },
    {
      title: t("user.sign_out"),
      onClick: () => signOut(),
    },
  ];

  const initials = getInitials(user.nickname);
  const fallbackAvatar = React.useMemo(
    () => getFallbackAvatarUri(user.uuid || user.email || user.nickname || ""),
    [user.uuid, user.email, user.nickname]
  );
  const avatarSrc = user.avatar_url || fallbackAvatar;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={user.nickname || "Account"}
          className="rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        >
          <Avatar className="size-9 cursor-pointer border border-border/60 bg-muted/40 transition-colors hover:border-primary/40">
            <AvatarImage src={avatarSrc} alt={user.nickname || "Account"} />
            <AvatarFallback className="bg-muted/60 text-[11px] font-medium tracking-wide text-foreground/80">
              {initials ?? (
                <UserIcon
                  aria-hidden
                  className="size-4 text-muted-foreground"
                />
              )}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-background">
        {dropdownItems.map((item, index) => (
          <React.Fragment key={index}>
            <DropdownMenuItem
              key={index}
              className="cursor-pointer p-0" // Remove default padding/flex for full control over child
            >
              {item.url ? (
                <Link href={item.url as any} target={item.target} className="block w-full text-left p-2">
                  {item.title}
                </Link>
              ) : (
                <button onClick={item.onClick} className="block w-full text-left p-2">
                  {item.title}
                </button>
              )}
            </DropdownMenuItem>
            {index !== dropdownItems.length - 1 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
