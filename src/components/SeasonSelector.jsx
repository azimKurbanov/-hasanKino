"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SeasonSelector({ seasons, currentSeason, currentEpisode, onSelect }) {
  const t = useTranslations("movie");
  const [openSeason, setOpenSeason] = useState(currentSeason || 1);

  if (!seasons || seasons.length === 0) return null;

  const filtered = seasons.filter((s) => s.season_number > 0);
  const active = filtered.find((s) => s.season_number === openSeason);
  const episodeCount = active?.episodes?.length || active?.episode_count || 0;

  return (
    <div className="space-y-5">
      {/* Season tabs */}
      <div className="flex flex-wrap gap-2">
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpenSeason(s.season_number)}
            className={`h-9 px-5 rounded-[10px] text-[13px] font-semibold transition-all duration-200 ${
              openSeason === s.season_number
                ? "bg-accent text-text-inverse shadow-[0_4px_20px_rgba(185,255,102,0.2)]"
                : "bg-white-4 border border-border text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-white-6"
            }`}
          >
            {t("season")} {s.season_number}
          </button>
        ))}
      </div>

      {/* Episode grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-1.5">
        {Array.from({ length: episodeCount }, (_, i) => {
          const epNum = i + 1;
          const isActive = currentSeason === openSeason && currentEpisode === epNum;
          return (
            <button
              key={epNum}
              onClick={() => onSelect(openSeason, epNum)}
              className={`h-9 rounded-[8px] text-[13px] font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-accent text-text-inverse shadow-[0_4px_16px_rgba(185,255,102,0.2)]"
                  : "bg-white-4 border border-border text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-white-6"
              }`}
            >
              {epNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
