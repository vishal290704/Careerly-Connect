import mongoose, { Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  normalizedEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
  college: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, required: true, trim: true },
  academicYear: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  emailVerifiedAt: { type: Date },
  passwordResetTokenHash: { type: String },
  passwordResetExpiresAt: { type: Date },
  premiumExpiresAt: { type: Date },
  savedJobIds: [{ type: Schema.Types.ObjectId, ref: "Job" }],
  referralCode: { type: String, unique: true, sparse: true, uppercase: true },
  referredBy: { type: Schema.Types.ObjectId, ref: "User" },
  successfulReferralCount: { type: Number, default: 0 },
  totalRewardDays: { type: Number, default: 0 },
}, { timestamps: true });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
