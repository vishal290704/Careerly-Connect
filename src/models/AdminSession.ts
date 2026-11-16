import mongoose, { Schema } from "mongoose";

const adminSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date },
}, { timestamps: true });

export const AdminSession = mongoose.models.AdminSession ?? mongoose.model("AdminSession", adminSessionSchema);
