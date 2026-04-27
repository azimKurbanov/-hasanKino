"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";

const Comments = dynamic(() => import("@/components/Comments"), { ssr: false });

export default function MovieDetailClient({ tmdbId, type, title, poster }) {
  const searchParams = useSearchParams();
  const lobbyCode = searchParams.get("lobby") || null;

  return (
    <>
      <VideoPlayer tmdbId={tmdbId} type={type} initialLobbyCode={lobbyCode} title={title} poster={poster} />
      <Comments movieId={tmdbId} mediaType={type} />
    </>
  );
}
