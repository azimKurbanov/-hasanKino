"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import Button from "./ui/Button";

const SearchBar = dynamic(() => import("./SearchBar"), { ssr: false });
const AuthModal = dynamic(() => import("./AuthModal"), { ssr: false });
const FriendsPanel = dynamic(() => import("./FriendsPanel"), { ssr: false });

function readAuthToken() {
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [authToken, setAuthToken] = useState(null);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        return;
      }

      const payload = await response.json();
      setUser(payload.user || null);
      setAuthToken(readAuthToken());
    } catch {
      setUser(null);
    }
  }, []);

  const loadPendingRequests = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/friends", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      setPendingRequests(payload.requests?.length || 0);
    } catch {}
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSession();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadSession]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPendingRequests();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadPendingRequests]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAuthToken(null);
    setFriendsOpen(false);
    setPendingRequests(0);
  }, []);

  const navLinks = useMemo(
    () => [
      { href: "/", label: t("home") },
      { href: "/movies", label: t("movies") },
      { href: "/series", label: t("series") },
      { href: "/genres", label: t("genres") },
    ],
    [t]
  );

  const isActive = useCallback(
    (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname]
  );

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-white/[0.04] bg-[#06060a]/82 backdrop-blur-2xl backdrop-saturate-150"
            : "bg-transparent"
        }`}
      >
        <div className="site-container">
          <div className="flex h-[88px] items-center gap-6 lg:gap-10">
            <Link href="/" className="group flex shrink-0 items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-accent to-[#8de640] text-text-inverse transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_32px_rgba(185,255,102,0.35)]">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                  </svg>
                </div>
                <div className="absolute -inset-1.5 -z-10 rounded-[18px] bg-accent/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
              </div>
              <span
                className="hidden text-[24px] italic leading-none tracking-[-0.04em] text-text-primary sm:block"
                style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
              >
                KINO.
              </span>
            </Link>

            <div className="hidden h-6 w-px bg-white/[0.08] lg:block" />

            <nav className="mr-auto hidden items-center gap-12 lg:flex">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link key={link.href} href={link.href} className="group/link relative py-2">
                    <span
                      className={`text-[15px] font-semibold transition-colors duration-300 ${
                        active ? "text-text-primary" : "text-text-secondary group-hover/link:text-text-primary"
                      }`}
                    >
                      {link.label}
                    </span>
                    <span
                      className={`absolute -bottom-[30px] left-0 right-0 h-[2px] rounded-full transition-all duration-300 ${
                        active ? "bg-accent opacity-100" : "bg-accent opacity-0 group-hover/link:opacity-40"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-3 lg:gap-4">
              <Button
                variant={searchOpen ? "accentSoft" : "ghost"}
                size="icon"
                aria-label="Search"
                onClick={() => setSearchOpen((value) => !value)}
              >
                <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </Button>

              <div className="hidden h-6 w-px bg-white/[0.06] sm:block" />
              <LanguageSwitcher />

              {user && (
                <Button
                  variant={friendsOpen ? "accentSoft" : "ghost"}
                  size="icon"
                  aria-label="Friends"
                  className="relative hidden sm:inline-flex"
                  onClick={() => setFriendsOpen((value) => !value)}
                >
                  <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  {pendingRequests > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson px-1 text-[9px] font-bold text-white">
                      {pendingRequests > 9 ? "9+" : pendingRequests}
                    </span>
                  )}
                </Button>
              )}

              {user ? (
                <div className="hidden items-center gap-3 pl-1 sm:flex">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-accent to-[#8de640] text-[13px] font-bold text-text-inverse">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#07070b] bg-success" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Exit
                  </Button>
                </div>
              ) : (
                <Button variant="primary" size="lg" className="hidden sm:inline-flex" onClick={() => setShowAuth(true)}>
                  Login
                </Button>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                aria-label="Menu"
                className="flex h-11 w-11 items-center justify-center rounded-[12px] text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary lg:hidden"
              >
                <div className="flex flex-col items-center gap-[5px]">
                  <span className={`block h-[2px] w-[20px] rounded-full bg-current transition-all duration-300 ${mobileOpen ? "translate-y-[7px] rotate-45" : ""}`} />
                  <span className={`block h-[2px] w-[20px] rounded-full bg-current transition-all duration-300 ${mobileOpen ? "scale-0 opacity-0" : ""}`} />
                  <span className={`block h-[2px] w-[20px] rounded-full bg-current transition-all duration-300 ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
                </div>
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="animate-slide-down pb-5">
              <SearchBar onClose={() => setSearchOpen(false)} />
            </div>
          )}
        </div>

        {mobileOpen && (
          <div className="animate-slide-down border-t border-white/[0.04] bg-[#06060a]/95 backdrop-blur-2xl lg:hidden">
            <nav className="site-container flex flex-col gap-1 py-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-2xl px-4 py-3.5 text-[16px] font-semibold transition-colors ${
                    isActive(link.href)
                      ? "bg-accent/[0.06] text-accent"
                      : "text-text-secondary hover:bg-white/[0.03] hover:text-text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {!user && (
                <Button
                  variant="primary"
                  size="md"
                  className="mt-3"
                  onClick={() => {
                    setShowAuth(true);
                    setMobileOpen(false);
                  }}
                >
                  Login
                </Button>
              )}
            </nav>
          </div>
        )}
      </header>

      <div className="h-[88px]" />

      {friendsOpen && user && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setFriendsOpen(false)} />
          <div className="fixed right-4 top-[96px] z-50 h-[520px] w-[340px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0d0d14] shadow-elevated">
            <FriendsPanel onClose={() => setFriendsOpen(false)} onRequestsChange={setPendingRequests} token={authToken} />
          </div>
        </>
      )}

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuth={(nextUser) => {
          setUser(nextUser);
          setAuthToken(readAuthToken());
          loadPendingRequests();
        }}
      />
    </>
  );
}
