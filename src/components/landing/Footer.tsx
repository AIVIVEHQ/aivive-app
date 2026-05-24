import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("homepage.footer");

  const footerSections = [
    { titleKey: "sections.platform", links: ["generator", "showcase", "pricing", "enterprise"] },
    { titleKey: "sections.company", links: ["about", "blog", "careers", "contact"] },
    { titleKey: "sections.legal", links: ["privacy", "terms", "security"] },
    { titleKey: "sections.resources", links: ["documentation", "community", "help_center"] }
  ];

  return (
    <footer className="bg-background border-t border-border pt-24 pb-12 px-6 relative z-10">
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-6 gap-12 mb-20">
        <div className="md:col-span-2 space-y-6">
           <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg border border-primary/30 flex items-center justify-center bg-primary/5">
               <span className="font-display text-primary text-base">A</span>
            </div>
            <span className="text-xl font-display tracking-[0.18em] text-foreground">{t("brand.title")}</span>
          </div>
          <p className="text-muted-foreground max-w-xs leading-relaxed">
            {t("brand.description")}
          </p>
          <div className="flex gap-4">
             {['𝕏', 'In', 'Gt'].map((social) => (
               <div key={social} className="w-10 h-10 rounded-full bg-primary/5 border border-primary/15 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 flex items-center justify-center text-foreground cursor-pointer">
                 <span className="text-sm font-bold">{social}</span>
               </div>
             ))}
          </div>
        </div>

        {footerSections.map((section) => (
          <div key={section.titleKey}>
            <h4 className="text-foreground font-display tracking-wider uppercase text-sm mb-6">{t(section.titleKey)}</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              {section.links.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-foreground transition-colors">{t(`links.${link}`)}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-mono">
        <p>{t("copyright")}</p>
        <div className="flex gap-6">
          <span className="hover:text-primary cursor-pointer inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t("system_status")}
          </span>
        </div>
      </div>
    </footer>
  );
}