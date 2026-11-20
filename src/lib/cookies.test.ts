import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import { authCookieOptions, clearAuthCookies } from "@/lib/cookies";

describe("authentication cookie configuration", () => {
  it("creates secure HttpOnly SameSite=Lax cookies outside test production mode", () => {
    expect(authCookieOptions(900)).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });
  });

  it("clears user, refresh and admin cookies", () => {
    const response = NextResponse.json({ ok: true });
    clearAuthCookies(response);
    const headers = response.headers.getSetCookie();
    expect(headers).toHaveLength(3);
    expect(headers.join(",")).toContain("applyora_user=");
    expect(headers.join(",")).toContain("applyora_refresh=");
    expect(headers.join(",")).toContain("applyora_admin=");
  });
});
