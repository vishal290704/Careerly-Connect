import mongoose, { Schema } from "mongoose";

const referralSchema = new Schema({
  referrerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  referredUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  referralCode: { type: String, required: true, uppercase: true },
  qualifyingPaymentId: { type: Schema.Types.ObjectId, ref: "Payment", required: true, unique: true },
  qualifiedAt: { type: Date, default: Date.now },
  rewardDays: { type: Number, default: 0 },
  rewardGrantedAt: Date,
}, { timestamps: true });

export const Referral = mongoose.models.Referral ?? mongoose.model("Referral", referralSchema);
