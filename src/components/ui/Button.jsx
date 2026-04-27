"use client";

const VARIANTS = {
  primary:
    "bg-gradient-to-b from-accent to-[#a0e850] text-text-inverse shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_30px_rgba(185,255,102,0.16)] hover:-translate-y-[1px] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_18px_42px_rgba(185,255,102,0.28)]",
  secondary:
    "bg-white/[0.05] text-text-primary border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.14]",
  ghost:
    "bg-transparent text-text-secondary border border-white/[0.08] hover:bg-white/[0.05] hover:text-text-primary",
  accentSoft:
    "bg-accent/10 text-accent border border-accent/20 hover:bg-accent/16 hover:border-accent/30",
  danger:
    "bg-crimson/10 text-crimson border border-crimson/20 hover:bg-crimson/16 hover:border-crimson/30",
};

const SIZES = {
  sm: "h-9 px-4 rounded-xl text-[12px] font-semibold",
  md: "h-11 px-5 rounded-2xl text-[13px] font-semibold",
  lg: "h-12 px-6 rounded-full text-[13px] font-bold tracking-[0.12em] uppercase",
  icon: "h-11 w-11 rounded-[14px]",
};

export default function Button({
  as: Comp = "button",
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Comp
      className={`inline-flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}
