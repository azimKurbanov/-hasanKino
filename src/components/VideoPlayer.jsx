"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LobbyOverlay from "./LobbyOverlay";
import Button from "./ui/Button";

const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getSourceMode(source) {
  return source?.kind === "media" ? "media" : "embed";
}

export default function VideoPlayer({
  tmdbId,
  type = "movie",
  season,
  episode,
  initialLobbyCode = null,
  title,
  poster,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const controlsHideTimerRef = useRef(null);
  const pendingRemotePlaybackRef = useRef(null);
  const suppressOutboundSyncRef = useRef(false);
  const sourceFailureRef = useRef(new Set());
  const lobbyControllerRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [lobbyCode, setLobbyCode] = useState(initialLobbyCode);
  const [lobbyInput, setLobbyInput] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [lobbyLoading, setLobbyLoading] = useState(false);
  const [lobbyError, setLobbyError] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const [resolverState, setResolverState] = useState({
    loading: true,
    error: "",
    mediaSources: [],
    embedSources: [],
  });
  const [activeSourceId, setActiveSourceId] = useState(null);
  const [currentSeason, setCurrentSeason] = useState(season || 1);
  const [currentEpisode, setCurrentEpisode] = useState(episode || 1);
  const [playbackError, setPlaybackError] = useState("");
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekValue, setSeekValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.user) {
          setCurrentUser({ userId: payload.user.id, username: payload.user.username });
        }
      })
      .catch(() => {});

    setAuthToken(readCookie("auth_token"));
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function resolvePlayerSources() {
      setResolverState((prev) => ({ ...prev, loading: true, error: "" }));
      setPlaybackError("");
      sourceFailureRef.current.clear();

      try {
        const params = new URLSearchParams({
          tmdbId: String(tmdbId),
          type,
        });

        if (type === "tv") {
          params.set("season", String(currentSeason));
          params.set("episode", String(currentEpisode));
        }

        const response = await fetch(`/api/player?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to resolve player sources");
        }

        setResolverState({
          loading: false,
          error: "",
          mediaSources: payload.mediaSources || [],
          embedSources: payload.embedSources || [],
        });

        const preferredId = payload.preferredSourceId;
        setActiveSourceId((prev) => {
          const availableIds = new Set([
            ...(payload.mediaSources || []).map((item) => item.id),
            ...(payload.embedSources || []).map((item) => item.id),
          ]);

          if (prev && availableIds.has(prev)) return prev;
          if (preferredId && availableIds.has(preferredId)) return preferredId;
          return payload.mediaSources?.[0]?.id || payload.embedSources?.[0]?.id || null;
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        setResolverState({
          loading: false,
          error: error.message || "Failed to resolve sources",
          mediaSources: [],
          embedSources: [],
        });
      }
    }

    resolvePlayerSources();
    return () => controller.abort();
  }, [tmdbId, type, currentSeason, currentEpisode]);

  const sourceOptions = useMemo(
    () => [...resolverState.mediaSources, ...resolverState.embedSources],
    [resolverState.embedSources, resolverState.mediaSources]
  );

  const activeSource =
    sourceOptions.find((source) => source.id === activeSourceId) ||
    sourceOptions[0] ||
    null;

  const isHost = Boolean(lobbyCode && lobbyControllerRef.current?.isHost);
  const canControlPlayback = !lobbyCode || isHost;

  const applyRemotePlayback = useCallback(async (nextState) => {
    const video = videoRef.current;
    if (!video || getSourceMode(activeSource) !== "media") {
      pendingRemotePlaybackRef.current = nextState;
      return;
    }

    suppressOutboundSyncRef.current = true;
    try {
      const nextPosition = clamp(nextState.position || 0, 0, Number.isFinite(video.duration) ? video.duration : nextState.position || 0);
      if (Math.abs(video.currentTime - nextPosition) > 1) {
        video.currentTime = nextPosition;
      }

      setCurrentTime(nextPosition);
      setSeekValue(nextPosition);

      if (nextState.isPlaying) {
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      setPlaybackError("The selected source could not be controlled. Try another source.");
    } finally {
      window.setTimeout(() => {
        suppressOutboundSyncRef.current = false;
      }, 0);
    }
  }, [activeSource]);

  useEffect(() => {
    if (!activeSource || getSourceMode(activeSource) !== "media") return;
    if (!pendingRemotePlaybackRef.current) return;

    applyRemotePlayback(pendingRemotePlaybackRef.current);
    pendingRemotePlaybackRef.current = null;
  }, [activeSource, applyRemotePlayback]);

  const handleSyncEvent = useCallback(
    async (event) => {
      if (!event) return;

      if (event.fromUserId && event.fromUserId === currentUser?.userId) {
        return;
      }

      if (event.source !== undefined || event.position !== undefined || event.isPlaying !== undefined) {
        if (event.source) setActiveSourceId(event.source);
        if (event.season != null) setCurrentSeason(event.season);
        if (event.episode != null) setCurrentEpisode(event.episode);

        await applyRemotePlayback({
          position: event.position || 0,
          isPlaying: Boolean(event.isPlaying),
        });
        return;
      }

      const { action, data, serverTimestamp } = event;
      switch (action) {
        case "source":
          if (data?.source) setActiveSourceId(data.source);
          if (data?.season != null) setCurrentSeason(data.season);
          if (data?.episode != null) setCurrentEpisode(data.episode);
          setPlaybackError("");
          break;
        case "play": {
          const driftCompensation = serverTimestamp ? Math.max((Date.now() - serverTimestamp) / 1000, 0) : 0;
          await applyRemotePlayback({
            position: (data?.position || 0) + driftCompensation,
            isPlaying: true,
          });
          break;
        }
        case "pause":
          await applyRemotePlayback({
            position: data?.position || currentTime,
            isPlaying: false,
          });
          break;
        case "seek":
          await applyRemotePlayback({
            position: data?.position || 0,
            isPlaying,
          });
          break;
        default:
          break;
      }
    },
    [applyRemotePlayback, currentTime, currentUser?.userId, isPlaying]
  );

  const emitLobbySync = useCallback((action, data = {}) => {
    if (!lobbyCode || !lobbyControllerRef.current?.isHost) return;
    lobbyControllerRef.current.emitSync(action, data);
  }, [lobbyCode]);

  const selectSource = useCallback((sourceId) => {
    setActiveSourceId(sourceId);
    setPlaybackError("");

    if (type === "tv") {
      emitLobbySync("source", {
        source: sourceId,
        season: currentSeason,
        episode: currentEpisode,
      });
      return;
    }

    emitLobbySync("source", { source: sourceId });
  }, [currentEpisode, currentSeason, emitLobbySync, type]);

  const updateControlsVisibility = useCallback((visible) => {
    setControlsVisible(visible);

    if (controlsHideTimerRef.current) {
      clearTimeout(controlsHideTimerRef.current);
    }

    if (visible && isPlaying) {
      controlsHideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 2200);
    }
  }, [isPlaying]);

  useEffect(() => () => {
    if (controlsHideTimerRef.current) {
      clearTimeout(controlsHideTimerRef.current);
    }
  }, []);

  const handleMediaError = useCallback(() => {
    if (getSourceMode(activeSource) !== "media") {
      setPlaybackError("This embedded source is unavailable right now. Try another provider.");
      return;
    }

    sourceFailureRef.current.add(activeSource.id);

    const nextSource = resolverState.mediaSources.find(
      (source) => source.id !== activeSource.id && !sourceFailureRef.current.has(source.id)
    );

    if (nextSource) {
      setActiveSourceId(nextSource.id);
      setPlaybackError("");
      return;
    }

    setPlaybackError("No valid direct video source could be played. Try an embedded fallback provider below.");
  }, [activeSource, resolverState.mediaSources]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration || 0);
    setCurrentTime(video.currentTime || 0);
    setSeekValue(video.currentTime || 0);

    if (pendingRemotePlaybackRef.current) {
      applyRemotePlayback(pendingRemotePlaybackRef.current);
      pendingRemotePlaybackRef.current = null;
    }
  }, [applyRemotePlayback]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || isSeeking) return;
    setCurrentTime(videoRef.current.currentTime || 0);
    setSeekValue(videoRef.current.currentTime || 0);
  }, [isSeeking]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    updateControlsVisibility(true);

    if (suppressOutboundSyncRef.current || !canControlPlayback) return;
    emitLobbySync("play", { position: videoRef.current?.currentTime || 0 });
  }, [canControlPlayback, emitLobbySync, updateControlsVisibility]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setControlsVisible(true);

    if (suppressOutboundSyncRef.current || !canControlPlayback) return;
    emitLobbySync("pause", { position: videoRef.current?.currentTime || 0 });
  }, [canControlPlayback, emitLobbySync]);

  const togglePlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !canControlPlayback || getSourceMode(activeSource) !== "media") return;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      setPlaybackError("This video source could not be started. Try another source.");
    }
  }, [activeSource, canControlPlayback]);

  const commitSeek = useCallback((rawValue) => {
    const video = videoRef.current;
    if (!video || !canControlPlayback) return;

    const nextTime = clamp(rawValue, 0, duration || rawValue);
    suppressOutboundSyncRef.current = true;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    setSeekValue(nextTime);
    setIsSeeking(false);

    window.setTimeout(() => {
      suppressOutboundSyncRef.current = false;
    }, 0);

    emitLobbySync("seek", { position: nextTime });
  }, [canControlPlayback, duration, emitLobbySync]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
  }, []);

  const handleVolumeChange = useCallback((nextVolume) => {
    const video = videoRef.current;
    if (!video) return;

    const normalized = clamp(Number(nextVolume), 0, 1);
    video.volume = normalized;
    video.muted = normalized === 0;
    setVolume(normalized);
    setMuted(normalized === 0);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await containerRef.current.requestFullscreen();
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => updateControlsVisibility(true);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [updateControlsVisibility]);

  async function createLobby() {
    if (!currentUser || !authToken) {
      setLobbyError("Log in to start a watch party.");
      return;
    }

    setLobbyLoading(true);
    setLobbyError("");

    try {
      const response = await fetch(`${API_URL}/api/lobby`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          movieId: tmdbId,
          movieType: type,
          movieTitle: title || `Title ${tmdbId}`,
          moviePoster: poster || null,
          isPrivate,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to create lobby");
      }

      setLobbyCode(payload.code);
      setShowCreate(false);
      setLobbyError("");
    } catch (error) {
      setLobbyError(error.message || "Failed to create lobby");
    } finally {
      setLobbyLoading(false);
    }
  }

  function joinLobby() {
    const code = lobbyInput.trim().toUpperCase();
    if (code.length !== 6) {
      setLobbyError("Enter a valid 6-character room code.");
      return;
    }

    if (!currentUser) {
      setLobbyError("Log in to join a room.");
      return;
    }

    setLobbyCode(code);
    setShowJoin(false);
    setLobbyError("");
    setLobbyInput("");
  }

  function copyInviteLink() {
    if (!lobbyCode) return;

    const url = new URL(window.location.href);
    url.searchParams.set("lobby", lobbyCode);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }).catch(() => {});
  }

  const getPlaybackState = useCallback(() => ({
    currentTime: videoRef.current?.currentTime || currentTime,
    isPlaying: !videoRef.current?.paused,
    sourceId: activeSource?.id || null,
  }), [activeSource?.id, currentTime]);

  const mediaSource = getSourceMode(activeSource) === "media" ? activeSource : null;
  const embedSource = getSourceMode(activeSource) === "embed" ? activeSource : null;

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,17,26,0.96),rgba(7,7,11,0.96))] shadow-elevated">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.18em] text-accent">
              Player
            </p>
            <h3 className="mt-1 text-[20px] font-[family-name:var(--font-display)] tracking-[-0.03em] text-text-primary">
              {title || "Now Playing"}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sourceOptions.map((source) => {
              const active = source.id === activeSource?.id;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => selectSource(source.id)}
                  disabled={Boolean(lobbyCode && !isHost)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-semibold transition-all duration-300 ${
                    active
                      ? "border-accent/30 bg-accent/14 text-accent shadow-[0_12px_30px_rgba(185,255,102,0.12)]"
                      : "border-white/[0.08] bg-white/[0.03] text-text-secondary hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-text-primary"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${source.kind === "media" ? "bg-accent" : "bg-amber"}`} />
                  {source.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`flex gap-5 p-5 ${lobbyCode ? "flex-col xl:flex-row" : "flex-col"}`}>
          <div className="min-w-0 flex-1 space-y-4">
            <div
              ref={containerRef}
              className="group relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-black"
              onMouseMove={() => updateControlsVisibility(true)}
              onMouseLeave={() => updateControlsVisibility(false)}
            >
              <div className="aspect-video">
                {resolverState.loading ? (
                  <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(185,255,102,0.1),transparent_40%),linear-gradient(180deg,#0d0d14,#050507)]">
                    <div className="flex flex-col items-center gap-4 text-text-secondary">
                      <div className="h-10 w-10 rounded-full border-2 border-accent/40 border-t-accent animate-spin" />
                      <p className="text-[13px]">Resolving the best video source…</p>
                    </div>
                  </div>
                ) : mediaSource ? (
                  <>
                    <video
                      key={`${mediaSource.id}-${currentSeason}-${currentEpisode}`}
                      ref={videoRef}
                      className="h-full w-full bg-black object-contain"
                      src={mediaSource.url}
                      poster={poster || undefined}
                      playsInline
                      preload="metadata"
                      crossOrigin="anonymous"
                      onLoadedMetadata={handleLoadedMetadata}
                      onTimeUpdate={handleTimeUpdate}
                      onDurationChange={() => setDuration(videoRef.current?.duration || 0)}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onWaiting={() => setIsBuffering(true)}
                      onPlaying={() => setIsBuffering(false)}
                      onCanPlay={() => setIsBuffering(false)}
                      onError={handleMediaError}
                      onClick={togglePlayback}
                    />

                    <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

                    {isBuffering && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="h-14 w-14 rounded-full border-2 border-white/20 border-t-accent animate-spin" />
                      </div>
                    )}

                    {playbackError && (
                      <div className="absolute left-4 right-4 top-4 rounded-2xl border border-crimson/20 bg-crimson/12 px-4 py-3 text-[13px] text-red-100 backdrop-blur-xl">
                        {playbackError}
                      </div>
                    )}

                    <div
                      className={`absolute inset-0 flex items-end transition-opacity duration-300 ${
                        controlsVisible ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <div className="w-full px-4 pb-4 pt-12">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[12px] text-white/70">{mediaSource.label}</p>
                            <p className="text-[15px] font-semibold text-white">{title || "Stream"}</p>
                          </div>
                          {lobbyCode && (
                            <div className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                              {isHost ? "Host controls" : "Synced viewer"}
                            </div>
                          )}
                        </div>

                        <input
                          type="range"
                          min={0}
                          max={duration || 0}
                          step={0.1}
                          value={isSeeking ? seekValue : currentTime}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            setIsSeeking(true);
                            setSeekValue(nextValue);
                          }}
                          onMouseUp={(event) => commitSeek(Number(event.currentTarget.value))}
                          onTouchEnd={(event) => commitSeek(Number(event.currentTarget.value))}
                          disabled={!canControlPlayback}
                          className="mb-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-accent disabled:cursor-not-allowed"
                        />

                        <div className="flex flex-wrap items-center gap-3 text-white">
                          <button
                            type="button"
                            onClick={togglePlayback}
                            disabled={!canControlPlayback}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/14 backdrop-blur-xl transition hover:bg-white/20 disabled:opacity-40"
                          >
                            {isPlaying ? (
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                              </svg>
                            ) : (
                              <svg className="ml-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={toggleMute}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/16"
                          >
                            {muted || volume === 0 ? (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16.5 12a4.5 4.5 0 00-1.54-3.39l1.42-1.42A6.46 6.46 0 0118.5 12c0 1.77-.71 3.37-1.86 4.53l-1.42-1.42A4.48 4.48 0 0016.5 12zM5 9v6h4l5 5V4L9 9H5zm13.71 12.29L4.71 7.29l1.41-1.41 14 14z" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14 4L9 9H5v6h4l5 5V4zm2.5 8a4.5 4.5 0 00-2.12-3.81v7.62A4.5 4.5 0 0016.5 12zm0-8.5v2.06a8 8 0 010 12.88v2.06a10 10 0 000-17z" />
                              </svg>
                            )}
                          </button>

                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={muted ? 0 : volume}
                            onChange={(event) => handleVolumeChange(event.target.value)}
                            className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-white/20 accent-accent"
                          />

                          <span className="ml-auto text-[12px] text-white/70">
                            {formatTime(isSeeking ? seekValue : currentTime)} / {formatTime(duration)}
                          </span>

                          <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/16"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : embedSource ? (
                  <div className="flex h-full flex-col">
                    <iframe
                      key={`${embedSource.id}-${currentSeason}-${currentEpisode}`}
                      src={embedSource.url}
                      className="h-full w-full"
                      frameBorder="0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="origin"
                    />
                    <div className="border-t border-white/[0.06] bg-[#08080d] px-4 py-3 text-[13px] text-text-secondary">
                      Direct HTML5 playback is unavailable for this title right now. The app is using an embedded fallback provider instead.
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-[linear-gradient(180deg,#0d0d14,#050507)] p-6 text-center">
                    <div className="max-w-md space-y-3">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                        <svg className="h-7 w-7 text-accent" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <h4 className="text-[20px] font-semibold text-text-primary">No playable source found</h4>
                      <p className="text-[14px] text-text-secondary">
                        Configure a direct stream provider through `STREAM_API_URL` or add fallback media URLs so the HTML5 player can receive a valid video file or HLS manifest.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1.3fr_1fr]">
              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.16em] text-text-muted">
                  Status
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[12px] font-semibold text-accent">
                    {mediaSource ? "Direct HTML5 playback" : embedSource ? "Embedded fallback" : "Unavailable"}
                  </span>
                  {resolverState.error && (
                    <span className="rounded-full border border-crimson/20 bg-crimson/10 px-3 py-1 text-[12px] font-semibold text-crimson">
                      Resolver warning
                    </span>
                  )}
                  {lobbyCode && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12px] font-semibold text-text-primary">
                      Room {lobbyCode}
                    </span>
                  )}
                </div>
                {(resolverState.error || playbackError) && (
                  <p className="mt-3 text-[13px] leading-6 text-text-secondary">
                    {playbackError || resolverState.error}
                  </p>
                )}
              </div>

              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.16em] text-text-muted">
                  Watch Party
                </p>

                {!lobbyCode ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="accentSoft"
                      size="sm"
                      onClick={() => {
                        setShowCreate(true);
                        setShowJoin(false);
                        setLobbyError("");
                      }}
                    >
                      Create room
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowJoin(true);
                        setShowCreate(false);
                        setLobbyError("");
                      }}
                    >
                      Join by code
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={copyInviteLink}>
                      {copied ? "Copied" : "Copy invite"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setLobbyCode(null)}>
                      Leave room
                    </Button>
                  </div>
                )}

                {showCreate && !lobbyCode && (
                  <div className="mt-4 space-y-3 rounded-[18px] border border-white/[0.06] bg-black/20 p-4">
                    <label className="flex items-center gap-3 text-[13px] text-text-secondary">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(event) => setIsPrivate(event.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-transparent accent-accent"
                      />
                      Private room
                    </label>
                    {lobbyError && <p className="text-[12px] text-crimson">{lobbyError}</p>}
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={createLobby} disabled={lobbyLoading}>
                        {lobbyLoading ? "Creating…" : "Start"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {showJoin && !lobbyCode && (
                  <div className="mt-4 space-y-3 rounded-[18px] border border-white/[0.06] bg-black/20 p-4">
                    <input
                      value={lobbyInput}
                      onChange={(event) => setLobbyInput(event.target.value.toUpperCase())}
                      onKeyDown={(event) => event.key === "Enter" && joinLobby()}
                      maxLength={6}
                      placeholder="AB12CD"
                      className="input-dark !h-11 !rounded-2xl !px-4 !font-[family-name:var(--font-mono)] !tracking-[0.18em] uppercase"
                    />
                    {lobbyError && <p className="text-[12px] text-crimson">{lobbyError}</p>}
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={joinLobby}>
                        Join
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowJoin(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {lobbyCode && (
            <div className="w-full shrink-0 xl:w-[360px]">
              <div className="h-[620px] overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#0b0b12] shadow-elevated">
                <LobbyOverlay
                  lobbyCode={lobbyCode}
                  currentUser={currentUser}
                  token={authToken}
                  onSyncChange={handleSyncEvent}
                  onClose={() => setLobbyCode(null)}
                  onControllerReady={(controller) => {
                    lobbyControllerRef.current = controller;
                  }}
                  getPlaybackState={getPlaybackState}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
