import { getTranslations } from "next-intl/server";
import { getPopularMovies, getMovieGenres, getMoviesByGenre } from "@/lib/tmdb";
import MoviesPageClient from "./MoviesPageClient";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("movies") };
}

export default async function MoviesPage({ params, searchParams }) {
  const { locale } = await params;
  const sp = await searchParams;
  const lang = locale === "uz" ? "en" : locale;
  const page = parseInt(sp?.page) || 1;
  const genreId = sp?.genre || null;

  const [genres, movies] = await Promise.all([
    getMovieGenres(lang).catch(() => ({ genres: [] })),
    genreId
      ? getMoviesByGenre(genreId, lang, page).catch(() => ({ results: [], total_pages: 1 }))
      : getPopularMovies(lang, page).catch(() => ({ results: [], total_pages: 1 })),
  ]);

  return (
    <div className="site-container pt-10 pb-20">
      <MoviesPageClient
        initialMovies={movies.results || []}
        genres={genres.genres || []}
        totalPages={movies.total_pages || 1}
        currentPage={page}
        activeGenre={genreId}
      />
    </div>
  );
}
