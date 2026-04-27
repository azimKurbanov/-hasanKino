"use client";

import { useEffect, useRef, useState } from "react";

function AnimatedNumber({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 2000;
        const start = performance.now();
        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function StatsBar() {
  const stats = [
    { value: 50000, suffix: "+", label: "Movies", icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" },
    { value: 12, suffix: "", label: "Servers", icon: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" },
    { value: 3, suffix: "", label: "Languages", icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" },
    { value: 0, suffix: "$0", label: "Forever Free", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden transition-all duration-500 hover:bg-white/[0.04] hover:border-white/[0.08] hover:-translate-y-1"
        >
          {/* Ambient glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-accent/[0.04] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative z-10">
            <svg className="w-5 h-5 text-accent mb-4 transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
            </svg>
            <div className="text-[28px] font-black text-text-primary tracking-[-0.04em] font-[family-name:var(--font-display)] mb-1">
              {stat.value > 0 ? <AnimatedNumber target={stat.value} suffix={stat.suffix} /> : stat.suffix}
            </div>
            <div className="text-[13px] font-medium text-text-secondary">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
