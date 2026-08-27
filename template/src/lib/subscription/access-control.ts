/**
 * ═════════════════════════════════════════════════════════════════════
 * VIDEO ACCESS CONTROL LOGIC
 * ═════════════════════════════════════════════════════════════════════
 *
 * RULES:
 * 1. No Subscription → BLOCK
 * 2. TRIAL + canWatchVideos = true → ALLOW
 * 3. ACTIVE + canWatchVideos = true → ALLOW
 * 4. EXPIRED → BLOCK
 * 5. CANCELED → BLOCK
 * 6. Plan canWatchVideos = false → BLOCK
 *
 * Two-check rule: Subscription must be ACTIVE AND plan must allow it.
 * Never grant access just because a subscription exists.
 */

import { prisma } from "@/src/app/lib/prisma";

interface VideoAccessRequest {
  userId: number;
  videoId?: string;
}

interface VideoAccessResponse {
  allowed: boolean;
  reason?: string;
  subscription?: {
    status: string;
    currentPeriodEnd: Date;
    planName: string;
    canWatchVideos: boolean;
  };
}

/**
 * Check if user has access to premium videos
 * @param userId - User ID to check
 * @returns VideoAccessResponse with detailed reason
 *
 * Used in:
 * - Video API route protection
 * - Frontend conditional rendering
 * - Paywall component logic
 */
export async function canAccessVideoContent(
  userId: number
): Promise<VideoAccessResponse> {
  try {
    // Step 1: Get user's subscription with plan details
    const subscription = await prisma.subscription.findUnique({
      where: { userId: Number(userId) },
      include: {
        plan: {
          select: {
            name: true,
            canWatchVideos: true,
          },
        },
      },
    });

    // No subscription at all
    if (!subscription) {
      return {
        allowed: false,
        reason: "No subscription found. Please choose a plan.",
      };
    }

    const now = new Date();
    let isSubscriptionActive = false;

    // Step 2: Verify subscription is actually active (check dates!)
    switch (subscription.status) {
      case "CANCELED":
        return {
          allowed: false,
          reason: "Your subscription was canceled.",
          subscription: {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            planName: subscription.plan.name,
            canWatchVideos: subscription.plan.canWatchVideos,
          },
        };

      case "EXPIRED":
        return {
          allowed: false,
          reason: "Your subscription has expired.",
          subscription: {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            planName: subscription.plan.name,
            canWatchVideos: subscription.plan.canWatchVideos,
          },
        };

      case "TRIAL":
        // Trial valid only if trialEndsAt hasn't passed
        if (!subscription.trialEndsAt || subscription.trialEndsAt <= now) {
          return {
            allowed: false,
            reason: "Your free trial has ended.",
            subscription: {
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              planName: subscription.plan.name,
              canWatchVideos: subscription.plan.canWatchVideos,
            },
          };
        }
        isSubscriptionActive = true;
        break;

      case "ACTIVE":
        // Active only if currentPeriodEnd hasn't passed
        if (subscription.currentPeriodEnd <= now) {
          return {
            allowed: false,
            reason: "Your subscription has expired.",
            subscription: {
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              planName: subscription.plan.name,
              canWatchVideos: subscription.plan.canWatchVideos,
            },
          };
        }
        isSubscriptionActive = true;
        break;

      default:
        return {
          allowed: false,
          reason: "Invalid subscription status.",
        };
    }

    // Step 3: Subscription is active, now check plan permissions
    if (!subscription.plan.canWatchVideos) {
      return {
        allowed: false,
        reason: "Your plan does not include video access.",
        subscription: {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          planName: subscription.plan.name,
          canWatchVideos: subscription.plan.canWatchVideos,
        },
      };
    }

    // BOTH checks passed: subscription is active AND plan allows videos
    return {
      allowed: true,
      subscription: {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        planName: subscription.plan.name,
        canWatchVideos: subscription.plan.canWatchVideos,
      },
    };
  } catch (error) {
    console.error("Error checking video access:", error);
    return {
      allowed: false,
      reason: "Unable to verify access. Please try again.",
    };
  }
}

/**
 * Feature access helper - Reusable for any feature permission
 * @param userId - User ID
 * @param featureName - Feature flag name (e.g., "canDownloadResources")
 */
export async function canAccessFeature(
  userId: number,
  featureName: "canWatchVideos" | "canDownloadResources" | "canAccessLiveSessions" | "canGetCertificates"
): Promise<boolean> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: Number(userId) },
      include: {
        plan: {
          select: {
            [featureName]: true,
          },
        },
      },
    });

    if (!subscription) return false;

    const now = new Date();

    // Check subscription is active
    let isActive = false;
    if (subscription.status === "TRIAL" && subscription.trialEndsAt) {
      isActive = subscription.trialEndsAt > now;
    } else if (subscription.status === "ACTIVE") {
      isActive = subscription.currentPeriodEnd > now;
    }

    // Return true only if subscription active AND feature allowed
    return isActive && subscription.plan[featureName];
  } catch (error) {
    console.error("Error checking feature access:", error);
    return false;
  }
}
