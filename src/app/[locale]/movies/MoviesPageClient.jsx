"use client";

import { startTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import GenreFilter from "@/components/GenreFilter";
import VirtualMovieGrid from "@/components/VirtualMovieGrid";

export default function MoviesPageClient({
  initialMovies,
  genres,
  totalPages,
  currentPage,
  activeGenre,
}) {
  const t = useTranslations("nav");
  const ts = useTranslations("search");
  const router = useRouter();

  function navigate(nextUrl) {
    startTransition(() => {
      router.push(nextUrl);
    });
  }

  function handleGenre(genreId) {
    const params = new URLSearchParams();
    if (genreId) params.set("genre", genreId);
    navigate(`/movies${params.toString() ? `?${params}` : ""}`);
  }

  function handlePage(page) {
    const params = new URLSearchParams();
    if (activeGenre) params.set("genre", activeGenre);
    params.set("page", page);
    navigate(`/movies?${params}`);
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.16em] text-accent">
            Library
          </p>
          <h1 className="mt-1 text-[clamp(1.8rem,4vw,2.6rem)] font-[family-name:var(--font-display)] tracking-[-0.04em] text-text-primary">
            {t("movies")}
          </h1>
        </div>
      </div>

      <div className="mb-8">
        <GenreFilter
          genres={genres}
          activeGenre={activeGenre ? parseInt(activeGenre, 10) : null}
          onSelect={handleGenre}
        />
      </div>

      {initialMovies.length > 0 ? (
        <VirtualMovieGrid
          items={initialMovies}
          type="movie"
          className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        />
      ) : (
        <div className="py-24 text-center">
          <p className="text-[15px] text-text-secondary">{ts("noResults")}</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12 mb-4 flex items-center justify-center gap-1.5">
          {currentPage > 1 && (
            <button
              type="button"
              onClick={() => handlePage(currentPage - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-text-secondary transition-colors hover:bg-white/[0.08] hover:text-text-primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {Array.from({ length: Math.min(7, totalPages) }, (_, index) => {
            let page;
            if (totalPages <= 7) page = index + 1;
            else if (currentPage <= 4) page = index + 1;
            else if (currentPage >= totalPages - 3) page = totalPages - 6 + index;
            else page = currentPage - 3 + index;

            return (
              <button
                key={page}
                type="button"
                onClick={() => handlePage(page)}
                className={`h-10 w-10 rounded-xl text-[13px] font-medium transition-colors ${
                  currentPage === page
                    ? "bg-accent text-text-inverse"
                    : "border border-white/[0.08] bg-white/[0.03] text-text-secondary hover:bg-white/[0.08] hover:text-text-primary"
                }`}
              >
                {page}
              </button>
            );
          })}

          {currentPage < totalPages && (
            <button
              type="button"
              onClick={() => handlePage(currentPage + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-text-secondary transition-colors hover:bg-white/[0.08] hover:text-text-primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
