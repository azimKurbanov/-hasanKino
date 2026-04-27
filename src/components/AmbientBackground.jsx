"use client";

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Top-right accent orb */}
      <div className="absolute -top-[300px] -right-[200px] w-[800px] h-[800px] rounded-full bg-accent/[0.015] blur-[150px] animate-[float_20s_ease-in-out_infinite]" />
      {/* Bottom-left blue orb */}
      <div className="absolute -bottom-[400px] -left-[300px] w-[900px] h-[900px] rounded-full bg-blue-500/[0.01] blur-[180px] animate-[float_25s_ease-in-out_infinite_reverse]" />
      {/* Center subtle orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/[0.008] blur-[120px]" />
    </div>
  );
}
