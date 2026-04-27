"use client";

import { Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";

/**
 * GenreShowcase — editorial genre grid.
 * Each cell is a huge display-type word that glows on hover.
 * Acts as a visual breathing moment between dense movie grids.
 */
const GENRE_KEYS = [
  "action",
  "drama",
  "comedy",
  "scifi",
  "thriller",
  "horror",
  "animation",
  "romance",
  "documentary",
  "fantasy",
  "crime",
  "adventure",
];

export default function GenreShowcase() {
  const t = useTranslations("genres");

  return (
    <div className="relative">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {GENRE_KEYS.map((key, i) => (
          <Link
            key={key}
            href="/genres"
            className="group relative flex items-center justify-center min-h-[120px] md:min-h-[160px] border-t border-l border-white/[0.05] last:border-r [&:nth-child(2n)]:border-r md:[&:nth-child(2n)]:border-r-0 md:[&:nth-child(3n)]:border-r lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(4n)]:border-r overflow-hidden"
          >
            {/* Hover backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.06] to-amber/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Index */}
            <span className="absolute top-4 left-4 text-[10px] font-[family-name:var(--font-mono)] text-text-muted tracking-[0.2em]">
              {String(i + 1).padStart(2, "0")}
            </span>

            {/* Word */}
            <span
              className="relative text-[clamp(1.5rem,3.5vw,2.75rem)] font-[family-name:var(--font-display)] italic leading-none tracking-[-0.035em] text-text-primary/80 group-hover:text-accent transition-all duration-500 group-hover:scale-105"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
            >
              {t(key)}
            </span>

            {/* Arrow indicator */}
            <svg
              className="absolute bottom-4 right-4 w-4 h-4 text-text-muted opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" d="M7 17L17 7M17 7H9M17 7V15" />
            </svg>
          </Link>
        ))}
      </div>
      {/* Bottom border for grid completeness */}
      <div className="border-b border-white/[0.05]" />
    </div>
  );
}
