"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useEffect } from "react";

const GENRE_ICONS = {
  28: "💥", 12: "🧭", 16: "✨", 35: "😂", 80: "🔪", 99: "📹",
  18: "🎭", 10751: "👨‍👩‍👧", 14: "🧙", 36: "⚔️", 27: "👻",
  10402: "🎵", 9648: "🕵️", 10749: "💕", 878: "🚀", 10770: "📺",
  53: "😰", 10752: "🪖", 37: "🤠", 10759: "⚡", 10762: "🧸",
  10763: "📰", 10764: "🎤", 10765: "👽", 10766: "💔", 10767: "🗣️",
  10768: "🎖️",
};

export default function GenreFilter({ genres, activeGenre, onSelect }) {
  const t = useTranslations("filters");
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [genres]);

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {/* Fade edges */}
      {canScrollLeft && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <button onClick={() => scroll(-1)} className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
        </>
      )}
      {canScrollRight && (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />
          <button onClick={() => scroll(1)} className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 -mb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <button
          onClick={() => onSelect(null)}
          className={`flex-none flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-medium transition-all duration-200 ${
            !activeGenre
              ? "bg-accent text-text-inverse"
              : "bg-white-4 border border-border text-text-secondary hover:text-text-primary hover:bg-white-6"
          }`}
        >
          {t("all")}
        </button>

        {genres?.map((genre) => (
          <button
            key={genre.id}
            onClick={() => onSelect(genre.id)}
            className={`flex-none flex items-center gap-1.5 h-10 px-4 rounded-lg text-[13px] font-medium transition-all duration-200 ${
              activeGenre === genre.id
                ? "bg-accent text-text-inverse"
                : "bg-white-4 border border-border text-text-secondary hover:text-text-primary hover:bg-white-6"
            }`}
          >
            <span className="text-[14px]">{GENRE_ICONS[genre.id] || "🎬"}</span>
            {genre.name}
          </button>
        ))}
      </div>
    </div>
  );
}
