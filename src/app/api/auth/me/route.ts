import { NextResponse } from "next/server";
import { cookieName, getCurrentUser } from "@/lib/user-auth";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { hasValidCsrfToken } from "@/lib/security";
import { z } from "zod";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    if ((await cookies()).get(cookieName)?.value) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: false });
  }
  await connectToDatabase();
  const now = new Date();
  const premiumActive = Boolean(user.premiumExpiresAt && user.premiumExpiresAt > now);
  const lastPayment = await Payment.findOne({ userId: user._id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    authenticated: true,
    name: user.name,
    email: user.normalizedEmail,
    phone: user.phone,
    college: user.college,
    academicYear: user.academicYear,
    branch: user.branch,
    location: user.location,
    createdAt: user.createdAt,
    subscription: {
      currentPlan: premiumActive ? "PREMIUM" : "FREE",
      currentStatus: premiumActive ? "ACTIVE" : lastPayment?.status === "PENDING" ? "PENDING" : lastPayment?.status === "APPROVED" ? "EXPIRED" : lastPayment?.status === "REJECTED" ? "REJECTED" : "FREE",
      startDate: premiumActive ? user.premiumStartedAt : lastPayment?.subscriptionStartAt,
      expirationDate: premiumActive ? user.premiumExpiresAt : lastPayment?.subscriptionExpiresAt ?? (user.premiumExpiresAt && user.premiumExpiresAt <= now ? user.premiumExpiresAt : null),
      remainingDays: premiumActive && user.premiumExpiresAt ? Math.max(0, Math.ceil((user.premiumExpiresAt.getTime() - now.getTime()) / 86400000)) : 0,
      lastPurchasedPlan: lastPayment?.planId ?? null,
      approvalStatus: lastPayment?.status ?? null,
      purchaseDate: lastPayment?.createdAt ?? null,
    },
  });
}

export async function PATCH(request: Request) {
  if (!(await hasValidCsrfToken(request))) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().min(5).max(30).optional(),
    college: z.string().trim().min(2).max(120).optional(),
    academicYear: z.string().trim().min(1).max(30).optional(),
    branch: z.string().trim().min(1).max(80).optional(),
    location: z.string().trim().min(2).max(120).optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check the profile fields." }, { status: 400 });
  const allowed = parsed.data;
  Object.assign(user, allowed);
  await user.save();
  return NextResponse.json({ message: "Profile updated.", name: user.name });
}
