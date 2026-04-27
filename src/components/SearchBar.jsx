"use client";

import Image from "next/image";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { getImageUrl } from "@/lib/tmdb";

export default function SearchBar({ onClose }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const abortRef = useRef(null);
  const cacheRef = useRef(new Map());

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    abortRef.current?.abort();

    if (deferredQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const cacheKey = `${locale}:${deferredQuery.toLowerCase()}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(deferredQuery)}&locale=${locale}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        const nextResults = payload.results?.slice(0, 6) || [];
        cacheRef.current.set(cacheKey, nextResults);
        startTransition(() => {
          setResults(nextResults);
        });
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      clearTimeout(timeoutRef.current);
      controller.abort();
    };
  }, [deferredQuery, locale]);

  function handleSelect(item) {
    const type = item.media_type === "tv" ? "series" : "movies";
    router.push(`/${type}/${item.id}`);
    onClose?.();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    onClose?.();
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <svg className="absolute left-5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("placeholder")}
            className="input-dark !h-[56px] !rounded-[18px] !pl-12 !pr-12"
          />
          {loading && (
            <div className="absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          )}
        </div>
      </form>

      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-3 max-h-[420px] overflow-y-auto rounded-[24px] border border-white/[0.08] bg-[#090911]/96 p-2 shadow-elevated backdrop-blur-2xl animate-fade-scale">
          {results.map((item) => (
            <button
              key={`${item.media_type}-${item.id}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="flex w-full items-center gap-4 rounded-[18px] px-3 py-3 text-left transition-colors duration-300 hover:bg-white/[0.05]"
            >
              <div className="h-[66px] w-12 shrink-0 overflow-hidden rounded-[12px] border border-white/[0.06] bg-bg-card">
                {item.poster_path ? (
                  <Image
                    src={getImageUrl(item.poster_path, "w92")}
                    alt=""
                    width={48}
                    height={66}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/[0.1]">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-text-primary">{item.title || item.name}</p>
                <p className="mt-1 text-[12px] text-text-muted">
                  {item.media_type === "tv" ? "TV Series" : "Movie"} · {(item.release_date || item.first_air_date || "").slice(0, 4)}
                  {item.vote_average > 0 && <span className="ml-1.5 font-semibold text-accent">★ {item.vote_average.toFixed(1)}</span>}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
