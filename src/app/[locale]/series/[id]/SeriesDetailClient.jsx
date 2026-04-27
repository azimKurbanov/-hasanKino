"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import SeasonSelector from "@/components/SeasonSelector";

const Comments = dynamic(() => import("@/components/Comments"), { ssr: false });

export default function SeriesDetailClient({ tmdbId, seasons, title, poster }) {
  const searchParams = useSearchParams();
  const lobbyCode = searchParams.get("lobby") || null;
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  function handleSelect(nextSeason, nextEpisode) {
    setSeason(nextSeason);
    setEpisode(nextEpisode);
  }

  return (
    <div className="space-y-6">
      <VideoPlayer
        tmdbId={tmdbId}
        type="tv"
        season={season}
        episode={episode}
        initialLobbyCode={lobbyCode}
        title={title}
        poster={poster}
      />
      <SeasonSelector
        seasons={seasons}
        currentSeason={season}
        currentEpisode={episode}
        onSelect={handleSelect}
      />
      <Comments movieId={tmdbId} mediaType="tv" />
    </div>
  );
}
