"use client";

import { Link } from "@/lib/navigation";
import { useTranslations, useLocale } from "next-intl";

/**
 * CTABanner — massive end-of-homepage call to action.
 * Oversized italic display headline, dual buttons, ambient glow.
 */
const HEADLINES = {
  ru: { line1: "Кинотеатр", line2: "у тебя в кармане." },
  en: { line1: "The cinema", line2: "in your pocket." },
  uz: { line1: "Kinoteatr", line2: "sizning cho‘ntagingizda." },
};

const SUB = {
  ru: "Тысячи фильмов и сериалов. Ноль рекламы. Ничего не стоит.",
  en: "Thousands of movies and shows. Zero ads. Completely free.",
  uz: "Minglab filmlar va seriallar. Reklamasiz. Mutlaqo bepul.",
};

export default function CTABanner() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const head = HEADLINES[locale] || HEADLINES.en;

  return (
    <div className="relative overflow-hidden rounded-[32px] lg:rounded-[48px] bg-gradient-to-br from-bg-card via-bg-secondary to-bg-card border border-white/[0.06]">
      {/* Ambient glows */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/[0.08] blur-[140px] animate-drift" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber/[0.06] blur-[140px] animate-drift" style={{ animationDelay: "4s" }} />

      {/* Grid texture */}
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />

      {/* Diagonal scanlines, very faint */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />

      {/* Content */}
      <div className="relative px-8 md:px-16 lg:px-24 py-20 lg:py-32 flex flex-col items-center text-center">
        {/* Section tag */}
        <div className="flex items-center gap-3 mb-8">
          <span className="w-10 h-px bg-accent" />
          <span className="text-[11px] font-[family-name:var(--font-mono)] text-accent tracking-[0.2em] uppercase">
            Start Watching
          </span>
          <span className="w-10 h-px bg-accent" />
        </div>

        {/* Huge headline */}
        <h2
          className="text-[clamp(3rem,9vw,9rem)] font-[family-name:var(--font-display)] leading-[0.88] tracking-[-0.045em] text-text-primary max-w-[14ch]"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
        >
          {head.line1}
          <br />
          <span
            className="italic gradient-text"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
          >
            {head.line2}
          </span>
        </h2>

        {/* Sub */}
        <p className="mt-8 text-[16px] lg:text-[18px] text-text-secondary max-w-xl leading-[1.7]">
          {SUB[locale] || SUB.en}
        </p>

        {/* Buttons */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link href="/movies" className="btn-primary">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {t("movies")}
          </Link>
          <Link href="/series" className="btn-ghost">
            {t("series")}
          </Link>
        </div>

        {/* Foot meta row — mono labels like footer of a record sleeve */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] w-full max-w-2xl grid grid-cols-3 gap-4">
          {[
            { k: "Catalog", v: "50 000+" },
            { k: "Languages", v: "3" },
            { k: "Price", v: "$0.00" },
          ].map((m) => (
            <div key={m.k} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-muted tracking-[0.2em] uppercase">
                {m.k}
              </span>
              <span className="text-[18px] lg:text-[22px] font-[family-name:var(--font-display)] text-text-primary mono-num">
                {m.v}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
