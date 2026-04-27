import { getTranslations } from "next-intl/server";
import { getMovieGenres, getTvGenres } from "@/lib/tmdb";
import { Link } from "@/lib/navigation";

const GENRE_VISUALS = {
  28:    { icon: "💥", from: "#ef4444", to: "#f97316" },
  12:    { icon: "🧭", from: "#f59e0b", to: "#eab308" },
  16:    { icon: "✨", from: "#8b5cf6", to: "#ec4899" },
  35:    { icon: "😂", from: "#eab308", to: "#f59e0b" },
  80:    { icon: "🔪", from: "#64748b", to: "#475569" },
  99:    { icon: "📹", from: "#0ea5e9", to: "#3b82f6" },
  18:    { icon: "🎭", from: "#6366f1", to: "#8b5cf6" },
  10751: { icon: "👨‍👩‍👧", from: "#22c55e", to: "#10b981" },
  14:    { icon: "🧙", from: "#a855f7", to: "#d946ef" },
  36:    { icon: "⚔️", from: "#d97706", to: "#ea580c" },
  27:    { icon: "👻", from: "#dc2626", to: "#e11d48" },
  10402: { icon: "🎵", from: "#ec4899", to: "#f43f5e" },
  9648:  { icon: "🕵️", from: "#475569", to: "#334155" },
  10749: { icon: "💕", from: "#f472b6", to: "#fb7185" },
  878:   { icon: "🚀", from: "#06b6d4", to: "#3b82f6" },
  10770: { icon: "📺", from: "#14b8a6", to: "#10b981" },
  53:    { icon: "😰", from: "#71717a", to: "#52525b" },
  10752: { icon: "🪖", from: "#16a34a", to: "#65a30d" },
  37:    { icon: "🤠", from: "#f97316", to: "#f59e0b" },
  10759: { icon: "⚡", from: "#f97316", to: "#ef4444" },
  10762: { icon: "🧸", from: "#f472b6", to: "#fb7185" },
  10763: { icon: "📰", from: "#3b82f6", to: "#0ea5e9" },
  10764: { icon: "🎤", from: "#eab308", to: "#f59e0b" },
  10765: { icon: "👽", from: "#a855f7", to: "#6366f1" },
  10766: { icon: "💔", from: "#e11d48", to: "#ec4899" },
  10767: { icon: "🗣️", from: "#14b8a6", to: "#06b6d4" },
  10768: { icon: "🎖️", from: "#16a34a", to: "#059669" },
};

const DEFAULT_VISUAL = { icon: "🎬", from: "#6366f1", to: "#8b5cf6" };

function getVisual(id) {
  return GENRE_VISUALS[id] || DEFAULT_VISUAL;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("genres") };
}

export default async function GenresPage({ params }) {
  const { locale } = await params;
  const lang = locale === "uz" ? "en" : locale;
  const t = await getTranslations({ locale, namespace: "nav" });

  const [movieGenres, tvGenres] = await Promise.all([
    getMovieGenres(lang).catch(() => ({ genres: [] })),
    getTvGenres(lang).catch(() => ({ genres: [] })),
  ]);

  return (
    <div className="site-container pt-10 pb-20 animate-fade-up">
      <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold text-text-primary tracking-[-0.04em] mb-3 font-[family-name:var(--font-display)]">
        {t("genres")}
      </h1>
      <p className="text-text-secondary text-[15px] mb-14 max-w-md">
        {locale === "ru" ? "Исследуйте фильмы и сериалы по жанрам" : locale === "uz" ? "Janrlar bo'yicha filmlar va seriallarni kashf eting" : "Explore movies and series by genre"}
      </p>

      {/* ═══ MOVIE GENRES ═══ */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-8 h-8 rounded-[10px] bg-accent/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-text-primary tracking-[-0.02em] font-[family-name:var(--font-display)]">
            {t("movies")}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {movieGenres.genres?.map((genre) => {
            const v = getVisual(genre.id);
            return (
              <Link
                key={genre.id}
                href={`/movies?genre=${genre.id}`}
                className="group relative flex flex-col items-center justify-center py-7 px-4 rounded-[18px] bg-bg-card border border-border overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-elevated hover:border-border-hover"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: `radial-gradient(circle at 50% 40%, ${v.from}15 0%, transparent 70%)` }}
                />
                <div
                  className="absolute -inset-px rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, ${v.from}25, transparent 50%, ${v.to}25)` }}
                />
                <div className="relative z-10 flex flex-col items-center gap-2.5">
                  <div className="relative">
                    <span className="text-[28px] block transition-transform duration-500 group-hover:scale-125 group-hover:-translate-y-0.5">
                      {v.icon}
                    </span>
                    <div
                      className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-700 -z-10 scale-[3]"
                      style={{ background: v.from }}
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors duration-300 text-center leading-tight">
                    {genre.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══ TV GENRES ═══ */}
      <section>
        <div className="flex items-center gap-3 mb-7">
          <div className="w-8 h-8 rounded-[10px] bg-accent/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-text-primary tracking-[-0.02em] font-[family-name:var(--font-display)]">
            {t("series")}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {tvGenres.genres?.map((genre) => {
            const v = getVisual(genre.id);
            return (
              <Link
                key={genre.id}
                href={`/series?genre=${genre.id}`}
                className="group relative flex flex-col items-center justify-center py-7 px-4 rounded-[18px] bg-bg-card border border-border overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-elevated hover:border-border-hover"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: `radial-gradient(circle at 50% 40%, ${v.from}15 0%, transparent 70%)` }}
                />
                <div
                  className="absolute -inset-px rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, ${v.from}25, transparent 50%, ${v.to}25)` }}
                />
                <div className="relative z-10 flex flex-col items-center gap-2.5">
                  <div className="relative">
                    <span className="text-[28px] block transition-transform duration-500 group-hover:scale-125 group-hover:-translate-y-0.5">
                      {v.icon}
                    </span>
                    <div
                      className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-700 -z-10 scale-[3]"
                      style={{ background: v.from }}
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors duration-300 text-center leading-tight">
                    {genre.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
