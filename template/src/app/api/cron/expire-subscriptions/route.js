import { expireSubscriptions } from "@/src/app/lib/services/subscription/subscription.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";

/**
 * CRON: Expire Subscriptions
 * ─────────────────────────────────────────────────
 * Called by external cron scheduler (Vercel Cron, AWS Events, etc.)
 *
 * Triggered: Daily at 3 AM UTC (or your preferred time)
 *
 * What it does:
 *   1. TRIAL → EXPIRED (if trialEndsAt <= now)
 *   2. ACTIVE → EXPIRED (if currentPeriodEnd <= now)
 *
 * Security: Protected by CRON_SECRET header
 */
export async function GET(req) {
  try {
    // Verify cron secret from header
    const cronSecret = req.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.warn("⚠️ CRON_SECRET not set in environment");
      return Response.json(
        new ApiResponse(500, null, "CRON_SECRET not configured"),
        { status: 500 },
      );
    }

    if (cronSecret !== `Bearer ${expectedSecret}`) {
      return Response.json(new ApiResponse(401, null, "Unauthorized"), {
        status: 401,
      });
    }

    // Run expiry logic
    const result = await expireSubscriptions();

    console.log(
      `✅ Subscription expiry cron completed: ${result.trialToActive} trials expired, ${result.expiredTotal} subscriptions expired`,
    );

    return Response.json(
      new ApiResponse(200, result, "Subscriptions expired successfully"),
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Cron error:", error.message);
    return Response.json(new ApiResponse(500, null, error.message), {
      status: 500,
    });
  }
}
