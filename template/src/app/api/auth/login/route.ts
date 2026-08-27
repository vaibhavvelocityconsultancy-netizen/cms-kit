export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/app/lib/prisma";
import { createToken } from "@/src/app/lib/jwt";
import { normalizeRole } from "@/src/app/lib/permissions";

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();
    const shouldRemember = Boolean(rememberMe);
    // console.log("🔍 Login attempt for:", email);

    if (!email || !password) {
      // console.log("❌ Missing email or password");
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      // console.log("❌ User not found:", email);
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // console.log("❌ Password mismatch for:", email);
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // console.log("✅ User authenticated:", email);

    const token = await createToken(
      {
        id: String(user.id),
        email: user.email,
        name: user.name,
        role: normalizeRole(user.role),
        tenantId: user.tenantId,
      },
      shouldRemember,
    );

    // console.log("✅ JWT token created:", token.substring(0, 20) + "...");

    const maxAge = shouldRemember
      ? 60 * 60 * 24 * 30 // 30 days if remember me
      : 60 * 60 * 24; // 1 day if not remember me

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name,
        role: normalizeRole(user.role),
        tenantId: user.tenantId,
      },
    });

    // ✅ Set cookie manually
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    // console.log("✅ Auth cookie set, returning response");
    return response;
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
