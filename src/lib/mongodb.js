import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ---- Schemas ----

const favoriteSchema = new mongoose.Schema({
  movieId: { type: Number, required: true },
  mediaType: { type: String, enum: ["movie", "tv"], default: "movie" },
  title: String,
  posterPath: String,
  voteAverage: Number,
  addedAt: { type: Date, default: Date.now },
});

const viewHistorySchema = new mongoose.Schema({
  movieId: { type: Number, required: true },
  mediaType: { type: String, enum: ["movie", "tv"], default: "movie" },
  title: String,
  posterPath: String,
  watchedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 },
});

export const Favorite =
  mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);
export const ViewHistory =
  mongoose.models.ViewHistory ||
  mongoose.model("ViewHistory", viewHistorySchema);
