import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Friendship, getTokenFromRequest } from "@/lib/auth";

/* POST /api/friends/:id?action=accept|reject */
export async function POST(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (!["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be accept or reject" }, { status: 400 });
  }

  await connectDB();
  const userId = new mongoose.Types.ObjectId(user.userId);

  const f = await Friendship.findOne({ _id: id, recipient: userId, status: "pending" });
  if (!f) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  f.status = action === "accept" ? "accepted" : "rejected";
  await f.save();

  return NextResponse.json({ message: action === "accept" ? "Friend added" : "Request rejected" });
}

/* DELETE /api/friends/:id — удалить друга */
export async function DELETE(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const userId = new mongoose.Types.ObjectId(user.userId);
  const friendId = new mongoose.Types.ObjectId(id);

  await Friendship.deleteOne({
    $or: [
      { requester: userId, recipient: friendId },
      { requester: friendId, recipient: userId },
    ],
    status: "accepted",
  });

  return NextResponse.json({ message: "Friend removed" });
}
