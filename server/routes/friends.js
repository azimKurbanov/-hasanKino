import { Router } from "express";
import mongoose from "mongoose";
import { User, Friendship } from "../models/index.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

/* GET /api/friends — список друзей + входящие запросы */
router.get("/", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const [friendships, incoming] = await Promise.all([
      // принятые дружбы (в любой стороне)
      Friendship.find({
        $or: [{ requester: userId }, { recipient: userId }],
        status: "accepted",
      }).populate("requester recipient", "username avatar"),

      // входящие ожидающие запросы
      Friendship.find({ recipient: userId, status: "pending" })
        .populate("requester", "username avatar"),
    ]);

    const friends = friendships.map((f) => {
      const other = f.requester._id.equals(userId) ? f.recipient : f.requester;
      return { id: other._id, username: other.username, avatar: other.avatar, friendshipId: f._id };
    });

    const requests = incoming.map((f) => ({
      requestId: f._id,
      from: { id: f.requester._id, username: f.requester.username, avatar: f.requester.avatar },
      createdAt: f.createdAt,
    }));

    res.json({ friends, requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/friends/request — отправить запрос по username */
router.post("/request", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "username required" });

    const recipient = await User.findOne({ username: username.trim() });
    if (!recipient) return res.status(404).json({ error: "User not found" });

    const requesterId = new mongoose.Types.ObjectId(req.user.userId);
    if (recipient._id.equals(requesterId)) {
      return res.status(400).json({ error: "Cannot add yourself" });
    }

    // Проверяем, нет ли уже запроса
    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipient._id },
        { requester: recipient._id, recipient: requesterId },
      ],
    });
    if (existing) {
      if (existing.status === "accepted") return res.status(409).json({ error: "Already friends" });
      if (existing.status === "pending")  return res.status(409).json({ error: "Request already sent" });
      // rejected → resend
      existing.status = "pending";
      existing.requester = requesterId;
      existing.recipient = recipient._id;
      await existing.save();
      return res.json({ message: "Request re-sent" });
    }

    const friendship = await Friendship.create({ requester: requesterId, recipient: recipient._id });
    res.status(201).json({ message: "Request sent", requestId: friendship._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/friends/accept/:id */
router.post("/accept/:id", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const f = await Friendship.findOne({ _id: req.params.id, recipient: userId, status: "pending" });
    if (!f) return res.status(404).json({ error: "Request not found" });
    f.status = "accepted";
    await f.save();
    res.json({ message: "Friend added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/friends/reject/:id */
router.post("/reject/:id", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const f = await Friendship.findOne({ _id: req.params.id, recipient: userId, status: "pending" });
    if (!f) return res.status(404).json({ error: "Request not found" });
    f.status = "rejected";
    await f.save();
    res.json({ message: "Request rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE /api/friends/:id — удалить друга */
router.delete("/:id", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const friendId = new mongoose.Types.ObjectId(req.params.id);
    await Friendship.deleteOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
      status: "accepted",
    });
    res.json({ message: "Friend removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
