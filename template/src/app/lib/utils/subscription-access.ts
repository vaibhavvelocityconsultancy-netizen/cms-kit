import { prisma } from "../prisma";
import { requireAuth } from "../withPermission";
import { ApiError } from "./ApiError";

/**
 * ═════════════════════════════════════════════════════════════
 * REQUIRE ACTIVE SUBSCRIPTION
 * ═════════════════════════════════════════════════════════════
 *
 * Ensures user has an active/valid subscription before accessing protected features.
 *
 * Checks:
 * 1. User is authenticated
 * 2. User has a subscription
 * 3. Subscription is not expired (auto-expires if needed)
 * 4. Subscription is either ACTIVE or in valid TRIALING period
 *
 * Returns: Current session (auth passed)
 * Throws: ApiError(403) if subscription is invalid/expired
 */
export async function requireActiveSubscription() {
  const session = await requireAuth();

  if (!prisma.planSubscription) {
    return session;
  }

  const subscription = await prisma.planSubscription.findFirst({
    where: {
      userId: Number(session.user.id),
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // ✅ Import and use the helper function to auto-expire if needed
  // This ensures we always check the latest subscription status
  const { ensureSubscriptionExpired } =
    await import("../services/subscription/subscription.service");
  const validSubscription = subscription
    ? await ensureSubscriptionExpired(subscription)
    : null;

  const now = new Date();

  // ✅ Check if subscription is valid (with proper trial validation)
  const hasAccess =
    validSubscription &&
    (validSubscription.status === "ACTIVE" ||
      (validSubscription.status === "TRIAL" &&
        validSubscription.trialEndsAt &&
        validSubscription.trialEndsAt > now));

  if (!hasAccess) {
    const statusText = validSubscription
      ? `${validSubscription.status}`
      : "No subscription";
    throw new ApiError(
      403,
      `Your subscription has expired (${statusText}). Please subscribe to continue.`,
    );
  }

  return session;
}
