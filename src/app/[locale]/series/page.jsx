import { getTranslations } from "next-intl/server";
import { getPopularSeries, getTopRatedSeries } from "@/lib/tmdb";
import VirtualMovieGrid from "@/components/VirtualMovieGrid";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("series") };
}

export default async function SeriesPage({ params }) {
  const { locale } = await params;
  const lang = locale === "uz" ? "en" : locale;
  const t = await getTranslations({ locale, namespace: "home" });

  const [popular, topRated] = await Promise.all([
    getPopularSeries(lang).catch(() => ({ results: [] })),
    getTopRatedSeries(lang).catch(() => ({ results: [] })),
  ]);

  const all = [...(popular.results || []), ...(topRated.results || [])];
  const unique = all.filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);

  return (
    <div className="site-container pt-10 pb-20 animate-fade-up">
      <p className="text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.16em] text-accent">
        Series
      </p>
      <h1 className="mb-10 mt-1 text-[clamp(1.8rem,4vw,2.5rem)] font-[family-name:var(--font-display)] tracking-[-0.04em] text-text-primary">
        {t("topSeries")}
      </h1>
      <VirtualMovieGrid
        items={unique}
        type="tv"
        className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      />
    </div>
  );
}
