export const dynamic = "force-dynamic"; 

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/src/app/lib/jwt";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  // console.log("🔍 GET /api/auth/me - Token exists:", !!token);

  if (!token) {
    // console.log("❌ No auth-token cookie found");
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const payload = await verifyToken(token);
  // console.log("🔍 Token payload:", payload);

  if (!payload) {
    // console.log("❌ Token verification failed");
    return NextResponse.json({ success: false }, { status: 401 });
  }

  // console.log("✅ /api/auth/me returning user:", payload);
  return NextResponse.json({ success: true, user: payload });
}
