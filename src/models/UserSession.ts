import mongoose, { Schema } from "mongoose";

const userSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  familyId: { type: String, required: true, index: true },
  refreshTokenHash: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date },
  replacedByHash: { type: String },
  lastUsedAt: { type: Date },
}, { timestamps: true });

export const UserSession = mongoose.models.UserSession ?? mongoose.model("UserSession", userSessionSchema);
