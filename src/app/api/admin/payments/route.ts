import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { Payment } from "@/models/Payment";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  return NextResponse.json({ payments: await Payment.find().select("-paymentProof").populate("userId", "name normalizedEmail phone").sort({ createdAt: -1 }).lean() });
}
