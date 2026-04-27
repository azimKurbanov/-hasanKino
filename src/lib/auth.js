import mongoose from "mongoose";
import crypto from "crypto";

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  avatar: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Comment schema
const commentSchema = new mongoose.Schema({
  movieId: { type: Number, required: true, index: true },
  mediaType: { type: String, enum: ["movie", "tv"], default: "movie" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  text: { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
});

// Friendship schema
const friendshipSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
export const Friendship = mongoose.models.Friendship || mongoose.model("Friendship", friendshipSchema);

// Hash password
export function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

export function generateSalt() {
  return crypto.randomBytes(16).toString("hex");
}

// Используем JWT_SECRET (с fallback на MONGODB_URI для обратной совместимости)
function getSecret() {
  return process.env.JWT_SECRET || process.env.MONGODB_URI;
}

export function createToken(userId, username) {
  const payload = JSON.stringify({ userId, username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    const [encoded, sig] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request) {
  const cookie = request.cookies?.get("auth_token")?.value;
  if (cookie) return verifyToken(cookie);
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return verifyToken(header.slice(7));
  return null;
}
