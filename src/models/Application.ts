import mongoose, { Schema } from "mongoose";

const applicationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  appliedAt: { type: Date, default: Date.now },
  entitlementType: { type: String, enum: ["FREE", "PREMIUM"], required: true },
  status: { type: String, enum: ["RECORDED"], default: "RECORDED" },
}, { timestamps: true });

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ userId: 1, appliedAt: -1 });

export const Application = mongoose.models.Application ?? mongoose.model("Application", applicationSchema);
