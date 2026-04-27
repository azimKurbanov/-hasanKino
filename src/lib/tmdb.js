const BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const res = await fetch(url.toString(), {
    next: {
      revalidate: 3600,
      tags: [`tmdb`, `tmdb-${endpoint.replace(/\//g, "-")}`],
    },
  });
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  return res.json();
}

// ---- Movies ----

export async function getTrending(locale = "ru", page = 1) {
  return tmdbFetch("/trending/movie/week", { language: locale, page });
}

export async function getPopularMovies(locale = "ru", page = 1) {
  return tmdbFetch("/movie/popular", { language: locale, page });
}

export async function getTopRatedMovies(locale = "ru", page = 1) {
  return tmdbFetch("/movie/top_rated", { language: locale, page });
}

export async function getNowPlayingMovies(locale = "ru", page = 1) {
  return tmdbFetch("/movie/now_playing", { language: locale, page });
}

export async function getUpcomingMovies(locale = "ru", page = 1) {
  return tmdbFetch("/movie/upcoming", { language: locale, page });
}

export async function getMovieDetails(id, locale = "ru") {
  return tmdbFetch(`/movie/${id}`, {
    language: locale,
    append_to_response: "credits,similar,videos",
  });
}

export async function getMoviesByGenre(genreId, locale = "ru", page = 1) {
  return tmdbFetch("/discover/movie", {
    language: locale,
    with_genres: genreId,
    sort_by: "popularity.desc",
    page,
  });
}

// ---- TV Series ----

export async function getPopularSeries(locale = "ru", page = 1) {
  return tmdbFetch("/tv/popular", { language: locale, page });
}

export async function getTopRatedSeries(locale = "ru", page = 1) {
  return tmdbFetch("/tv/top_rated", { language: locale, page });
}

export async function getSeriesDetails(id, locale = "ru") {
  return tmdbFetch(`/tv/${id}`, {
    language: locale,
    append_to_response: "credits,similar,videos",
  });
}

export async function getSeasonDetails(tvId, seasonNumber, locale = "ru") {
  return tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`, { language: locale });
}

// ---- Search ----

export async function searchMulti(query, locale = "ru", page = 1) {
  return tmdbFetch("/search/multi", { language: locale, query, page });
}

// ---- Genres ----

export async function getMovieGenres(locale = "ru") {
  return tmdbFetch("/genre/movie/list", { language: locale });
}

export async function getTvGenres(locale = "ru") {
  return tmdbFetch("/genre/tv/list", { language: locale });
}

// ---- Helpers ----

export function getImageUrl(path, size = "w500") {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getBackdropUrl(path) {
  return getImageUrl(path, "original");
}
