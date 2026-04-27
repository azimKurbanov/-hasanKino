"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "./ui/Button";

const AuthModal = dynamic(() => import("./AuthModal"), { ssr: false });

function formatRelative(createdAt, now) {
  const diff = now - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function Comments({ movieId, mediaType = "movie" }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?movieId=${movieId}&mediaType=${mediaType}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      setComments(payload.comments || []);
    } catch {}
    setInitialLoad(false);
  }, [mediaType, movieId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch("/api/auth/me")
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => {
          if (payload?.user) setUser(payload.user);
        })
        .catch(() => {});

      loadComments();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadComments]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const relativeTimes = useMemo(
    () => Object.fromEntries(comments.map((comment) => [comment._id, formatRelative(comment.createdAt, now)])),
    [comments, now]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    if (!user) {
      setShowAuth(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId, mediaType, text: text.trim() }),
      });

      if (response.ok) {
        setText("");
        loadComments();
      }
    } catch {}
    setLoading(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <div className="mt-16 mb-8 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 shadow-elevated">
      <div className="mb-7 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.16em] text-accent">
            Community
          </p>
          <h2 className="mt-1 text-[22px] font-[family-name:var(--font-display)] tracking-[-0.03em] text-text-primary">
            Comments{comments.length > 0 ? ` (${comments.length})` : ""}
          </h2>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-text-inverse">
              {user.username[0].toUpperCase()}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-semibold text-text-primary">{user.username}</p>
              <button type="button" onClick={handleLogout} className="text-[11px] text-text-muted transition-colors hover:text-crimson">
                Exit
              </button>
            </div>
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={() => setShowAuth(true)}>
            Login to comment
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-8 rounded-[24px] border border-white/[0.06] bg-black/20 p-4">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={user ? "Write a comment…" : "Log in to comment…"}
          maxLength={1000}
          rows={4}
          onClick={() => {
            if (!user) setShowAuth(true);
          }}
          className="min-h-[112px] w-full resize-none bg-transparent text-[15px] leading-7 text-text-primary outline-none placeholder:text-text-muted"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-text-muted">{text.length}/1000</span>
          <Button variant="primary" size="sm" type="submit" disabled={!text.trim() || loading}>
            {loading ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {initialLoad ? (
          <div className="space-y-3">
            {[1, 2, 3].map((index) => (
              <div key={index} className="rounded-[20px] border border-white/[0.05] bg-white/[0.02] p-4">
                <div className="mb-3 h-4 w-36 rounded-full animate-shimmer" />
                <div className="h-4 w-full rounded-full animate-shimmer" />
              </div>
            ))}
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="rounded-[20px] border border-white/[0.05] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.1]">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-[12px] font-bold text-accent">
                  {comment.username[0].toUpperCase()}
                </div>
                <span className="text-[13px] font-semibold text-text-primary">{comment.username}</span>
                <span className="text-[11px] text-text-muted">{relativeTimes[comment._id]}</span>
              </div>
              <p className="pl-[42px] text-[14px] leading-7 text-text-secondary">{comment.text}</p>
            </div>
          ))
        ) : (
          <p className="py-10 text-center text-[13px] text-text-muted">No comments yet.</p>
        )}
      </div>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuth={(nextUser) => setUser(nextUser)}
      />
    </div>
  );
}
