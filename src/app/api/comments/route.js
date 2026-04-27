import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Comment, getTokenFromRequest } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get("movieId");
  const mediaType = searchParams.get("mediaType") || "movie";

  if (!movieId) {
    return NextResponse.json({ comments: [] });
  }

  try {
    await connectDB();
    const comments = await Comment.find({ movieId: Number(movieId), mediaType })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ comments: [] }, { status: 500 });
  }
}

export async function POST(request) {
  const user = getTokenFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { movieId, mediaType, text } = await request.json();

    if (!movieId || !text?.trim()) {
      return NextResponse.json({ error: "movieId and text required" }, { status: 400 });
    }

    if (text.length > 1000) {
      return NextResponse.json({ error: "Comment too long" }, { status: 400 });
    }

    const comment = await Comment.create({
      movieId: Number(movieId),
      mediaType: mediaType || "movie",
      userId: user.userId,
      username: user.username,
      text: text.trim(),
    });

    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
