"use client";

import Image from "next/image";
import { Link } from "@/lib/navigation";
import { getBackdropUrl, getImageUrl } from "@/lib/tmdb";
import { useTranslations } from "next-intl";

/**
 * EditorialFeature — magazine-style spread for one featured movie.
 * Asymmetric 12-column layout: big portrait poster on the left,
 * oversized italic title + pull-quote on the right.
 */
export default function EditorialFeature({ movie, sectionNumber = "02" }) {
  const t = useTranslations("hero");
  if (!movie) return null;

  const poster = getImageUrl(movie.poster_path, "w780");
  const backdrop = getBackdropUrl(movie.backdrop_path);
  const title = movie.title || movie.name || "";
  const year = (movie.release_date || movie.first_air_date || "").slice(0, 4);
  const rating = movie.vote_average;
  const href = `/movies/${movie.id}`;

  return (
    <div className="relative">
      {/* Faint backdrop ghost */}
      {backdrop && (
        <div className="absolute inset-0 -mx-6 overflow-hidden rounded-[32px] opacity-[0.08] pointer-events-none">
          <Image
            src={backdrop}
            alt=""
            fill
            className="object-cover blur-2xl scale-110"
            sizes="100vw"
          />
        </div>
      )}

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* ── Left: big portrait poster ── */}
        <div className="lg:col-span-5 lg:col-start-1 relative">
          <div className="relative aspect-[2/3] max-w-[460px] mx-auto lg:mx-0 rounded-2xl overflow-hidden poster-shadow ring-1 ring-white/[0.06]">
            {poster && (
              <Image
                src={poster}
                alt={title}
                fill
                sizes="(max-width:1024px) 80vw, 460px"
                className="object-cover"
              />
            )}

            {/* Tape corner — retro magazine detail */}
            <div className="absolute -top-3 left-8 w-20 h-7 bg-amber/20 backdrop-blur-sm border border-amber/40 rotate-[-4deg] origin-top-left" />
          </div>

          {/* Rating stamp */}
          {rating > 0 && (
            <div className="absolute -bottom-6 -right-2 lg:right-8 w-[120px] h-[120px] rounded-full bg-accent flex items-center justify-center rotate-[-8deg] shadow-glow">
              <div className="text-center text-text-inverse">
                <div className="text-[10px] font-[family-name:var(--font-mono)] tracking-[0.15em] uppercase opacity-70">
                  Score
                </div>
                <div className="text-[40px] font-[family-name:var(--font-display)] font-medium leading-none mt-1">
                  {rating.toFixed(1)}
                </div>
                <div className="text-[9px] font-[family-name:var(--font-mono)] tracking-[0.2em] uppercase opacity-60 mt-1">
                  / 10
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: editorial copy ── */}
        <div className="lg:col-span-7 lg:col-start-6 relative">
          {/* Section number + label */}
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-[13px] font-[family-name:var(--font-mono)] text-accent tracking-[0.18em]">
              {sectionNumber} /
            </span>
            <span className="text-[11px] font-[family-name:var(--font-mono)] text-text-secondary tracking-[0.22em] uppercase">
              Editor&apos;s Pick
            </span>
          </div>

          {/* Huge italic title */}
          <h2
            className="text-[clamp(2.5rem,6vw,6rem)] font-[family-name:var(--font-display)] italic leading-[0.9] tracking-[-0.04em] text-text-primary mb-8"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
          >
            {title}
          </h2>

          {/* Meta strip */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {year && (
              <span className="chip chip-muted mono-num">{year}</span>
            )}
            <span className="chip chip-amber">Featured</span>
            <span className="chip chip-accent">4K · HDR</span>
          </div>

          {/* Pull-quote description */}
          {movie.overview && (
            <blockquote className="relative pl-6 border-l border-accent/40 mb-10 editorial-measure">
              <span className="absolute -left-2 -top-4 text-accent/30 text-[60px] font-[family-name:var(--font-display)] italic leading-none select-none">
                &ldquo;
              </span>
              <p className="text-[17px] lg:text-[19px] leading-[1.7] text-text-secondary font-[family-name:var(--font-body)]">
                {movie.overview}
              </p>
            </blockquote>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Link href={href} className="btn-primary">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {t("watch")}
            </Link>
            <Link href={href} className="btn-ghost">
              {t("details")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
