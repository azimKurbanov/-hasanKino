import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/navigation";

export default function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const locale = useLocale();

  return (
    <footer className="relative mt-24 border-t border-white/[0.06] overflow-hidden">
      {/* Background treatment */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-accent/[0.03] blur-[160px] pointer-events-none" />

      <div className="relative site-container py-20 lg:py-28">
        {/* ─── Giant italic wordmark ─── */}
        <div className="mb-20 lg:mb-28">
          <h2
            className="text-[clamp(4rem,14vw,14rem)] font-[family-name:var(--font-display)] italic leading-[0.85] tracking-[-0.05em] text-text-primary/90 select-none"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
          >
            KINO.
          </h2>
          <p className="mt-6 text-[16px] lg:text-[18px] text-text-secondary max-w-lg leading-[1.7]">
            {t("description")}
          </p>
        </div>

        {/* ─── Columns ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 mb-20">
          {/* Navigate */}
          <div>
            <h3 className="mono-label mb-6">— {t("links")}</h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: nav("home") },
                { href: "/movies", label: nav("movies") },
                { href: "/series", label: nav("series") },
                { href: "/genres", label: nav("genres") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] font-[family-name:var(--font-display)] text-text-primary/80 hover:text-accent hover:italic transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Discover */}
          <div>
            <h3 className="mono-label mb-6">— Discover</h3>
            <ul className="space-y-3">
              {[
                { href: "/movies", label: nav("popular") },
                { href: "/movies", label: nav("new") },
                { href: "/movies", label: nav("favorites") },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-[15px] font-[family-name:var(--font-display)] text-text-primary/80 hover:text-accent hover:italic transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Languages */}
          <div>
            <h3 className="mono-label mb-6">— Languages</h3>
            <ul className="space-y-3">
              {[
                { code: "ru", name: "Русский" },
                { code: "en", name: "English" },
                { code: "uz", name: "O‘zbekcha" },
              ].map((l) => (
                <li key={l.code} className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-[family-name:var(--font-mono)] tracking-[0.15em] ${
                      locale === l.code ? "text-accent" : "text-text-muted"
                    }`}
                  >
                    {l.code.toUpperCase()}
                  </span>
                  <span
                    className={`text-[14px] font-[family-name:var(--font-display)] ${
                      locale === l.code
                        ? "text-accent italic"
                        : "text-text-primary/80"
                    }`}
                  >
                    {l.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Colophon */}
          <div>
            <h3 className="mono-label mb-6">— Colophon</h3>
            <ul className="space-y-3 text-[13px] text-text-secondary leading-relaxed">
              <li>
                <span className="text-text-muted font-[family-name:var(--font-mono)] text-[11px] tracking-widest uppercase">Set in </span>
                <span className="italic font-[family-name:var(--font-display)]">Fraunces</span>
              </li>
              <li>
                <span className="text-text-muted font-[family-name:var(--font-mono)] text-[11px] tracking-widest uppercase">Body </span>
                <span>Inter</span>
              </li>
              <li>
                <span className="text-text-muted font-[family-name:var(--font-mono)] text-[11px] tracking-widest uppercase">Labels </span>
                <span className="font-[family-name:var(--font-mono)]">JetBrains Mono</span>
              </li>
              <li>
                <span className="text-text-muted font-[family-name:var(--font-mono)] text-[11px] tracking-widest uppercase">Data </span>
                <span>TMDB</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Bottom strip ─── */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-[12px] text-text-muted font-[family-name:var(--font-mono)] tracking-[0.15em] uppercase">
            © {new Date().getFullYear()} KINO. {t("copyright")}
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-muted tracking-[0.2em] uppercase">
              v1.0 · Editorial Edition
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
              <span className="text-[10px] font-[family-name:var(--font-mono)] text-accent tracking-[0.2em] uppercase">
                All Systems Go
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
