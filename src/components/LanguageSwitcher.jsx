"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/lib/navigation";

const languages = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
  { code: "uz", label: "UZ" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = languages.find((l) => l.code === locale) || languages[0];

  function switchLocale(code) {
    router.replace(pathname, { locale: code });
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        className="h-9 px-3 flex items-center gap-1.5 rounded-[10px] bg-white-4 border border-border text-[13px] font-semibold text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-white-6 transition-all duration-300"
      >
        <span>{current.label}</span>
        <svg
          className={`w-3 h-3 text-text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 glass border border-border rounded-[12px] overflow-hidden shadow-elevated min-w-[100px] z-50 animate-fade-scale">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={`w-full flex items-center justify-center px-4 py-2.5 text-[13px] font-semibold transition-all duration-300 ${
                lang.code === locale
                  ? "text-accent bg-accent-soft"
                  : "text-text-secondary hover:text-text-primary hover:bg-white-4"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
