/**
 * MarqueeTicker — infinite horizontal running text.
 * Pure CSS animation, no JS. Used as editorial divider between sections.
 *
 * items: string[]  — words/phrases to loop
 * variant: "lime" | "ghost" — color treatment
 * direction: "left" | "right"
 */
export default function MarqueeTicker({
  items = [],
  variant = "lime",
  direction = "left",
}) {
  if (items.length === 0) return null;

  // Duplicate once so the loop seams correctly
  const loop = [...items, ...items];
  const animClass =
    direction === "right" ? "animate-marquee-slow" : "animate-marquee";

  const textColor =
    variant === "lime"
      ? "text-accent"
      : "text-text-primary/10";

  return (
    <div
      className="relative w-full overflow-hidden marquee-mask select-none"
      aria-hidden="true"
    >
      <div
        className={`flex gap-12 whitespace-nowrap ${animClass}`}
        style={{ width: "max-content" }}
      >
        {loop.map((item, i) => (
          <span
            key={i}
            className={`flex items-center gap-12 text-[clamp(3rem,9vw,9rem)] font-[family-name:var(--font-display)] font-medium leading-none tracking-[-0.04em] ${textColor}`}
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
          >
            <span className="italic">{item}</span>
            <span className="text-accent/40 text-[0.5em] not-italic">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
