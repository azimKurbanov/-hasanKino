import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import friendsRouter from "./routes/friends.js";
import lobbyRouter from "./routes/lobby.js";
import { registerSocketHandlers } from "./socket/handlers.js";

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const ALLOWED_ORIGINS = FRONTEND_URL.split(",").map((origin) => origin.trim()).filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

/* ─── Express ─── */
const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
}));
app.use(express.json());

/* ─── Routes ─── */
app.use("/api/friends", friendsRouter);
app.use("/api/lobby", lobbyRouter);

app.get("/health", (_, res) => res.json({ ok: true, ts: Date.now() }));

/* ─── HTTP + Socket.io ─── */
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Socket origin not allowed"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Пинг каждые 25 сек, таймаут 60 сек
  pingInterval: 25000,
  pingTimeout: 60000,
});

registerSocketHandlers(io);

/* ─── MongoDB ─── */
async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  console.log("✅ MongoDB connected");

  httpServer.listen(PORT, () => {
    console.log(`🚀 KINO server running on http://localhost:${PORT}`);
    console.log(`   Frontend: ${FRONTEND_URL}`);
  });
}

start().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});
