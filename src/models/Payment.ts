import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  planId: { type: String, enum: ["1-month", "3-months", "6-months"], required: true },
  finalAmount: { type: Number, required: true },
  originalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  referralCodeUsed: { type: String, uppercase: true, trim: true },
  transactionId: { type: String, required: true, unique: true, trim: true },
  upiId: { type: String, trim: true },
  paymentProofReference: { type: String },
  paymentProof: { type: Buffer, select: false },
  paymentProofMimeType: { type: String },
  paymentMethod: { type: String, enum: ["RAZORPAY", "UPI"], default: "RAZORPAY" },
  razorpayOrderId: { type: String, unique: true, sparse: true, trim: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true, trim: true },
  razorpaySignature: { type: String, select: false },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  rejectionReason: String,
  reviewedAt: Date,
}, { timestamps: true });

export const Payment = mongoose.models.Payment ?? mongoose.model("Payment", paymentSchema);
