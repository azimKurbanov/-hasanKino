import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  getTrending,
  getTopRatedMovies,
  getNowPlayingMovies,
  getPopularSeries,
  getUpcomingMovies,
  getPopularMovies,
  getTopRatedSeries,
} from "@/lib/tmdb";
import Hero from "@/components/Hero";
import MovieGrid from "@/components/MovieGrid";
import TrendingCarousel from "@/components/TrendingCarousel";
import StatsBar from "@/components/StatsBar";
import AmbientBackground from "@/components/AmbientBackground";
import ScrollReveal from "@/components/ScrollReveal";
import MarqueeTicker from "@/components/MarqueeTicker";
import GenreShowcase from "@/components/GenreShowcase";
import EditorialFeature from "@/components/EditorialFeature";
import CTABanner from "@/components/CTABanner";

const SECTION_COPY = {
  ru: {
    top10: { sub: "десятка недели, без жалости" },
    editorial: { label: "Выбор редакции", sub: "фильм, который стоит увидеть первым" },
    genres: { title: "Жанры", sub: "начните с настроения, а не с названия" },
    upcoming: "Скоро в прокате",
    popularMovies: { sub: "сейчас смотрит весь мир" },
    topRated: { sub: "классика и новые шедевры" },
    topSeries: { sub: "многосерийные истории" },
    newReleases: { sub: "свежее из кинозалов" },
    topRatedSeries: { sub: "телевидение как искусство" },
  },
  en: {
    top10: { sub: "the weekly ten, no mercy" },
    editorial: { label: "Editor's Pick", sub: "one film you should see first" },
    genres: { title: "Genres", sub: "start from a mood, not a title" },
    upcoming: "Coming Soon",
    popularMovies: { sub: "what the world is watching right now" },
    topRated: { sub: "classics and new masterpieces" },
    topSeries: { sub: "long-form stories" },
    newReleases: { sub: "straight from the theaters" },
    topRatedSeries: { sub: "television as art" },
  },
  uz: {
    top10: { sub: "haftaning o'nligi" },
    editorial: { label: "Tahririyat tanlovi", sub: "birinchi navbatda ko'rishingiz kerak bo'lgan film" },
    genres: { title: "Janrlar", sub: "sarlavhadan emas, kayfiyatdan boshlang" },
    upcoming: "Tez kunda",
    popularMovies: { sub: "hozir butun dunyo ko'rmoqda" },
    topRated: { sub: "klassika va yangi durdonalar" },
    topSeries: { sub: "uzoq davom etadigan hikoyalar" },
    newReleases: { sub: "to'g'ridan-to'g'ri kinoteatrdan" },
    topRatedSeries: { sub: "televideniye san'at sifatida" },
  },
};

const MARQUEE = {
  ru: ["Кино", "которое остаётся", "в памяти", "навсегда"],
  en: ["Cinema", "that stays with you", "forever", "and ever"],
  uz: ["Kino", "hotirangizda qoladigan", "abadiy", "tomosha qiling"],
};

/* ─── Skeleton fallbacks ─── */
function GridSkeleton() {
  return (
    <div className="site-container section-sm">
      <div className="h-8 w-48 bg-white/[0.04] rounded-lg mb-10 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function CarouselSkeleton() {
  return (
    <div className="site-container section-sm">
      <div className="h-8 w-48 bg-white/[0.04] rounded-lg mb-10 animate-pulse" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-48 aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse shrink-0" />
        ))}
      </div>
    </div>
  );
}

/* ─── Streaming sections — each fetches only what it needs ─── */

async function HeroSection({ locale }) {
  const lang = locale === "uz" ? "en" : locale;
  const trending = await getTrending(lang).catch(() => ({ results: [] }));
  return <Hero movie={trending.results?.[0]} />;
}

async function TopTenSection({ locale }) {
  const lang = locale === "uz" ? "en" : locale;
  const copy = SECTION_COPY[locale] || SECTION_COPY.en;
  const trending = await getTrending(lang).catch(() => ({ results: [] }));
  return (
    <section className="site-container section-sm relative z-10">
      <ScrollReveal>
        <div className="flex items-baseline gap-4 mb-10">
          <span className="text-[13px] font-[family-name:var(--font-mono)] text-accent tracking-[0.18em]">01 /</span>
          <span className="w-10 h-px bg-accent" />
          <span className="text-[11px] font-[family-name:var(--font-mono)] text-text-secondary tracking-[0.22em] uppercase">Weekly Ten</span>
        </div>
        <h2
          className="text-[clamp(2.25rem,5vw,4.5rem)] font-[family-name:var(--font-display)] text-text-primary leading-[0.95] tracking-[-0.04em] mb-4"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
        >
          Top 10.{" "}
          <span className="italic text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
            This Week
          </span>
        </h2>
        <p className="text-[16px] text-text-secondary italic font-[family-name:var(--font-display)] mb-12 max-w-xl"
          style={{ fontVariationSettings: '"opsz" 100, "SOFT" 100' }}>
          — {copy.top10.sub}
        </p>
        <TrendingCarousel movies={trending.results?.slice(0, 10)} />
      </ScrollReveal>
    </section>
  );
}

async function EditorialSection({ locale }) {
  const lang = locale === "uz" ? "en" : locale;
  const [trending, topRated, nowPlaying] = await Promise.all([
    getTrending(lang).catch(() => ({ results: [] })),
    getTopRatedMovies(lang).catch(() => ({ results: [] })),
    getNowPlayingMovies(lang).catch(() => ({ results: [] })),
  ]);
  const editorialMovie = trending.results?.[1] || topRated.results?.[0] || nowPlaying.results?.[0];
  return (
    <section className="site-container section relative z-10">
      <ScrollReveal>
        <EditorialFeature movie={editorialMovie} sectionNumber="02" />
      </ScrollReveal>
    </section>
  );
}

async function NewReleasesSection({ locale }) {
  const lang = locale === "uz" ? "en" : locale;
  const copy = SECTION_COPY[locale] || SECTION_COPY.en;
  const t = await getTranslations({ locale, namespace: "home" });
  const nowPlaying = await getNowPlayingMovies(lang).catch(() => ({ results: [] }));
  return (
    <div className="site-container relative z-10">
      <MovieGrid
        title={t("newReleases")}
        subtitle={copy.newReleases.sub}
        movies={nowPlaying.results?.slice(0, 12)}
        seeAllHref="/movies"
        sectionNumber="03"
        accent="lime"
      />
    </div>
  );
}

async function PopularMoviesSection({ locale }) {
  const lang = locale === "uz" ? "en" : locale;
  const copy = SECTION_COPY[locale] || SECTION_COPY.en;
  const t = await getTranslations({ locale, namespace: "home" });
  const popularMovies = await getPopularMovies(lang).catch(() => ({ results: [] }));
  return (
    <div className="site-container relative z-10">
      <MovieGrid
        title={t("trending")}
        subtitle={copy.popularMovies.sub}
        movies={popularMovies.results?.slice(0, 12)}
        seeAllHref="/movies"
        sectionNumber="04"
        accent="amber"
      />
    </div>
  );
}

async function TopRatedSection({ locale }) {
  const lang = locale === "uz" ? "en" : locale;
  const copy = SECTION_COPY[locale] || SECTION_COPY.en;
  const t = await getTranslations({ locale, namespace: "home" });
  const topRated = await getTopRatedMovies(lang).catch(() => ({ results: [] }));
  return (
    <div className="site-container relative z-10">
      <MovieGrid
        title={t("topRated")}
        subtitle={copy.topRated.sub}
        movies={topRated.results?.slice(0, 12)}
        seeAllHref="/movies"
        sectionNumber="06"
        accent="lime"
      />
    </div>
  );
}

async function SeriesSection({ locale }) {
  const lang = locale === "uz" ? "en" : locale;
  const copy = SECTION_COPY[locale] || SECTION_COPY.en;
  const t = await getTranslations({ locale, namespace: "home" });
  const [series, topSeries] = await Promise.all([
    getPopularSeries(lang).catch(() => ({ results: [] })),
    getTopRatedSeries(lang).catch(() => ({ results: [] })),
  ]);
  const cultLabel = locale === "ru" ? "Культовые сериалы" : locale === "uz" ? "Kult seriallar" : "Cult TV Series";
  return (
    <>
      <div className="site-container relative z-10">
        <MovieGrid
          title={t("topSeries")}
          subtitle={copy.topSeries.sub}
          movies={series.results?.slice(0, 12)}
          type="tv"
          seeAllHref="/series"
          sectionNumber="07"
          accent="amber"
        />
      </div>
      {topSeries.results?.length > 0 && (
        <div className="site-container relative z-10">
          <MovieGrid
            title={cultLabel}
            subtitle={copy.topRatedSeries.sub}
            movies={topSeries.results?.slice(0, 12)}
            type="tv"
            seeAllHref="/series"
            sectionNumber="08"
            accent="crimson"
          />
        </div>
      )}
    </>
  );
}

async function UpcomingSection({ locale }) {
  const lang = locale === "uz" ? "en" : locale;
  const copy = SECTION_COPY[locale] || SECTION_COPY.en;
  const upcoming = await getUpcomingMovies(lang).catch(() => ({ results: [] }));
  if (!upcoming.results?.length) return null;
  return (
    <section className="site-container section-sm relative z-10">
      <ScrollReveal>
        <div className="flex items-baseline gap-4 mb-10">
          <span className="text-[13px] font-[family-name:var(--font-mono)] text-amber tracking-[0.18em]">09 /</span>
          <span className="w-10 h-px bg-amber" />
          <span className="text-[11px] font-[family-name:var(--font-mono)] text-text-secondary tracking-[0.22em] uppercase">On The Horizon</span>
        </div>
        <h2
          className="text-[clamp(2rem,4.5vw,4rem)] font-[family-name:var(--font-display)] text-text-primary leading-[0.95] tracking-[-0.04em] mb-12 max-w-xl"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
        >
          <span className="italic text-amber" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
            {copy.upcoming}
          </span>
        </h2>
        <TrendingCarousel movies={upcoming.results?.slice(0, 10)} />
      </ScrollReveal>
    </section>
  );
}

/* ─── Main page — streams sections independently ─── */
export default async function HomePage({ params }) {
  const { locale } = await params;
  const copy = SECTION_COPY[locale] || SECTION_COPY.en;
  const marqueeItems = MARQUEE[locale] || MARQUEE.en;

  return (
    <>
      <AmbientBackground />

      {/* 01 — HERO: loads first, above the fold */}
      <div className="-mt-[88px]">
        <Suspense fallback={
          <div className="h-[85vh] min-h-[560px] bg-gradient-to-b from-bg-secondary to-bg-primary animate-pulse" />
        }>
          <HeroSection locale={locale} />
        </Suspense>
      </div>

      {/* MARQUEE */}
      <div className="py-16 lg:py-24 border-b border-white/[0.04]">
        <MarqueeTicker items={marqueeItems} variant="lime" />
      </div>

      {/* 02 — TOP 10 */}
      <Suspense fallback={<CarouselSkeleton />}>
        <TopTenSection locale={locale} />
      </Suspense>

      {/* STATS */}
      <section className="site-container section-sm">
        <ScrollReveal>
          <StatsBar />
        </ScrollReveal>
      </section>

      {/* 03 — EDITORIAL */}
      <Suspense fallback={<div className="site-container section h-[400px] bg-white/[0.02] rounded-3xl animate-pulse" />}>
        <EditorialSection locale={locale} />
      </Suspense>

      {/* DIVIDER MARQUEE */}
      <div className="py-12 lg:py-20 border-y border-white/[0.04] overflow-hidden">
        <MarqueeTicker
          items={["★", "Watch", "★", "Discover", "★", "Feel", "★", "Repeat"]}
          variant="ghost"
          direction="right"
        />
      </div>

      {/* 04 — NEW RELEASES */}
      <Suspense fallback={<GridSkeleton />}>
        <NewReleasesSection locale={locale} />
      </Suspense>

      {/* 05 — POPULAR */}
      <Suspense fallback={<GridSkeleton />}>
        <PopularMoviesSection locale={locale} />
      </Suspense>

      {/* 06 — GENRES */}
      <section className="site-container section relative z-10">
        <ScrollReveal>
          <div className="flex items-baseline gap-4 mb-10">
            <span className="text-[13px] font-[family-name:var(--font-mono)] text-crimson tracking-[0.18em]">05 /</span>
            <span className="w-10 h-px bg-crimson" />
            <span className="text-[11px] font-[family-name:var(--font-mono)] text-text-secondary tracking-[0.22em] uppercase">By Mood</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <h2
              className="text-[clamp(2rem,4.5vw,4rem)] font-[family-name:var(--font-display)] text-text-primary leading-[0.95] tracking-[-0.04em] max-w-xl"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
            >
              {copy.genres.title}.{" "}
              <span className="italic text-crimson" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                {copy.genres.sub}
              </span>
            </h2>
          </div>
          <GenreShowcase />
        </ScrollReveal>
      </section>

      {/* 07 — TOP RATED */}
      <Suspense fallback={<GridSkeleton />}>
        <TopRatedSection locale={locale} />
      </Suspense>

      {/* 08 + 09 — SERIES */}
      <Suspense fallback={<GridSkeleton />}>
        <SeriesSection locale={locale} />
      </Suspense>

      {/* 10 — UPCOMING */}
      <Suspense fallback={<CarouselSkeleton />}>
        <UpcomingSection locale={locale} />
      </Suspense>

      {/* CTA */}
      <section className="site-container section relative z-10">
        <ScrollReveal>
          <CTABanner />
        </ScrollReveal>
      </section>
    </>
  );
}
