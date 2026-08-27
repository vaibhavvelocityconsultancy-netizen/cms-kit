export const dynamic = "force-dynamic";

import { prisma } from "@/src/app/lib/prisma";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createToken } from "@/src/app/lib/jwt"; // ← adjust path to wherever your jwt helpers live
import { startTrial } from "@/src/app/lib/services/subscription/subscription.service";
// import { startTrial } from "@/src/app/lib/services/common_urls/payment.service";

export const POST = asyncHandler(async (req) => {
  const {
    name,
    email,
    password,
    planId,
    billingCycle = "MONTHLY",
  } = await req.json();

  if (!name?.trim()) throw new ApiError(400, "Name is required");
  if (!email?.trim()) throw new ApiError(400, "Email is required");
  if (!password?.trim()) throw new ApiError(400, "Password is required");

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(400, "User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  // Get the one tenant that already exists (or hardcode its known id/slug)
  const tenant = await prisma.tenant.findFirst();

  if (!tenant) {
    throw new ApiError(500, "No tenant configured. Contact support.");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      tenantId: tenant.id,
    },
  });

  console.log("Register route: user created", {
    userId: user.id,
    email: user.email,
    planId,
    billingCycle,
  });

  // Auto-create subscription if planId provided
  let subscription = null;
  if (planId) {
    console.log("Register route: planId provided, calling startTrial", {
      userId: user.id,
      planId,
      billingCycle,
    });
    try {
      subscription = await startTrial(user.id, planId, billingCycle);
      console.log("Register route: startTrial returned", {
        subscriptionId: subscription?.id,
        userId: user.id,
        planId,
      });
    } catch (error) {
      console.error("Subscription creation failed during signup:", error);
      console.error("startTrial error details", {
        userId: user.id,
        planId,
        billingCycle,
        errorMessage: error?.message,
        errorStack: error?.stack,
      });
      // Don't throw — user is created, subscription can be set up later
    }
  } else {
    console.log("Register route: no planId provided, skipping startTrial");
  }

  // ── Create JWT and set cookie ──────────────────────────────
  const token = await createToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role, // include whatever your requireAuth() reads
    tenantId: user.tenantId,
  });

  const { password: _, ...safeUser } = user;

  const response = NextResponse.json(
    new ApiResponse(
      201,
      { user: safeUser, subscription },
      "User created successfully",
    ),
    { status: 201 },
  );

  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
});
