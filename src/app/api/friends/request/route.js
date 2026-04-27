import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Friendship, User, getTokenFromRequest } from "@/lib/auth";

/* POST /api/friends/request — отправить запрос по username */
export async function POST(request) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await request.json();
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  await connectDB();

  const recipient = await User.findOne({ username: username.trim() });
  if (!recipient) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const requesterId = new mongoose.Types.ObjectId(user.userId);
  if (recipient._id.equals(requesterId)) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  }

  const existing = await Friendship.findOne({
    $or: [
      { requester: requesterId, recipient: recipient._id },
      { requester: recipient._id, recipient: requesterId },
    ],
  });

  if (existing) {
    if (existing.status === "accepted") return NextResponse.json({ error: "Already friends" }, { status: 409 });
    if (existing.status === "pending")  return NextResponse.json({ error: "Request already sent" }, { status: 409 });
    // rejected → resend
    existing.status = "pending";
    existing.requester = requesterId;
    existing.recipient = recipient._id;
    await existing.save();
    return NextResponse.json({ message: "Request re-sent" });
  }

  const friendship = await Friendship.create({ requester: requesterId, recipient: recipient._id });
  return NextResponse.json({ message: "Request sent", requestId: friendship._id }, { status: 201 });
}
