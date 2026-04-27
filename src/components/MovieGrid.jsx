"use client";

import MovieCard from "./MovieCard";
import { Link } from "@/lib/navigation";
import ScrollReveal from "./ScrollReveal";

/**
 * MovieGrid — editorial section with numbered heading.
 * Shows: section number + "section name" + italic subtitle.
 */
export default function MovieGrid({
  title,
  subtitle,
  movies,
  type = "movie",
  seeAllHref,
  sectionNumber = "",
  accent = "lime", // "lime" | "amber" | "crimson"
}) {
  if (!movies || movies.length === 0) return null;

  const accentClass =
    accent === "amber"
      ? "text-amber"
      : accent === "crimson"
      ? "text-crimson"
      : "text-accent";

  const dotColor =
    accent === "amber"
      ? "bg-amber"
      : accent === "crimson"
      ? "bg-crimson"
      : "bg-accent";

  return (
    <ScrollReveal>
      <section className="section-sm">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            {/* Section number strip */}
            <div className="flex items-baseline gap-4 mb-5">
              {sectionNumber && (
                <>
                  <span className={`text-[13px] font-[family-name:var(--font-mono)] ${accentClass} tracking-[0.18em]`}>
                    {sectionNumber} /
                  </span>
                  <span className={`w-8 h-px ${dotColor} opacity-60`} />
                </>
              )}
              <span className="text-[11px] font-[family-name:var(--font-mono)] text-text-secondary tracking-[0.22em] uppercase">
                Collection
              </span>
            </div>
            {/* Big italic headline */}
            <h2
              className="text-[clamp(2rem,4.5vw,4rem)] font-[family-name:var(--font-display)] text-text-primary leading-[0.95] tracking-[-0.04em]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className="mt-3 text-[16px] text-text-secondary italic font-[family-name:var(--font-display)] leading-snug"
                style={{ fontVariationSettings: '"opsz" 100, "SOFT" 100' }}
              >
                — {subtitle}
              </p>
            )}
          </div>

          {/* See all link */}
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="group inline-flex items-center gap-3 self-start md:self-end text-[12px] font-[family-name:var(--font-mono)] text-text-secondary hover:text-accent transition-colors tracking-[0.18em] uppercase"
            >
              <span>View All</span>
              <span className="w-10 h-px bg-current transition-all duration-500 group-hover:w-16" />
              <svg className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Grid — more breathing room between cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6 lg:gap-8">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} type={type} />
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
