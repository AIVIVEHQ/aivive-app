"use client";

import * as React from "react";

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={user.avatar_url} alt={user.nickname} />
          <AvatarFallback>{user.nickname}</AvatarFallback>
        </Avatar>
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
