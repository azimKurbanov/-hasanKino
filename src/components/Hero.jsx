"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import { getBackdropUrl } from "@/lib/tmdb";

/**
 * Hero — editorial full-bleed opening spread.
 * Bold italic Fraunces title, side-mounted mono labels, corner meta-grid.
 */
export default function Hero({ movie }) {
  const t = useTranslations("hero");

  if (!movie) {
    return (
      <div className="h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-pulse-glow text-accent mono-label">Loading cinema…</div>
      </div>
    );
  }

  const backdrop = getBackdropUrl(movie.backdrop_path);
  const year = (movie.release_date || "").slice(0, 4);
  const rating = movie.vote_average;

  return (
    <section className="relative h-screen min-h-[720px] max-h-[1080px] w-full overflow-hidden">
      {/* Background image */}
      {backdrop && (
        <Image
          src={backdrop}
          alt=""
          fill
          priority
          quality={90}
          className="object-cover object-[50%_25%] scale-[1.04]"
          sizes="100vw"
        />
      )}

      {/* Cinematic gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#07070b] via-[#07070b]/75 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/20 to-[#07070b]/60" />
      <div className="absolute bottom-0 inset-x-0 h-[70%] bg-gradient-to-t from-[#07070b] via-[#07070b]/40 to-transparent" />

      {/* Scanlines overlay */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.04] mix-blend-overlay pointer-events-none" />

      {/* Ambient lime glow */}
      <div className="absolute bottom-[10%] left-[5%] w-[700px] h-[700px] rounded-full bg-accent/[0.03] blur-[160px] pointer-events-none animate-pulse-glow" />

      {/* ─── Top-right meta block (editorial frame marker) ─── */}
      <div className="absolute top-28 right-6 md:right-16 z-10 hidden md:flex flex-col items-end gap-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-secondary tracking-[0.22em] uppercase">
            Issue No.
          </span>
          <span className="text-[14px] font-[family-name:var(--font-mono)] text-accent tracking-[0.1em] mono-num">
            001 / {new Date().getFullYear()}
          </span>
        </div>
        <div className="w-32 h-px bg-white/10" />
        <div className="text-right">
          <div className="text-[10px] font-[family-name:var(--font-mono)] text-text-muted tracking-[0.22em] uppercase">
            Volume
          </div>
          <div className="text-[22px] font-[family-name:var(--font-display)] italic text-text-primary leading-none mt-1">
            Cinema Edit
          </div>
        </div>
      </div>

      {/* ─── Left side-label (vertical) ─── */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
        <div
          className="flex items-center gap-5 text-[10px] font-[family-name:var(--font-mono)] text-text-muted tracking-[0.25em] uppercase"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          <span>{t("trending")}</span>
          <span className="inline-block w-8 h-px bg-accent" style={{ writingMode: "horizontal-tb" }} />
          <span className="text-accent">Now Playing</span>
        </div>
      </div>

      {/* ─── Main content ─── */}
      <div className="relative z-10 h-full site-container flex items-end pb-28 lg:pb-40">
        <div className="max-w-[920px]">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2.5 mb-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-accent text-[11px] font-[family-name:var(--font-mono)] tracking-[0.25em] uppercase font-semibold">
              {t("trending")}
            </span>
          </div>

          {/* Title — Fraunces italic, huge */}
          <h1
            className="font-[family-name:var(--font-display)] italic text-text-primary leading-[0.88] tracking-[-0.045em] mb-10 animate-fade-up"
            style={{
              fontSize: "clamp(3rem, 8vw, 7.5rem)",
              fontVariationSettings: '"opsz" 144, "SOFT" 100',
              animationDelay: "200ms",
            }}
          >
            {movie.title}
          </h1>

          {/* Meta strip */}
          <div className="flex flex-wrap items-center gap-3 mb-8 animate-fade-up" style={{ animationDelay: "300ms" }}>
            {rating > 0 && (
              <div className="flex items-center gap-2 bg-accent/10 backdrop-blur-md text-accent text-[13px] font-bold px-4 py-2 rounded-full border border-accent/20 mono-num">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {rating.toFixed(1)}
              </div>
            )}
            {year && (
              <div className="text-text-secondary text-[13px] font-[family-name:var(--font-mono)] bg-white/[0.04] backdrop-blur-md px-4 py-2 rounded-full border border-white/[0.06] mono-num">
                {year}
              </div>
            )}
            <div className="text-text-secondary text-[13px] font-[family-name:var(--font-mono)] bg-white/[0.04] backdrop-blur-md px-4 py-2 rounded-full border border-white/[0.06] tracking-widest uppercase">
              4K · HDR
            </div>
          </div>

          {/* Overview */}
          <p
            className="text-text-secondary text-[16px] md:text-[18px] leading-[1.7] mb-12 line-clamp-3 max-w-[60ch] animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            {movie.overview}
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4 animate-fade-up" style={{ animationDelay: "500ms" }}>
            <Link href={`/movies/${movie.id}`} className="btn-primary">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {t("watch")}
            </Link>
            <Link href={`/movies/${movie.id}`} className="btn-ghost">
              {t("details")}
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Bottom bar — film strip meta ─── */}
      <div className="absolute bottom-0 inset-x-0 z-10 border-t border-white/[0.06] bg-black/30 backdrop-blur-sm animate-fade-up" style={{ animationDelay: "700ms" }}>
        <div className="site-container py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-muted tracking-[0.2em] uppercase">
              Feature
            </span>
            <span className="text-[13px] font-[family-name:var(--font-mono)] text-text-secondary truncate max-w-[240px]">
              {movie.title}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-muted tracking-[0.2em] uppercase hidden sm:inline">
              Scroll to explore
            </span>
            <svg className="w-4 h-4 text-accent animate-pulse-glow" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
