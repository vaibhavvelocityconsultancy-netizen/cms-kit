// src/app/api/subscriptions/plan-info/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/src/app/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("planId");
  const billingCycle = searchParams.get("billingCycle") || "MONTHLY";
  const parsedPlanId = Number.parseInt(planId ?? "", 10);

  if (!Number.isInteger(parsedPlanId) || parsedPlanId <= 0) {
    return NextResponse.json(
      { success: false, message: "A valid planId is required" },
      { status: 400 },
    );
  }

  try {
    const plan = await prisma.plan.findUnique({ where: { id: parsedPlanId } });
    if (!plan || !plan.isPublished) {
      return NextResponse.json(
        { success: false, message: "Plan not found" },
        { status: 404 },
      );
    }

    const paypalPlanId =
      billingCycle === "MONTHLY"
        ? plan.paypalMonthlyPlanId
        : plan.paypalYearlyPlanId;

    if (!paypalPlanId) {
      return NextResponse.json(
        {
          success: false,
          message: "This plan isn't configured for PayPal yet",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: { paypalPlanId } });
  } catch (error) {
    console.error("Failed to load plan info:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load plan information" },
      { status: 500 },
    );
  }
}
