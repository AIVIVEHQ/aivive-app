"use client";

import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";

export default function SignIn() {
  const t = useTranslations();
  const { gotoSignIn } = useAppContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    gotoSignIn();
  };

  return (
    <Button
      variant="default"
      onClick={handleClick}
      className="cursor-pointer"
      type="button"
    >
      {t("user.sign_in")}
    </Button>
  );
}
