import { NextResponse } from "next/server";
import argon2 from "argon2";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

const signupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  college: z.string().trim().min(2),
  password: z.string().min(8),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/),
  year: z.string().trim().min(1),
  branch: z.string().trim().min(1),
  location: z.string().trim().min(2),
});

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
    const data = signupSchema.parse(body);
    await connectToDatabase();
    const normalizedEmail = data.email.toLowerCase();
    const existing = await User.exists({ normalizedEmail });
    if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    await User.create({
      name: data.name,
      normalizedEmail,
      college: data.college,
      passwordHash: await argon2.hash(data.password, { type: argon2.argon2id }),
      phone: data.phone,
      academicYear: data.year,
      branch: data.branch,
      location: data.location,
    });
    if (!contentType.includes("application/json")) return NextResponse.redirect(new URL("/login?created=1", request.url));
    return NextResponse.json({ message: "Account created successfully." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Please check all form fields." }, { status: 400 });
    console.error("signup failed", error);
    return NextResponse.json({ error: "Unable to create your account right now." }, { status: 500 });
  }
}
