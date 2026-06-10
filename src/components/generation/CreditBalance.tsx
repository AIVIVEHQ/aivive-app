"use client";

import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditBalanceProps {
  balance: number;
}

export default function CreditBalance({ balance }: CreditBalanceProps) {
  const isLow = balance < 20;
  const isVeryLow = balance < 10;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border",
        isVeryLow
          ? "border-destructive bg-destructive/10"
          : isLow
            ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
            : "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2 rounded-full",
            isVeryLow
              ? "bg-destructive/20"
              : isLow
                ? "bg-orange-100 dark:bg-orange-900/30"
                : "bg-primary/10"
          )}
        >
          <Coins
            className={cn(
              "w-5 h-5",
              isVeryLow
                ? "text-destructive"
                : isLow
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-primary"
            )}
          />
        </div>
        <div>
          <p className="text-sm font-medium">Credit Balance</p>
          <p
            className={cn(
              "text-2xl font-bold",
              isVeryLow
                ? "text-destructive"
                : isLow
                  ? "text-orange-600 dark:text-orange-400"
                  : ""
            )}
          >
            {balance.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
