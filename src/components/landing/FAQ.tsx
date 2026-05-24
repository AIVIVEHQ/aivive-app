"use client";

import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export default function FAQ() {
  const t = useTranslations("homepage.faq");

  const items = [
    { q: t("question_1.q"), a: t("question_1.a") },
    { q: t("question_2.q"), a: t("question_2.a") },
    { q: t("question_3.q"), a: t("question_3.a") }
  ];

  return (
    <div className="w-full space-y-4">
      {items.map((item, i) => (
        <details key={i} className="group w-full bg-white/5 border border-white/5 rounded-2xl open:bg-white/10 transition-colors duration-300">
          <summary className="flex cursor-pointer items-center justify-between p-6 font-medium text-white list-none [&::-webkit-details-marker]:hidden outline-none">
            <span className="text-lg">{item.q}</span>
            <span className="transition-transform duration-300 group-open:rotate-180">
              <ChevronDownIcon className="w-5 h-5 text-white/60" />
            </span>
          </summary>
          <div className="px-6 pb-6 text-white/60 leading-relaxed">
            {item.a}
          </div>
        </details>
      ))}
    </div>
  );
}