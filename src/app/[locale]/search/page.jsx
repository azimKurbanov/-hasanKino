import { getTranslations } from "next-intl/server";
import { searchMulti } from "@/lib/tmdb";
import VirtualMovieGrid from "@/components/VirtualMovieGrid";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });
  return { title: t("results") };
}

export default async function SearchPage({ params, searchParams }) {
  const { locale } = await params;
  const sp = await searchParams;
  const query = sp?.q || "";
  const lang = locale === "uz" ? "en" : locale;
  const t = await getTranslations({ locale, namespace: "search" });

  let results = [];
  if (query) {
    try {
      const data = await searchMulti(query, lang);
      results = (data.results || []).filter(
        (r) => r.media_type === "movie" || r.media_type === "tv"
      );
    } catch {}
  }

  return (
    <div className="site-container pt-10 pb-20 animate-fade-up">
      <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold text-text-primary tracking-[-0.04em] mb-2 font-[family-name:var(--font-display)]">
        {t("results")}
      </h1>
      {query && (
        <p className="text-text-muted text-[15px] mb-10">&quot;{query}&quot;</p>
      )}

      {results.length > 0 ? (
        <VirtualMovieGrid
          items={results}
          resolveType={(item) => (item.media_type === "tv" ? "tv" : "movie")}
          className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        />
      ) : query ? (
        <div className="text-center py-32">
          <p className="text-text-muted text-base">{t("noResults")}</p>
        </div>
      ) : null}
    </div>
  );
}
