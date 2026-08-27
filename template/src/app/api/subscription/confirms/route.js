import { NextResponse } from "next/server";
import { requireAuth } from "@/src/app/lib/withPermission";
import { recordPendingSubscription } from "@/src/app/lib/services/subscription/subscription.service.js";

export async function POST(request) {
  let session;

  try {
    session = await requireAuth();
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { planId, billingCycle, subscriptionId } = await request.json();

  if (!planId || !billingCycle || !subscriptionId) {
    return NextResponse.json(
      { success: false, message: "Missing fields" },
      { status: 400 },
    );
  }

  try {
    const record = await recordPendingSubscription(
      session.user.id,
      planId,
      billingCycle,
      subscriptionId,
    );
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
