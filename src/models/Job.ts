import mongoose, { Schema } from "mongoose";

const jobSchema = new Schema({
  companyName: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  stipend: { type: String, required: true, trim: true },
  workMode: { type: String, enum: ["Remote", "Hybrid", "On-site"], required: true },
  jobType: { type: String, enum: ["Internship", "Full-time"], required: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  requiredSkills: [{ type: String, trim: true }],
  applyUrl: { type: String, required: true, trim: true },
  status: { type: String, enum: ["DRAFT", "PUBLISHED", "CLOSED"], default: "DRAFT" },
  publishedAt: Date,
}, { timestamps: true });

export const Job = mongoose.models.Job ?? mongoose.model("Job", jobSchema);
