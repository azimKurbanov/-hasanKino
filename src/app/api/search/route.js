import { searchMulti } from "@/lib/tmdb";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const locale = searchParams.get("locale") || "ru";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await searchMulti(q, locale === "uz" ? "en" : locale);
    const filtered = (data.results || []).filter(
      (r) => r.media_type === "movie" || r.media_type === "tv"
    );
    return NextResponse.json({ results: filtered });
  } catch {
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
