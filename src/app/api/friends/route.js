import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Friendship, getTokenFromRequest } from "@/lib/auth";

/* GET /api/friends — список друзей + входящие запросы */
export async function GET(request) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = new mongoose.Types.ObjectId(user.userId);

  const [friendships, incoming] = await Promise.all([
    Friendship.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: "accepted",
    }).populate("requester recipient", "username avatar"),

    Friendship.find({ recipient: userId, status: "pending" })
      .populate("requester", "username avatar"),
  ]);

  const friends = friendships.map((f) => {
    const other = f.requester._id.equals(userId) ? f.recipient : f.requester;
    return {
      id: other._id,
      username: other.username,
      avatar: other.avatar,
      friendshipId: f._id,
    };
  });

  const requests = incoming.map((f) => ({
    requestId: f._id,
    from: { id: f.requester._id, username: f.requester.username, avatar: f.requester.avatar },
    createdAt: f.createdAt,
  }));

  return NextResponse.json({ friends, requests });
}
