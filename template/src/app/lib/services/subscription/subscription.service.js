// import { prisma } from "../../prisma.js";
// import { ApiError } from "@/src/app/lib/utils/ApiError.js";
import { prisma } from "../../prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { createPaypalBillingPlan } from "./paypal.service.js";

// ═════════════════════════════════════════════════════════════
// SUBSCRIPTION EXPIRATION HELPER
// ═════════════════════════════════════════════════════════════
/**
 * Ensures a subscription's status is up-to-date by expiring it if needed.
 *
 * Rules:
 * - TRIAL: Expires if trialEndsAt <= now
 * - ACTIVE: Expires if currentPeriodEnd <= now
 * - Other: Left unchanged
 *
 * Returns: The subscription record (updated if expired, otherwise unchanged)
 * This is called on every access check to avoid stale records.
 */
export async function ensureSubscriptionExpired(subscription) {
  if (!subscription) return subscription;

  const now = new Date();
  let shouldExpire = false;
  let reason = null;

  if (subscription.status === "TRIAL") {
    if (subscription.trialEndsAt && subscription.trialEndsAt <= now) {
      shouldExpire = true;
      reason = "Trial period ended";
    }
  } else if (subscription.status === "ACTIVE") {
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd <= now) {
      shouldExpire = true;
      reason = "Billing period ended";
    }
  }

  if (shouldExpire) {
    console.log(
      `🔄 Expiring subscription [ID: ${subscription.id}, UserID: ${subscription.userId}]: ${reason}`,
    );
    return await prisma.planSubscription.update({
      where: { id: subscription.id },
      data: { status: "EXPIRED" },
      include: { plan: true },
    });
  }

  return subscription;
}

// ─────────────────────────────────────────────────────────────
// PLAN CRUD (admin management)
// ─────────────────────────────────────────────────────────────

export async function getAllPlans() {
  return prisma.plan.findMany({
    include: { features: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPlanById(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, "Valid plan ID is required");
  }

  return prisma.plan.findUnique({
    where: { id: numericId },
    include: { features: { orderBy: { sortOrder: "asc" } } },
  });
}

async function resolveUniqueSlug(tenantId, baseSlug) {
  const sanitizedBase = (baseSlug || "plan")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const initialSlug = sanitizedBase || "plan";
  let slug = initialSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.plan.findFirst({
      where: { tenantId, slug },
      select: { id: true },
    });

    if (!existing) return slug;

    slug = `${initialSlug}-${counter}`;
    counter += 1;
  }
}

function hasPaypalConfig() {
  return Boolean(
    process.env.PAYPAL_PRODUCT_ID &&
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET,
  );
}

function getValidAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

async function ensurePaypalPlanIds(plan, previousPlan = null) {
  const updates = {};

  if (!hasPaypalConfig()) {
    console.log(
      `ℹ️ Skipping PayPal plan setup for "${plan.title}" because PayPal credentials or product ID are not configured.`,
    );
    return plan;
  }

  const monthlyPriceChanged =
    previousPlan &&
    previousPlan.monthlyPrice != null &&
    Number(previousPlan.monthlyPrice) !== Number(plan.monthlyPrice);

  const yearlyPriceChanged =
    previousPlan &&
    previousPlan.yearlyPrice != null &&
    Number(previousPlan.yearlyPrice) !== Number(plan.yearlyPrice);

  const monthlyAmount = getValidAmount(plan.monthlyPrice);
  const yearlyAmount = getValidAmount(plan.yearlyPrice);

  const needsMonthly =
    plan.allowMonthly &&
    monthlyAmount != null &&
    (!plan.paypalMonthlyPlanId || monthlyPriceChanged);

  const needsYearly =
    plan.allowYearly &&
    yearlyAmount != null &&
    (!plan.paypalYearlyPlanId || yearlyPriceChanged);

  if (needsMonthly) {
    try {
      const ppPlan = await createPaypalBillingPlan({
        productId: process.env.PAYPAL_PRODUCT_ID,
        name: `${plan.title} — Monthly`,
        amount: monthlyAmount,
        currency: process.env.PAYPAL_DEFAULT_CURRENCY || "USD",
        interval: "MONTH",
        trialDays: plan.trialDays ?? 0,
      });
      updates.paypalMonthlyPlanId = ppPlan.id;
      if (monthlyPriceChanged) {
        console.log(
          `💰 Price changed for "${plan.title}" monthly — old subscribers stay on previous PayPal plan, new signups use ${ppPlan.id}`,
        );
      }
    } catch (err) {
      console.error(
        `⚠️ Failed to create PayPal monthly plan for "${plan.title}":`,
        err.message,
      );
    }
  }

  if (needsYearly) {
    try {
      const ppPlan = await createPaypalBillingPlan({
        productId: process.env.PAYPAL_PRODUCT_ID,
        name: `${plan.title} — Yearly`,
        amount: yearlyAmount,
        currency: process.env.PAYPAL_DEFAULT_CURRENCY || "USD",
        interval: "YEAR",
        trialDays: plan.trialDays ?? 0,
      });
      updates.paypalYearlyPlanId = ppPlan.id;
      if (yearlyPriceChanged) {
        console.log(
          `💰 Price changed for "${plan.title}" yearly — old subscribers stay on previous PayPal plan, new signups use ${ppPlan.id}`,
        );
      }
    } catch (err) {
      console.error(
        `⚠️ Failed to create PayPal yearly plan for "${plan.title}":`,
        err.message,
      );
    }
  }

  if (Object.keys(updates).length > 0) {
    return prisma.plan.update({
      where: { id: plan.id },
      data: updates,
      include: { features: true },
    });
  }

  return plan;
}

const FALLBACK_TRIAL_DAYS = 14;

async function getTrialDaysForPlan(tenantId, plan) {
  if (plan.trialDays !== null && plan.trialDays !== undefined) {
    return plan.trialDays;
  }

  const settings = await prisma.planSettings.findUnique({
    where: { tenantId },
  });

  return settings?.defaultTrialDays ?? FALLBACK_TRIAL_DAYS;
}

export async function getPlanSettings(tenantId) {
  const settings = await prisma.planSettings.findUnique({
    where: { tenantId },
  });
  return settings ?? { tenantId, defaultTrialDays: FALLBACK_TRIAL_DAYS };
}

export async function updatePlanSettings(tenantId, { defaultTrialDays }) {
  if (typeof defaultTrialDays !== "number" || defaultTrialDays < 0) {
    throw new ApiError(400, "defaultTrialDays must be a non-negative number");
  }

  return prisma.planSettings.upsert({
    where: { tenantId },
    update: { defaultTrialDays },
    create: { tenantId, defaultTrialDays },
  });
}

export async function createPlan(tenantId, input) {
  if (!tenantId) {
    throw new ApiError(
      401,
      "Missing tenant context — check session.user.tenantId",
    );
  }

  const { features = [], slug: _ignoredSlug, ...planData } = input;
  const baseSlug = input.slug || input.title || "plan";
  const slug = await resolveUniqueSlug(tenantId, baseSlug);

  const plan = await prisma.plan.create({
    data: {
      ...planData,
      slug,
      tenantId,
      features: {
        create: features.map((f, i) => ({
          title: f.title,
          sortOrder: f.sortOrder ?? i,
        })),
      },
    },
    include: { features: true },
  });

  return ensurePaypalPlanIds(plan);
}

export async function updatePlan(id, tenantId, input) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, "Valid plan ID is required");
  }

  const existingPlan = await prisma.plan.findUnique({
    where: { id: numericId, tenantId },
  });
  if (!existingPlan) throw new ApiError(404, "Plan not found");

  const { features = [], ...planData } = input;

  if (planData.slug) {
    const duplicateSlug = await prisma.plan.findFirst({
      where: { slug: planData.slug, NOT: { id: Number(id) } },
    });
    if (duplicateSlug) {
      throw new ApiError(
        409,
        `Slug "${planData.slug}" is already used by another plan`,
      );
    }
  }

  const incomingFeatureIds = features
    .filter((f) => f.id)
    .map((f) => Number(f.id));

  await prisma.planFeature.deleteMany({
    where: { planId: numericId, id: { notIn: incomingFeatureIds } },
  });

  const updatedPlan = await prisma.plan.update({
    where: { id: numericId },
    data: {
      ...planData,
      features: {
        update: features
          .filter((f) => f.id)
          .map((f) => ({
            where: { id: Number(f.id) },
            data: { title: f.title, sortOrder: f.sortOrder },
          })),
        create: features
          .filter((f) => !f.id)
          .map((f, i) => ({ title: f.title, sortOrder: f.sortOrder ?? i })),
      },
    },
    include: { features: true },
  });

  return ensurePaypalPlanIds(updatedPlan, existingPlan);
}

export async function recordPendingSubscription(
  userId,
  planId,
  billingCycle,
  paypalSubscriptionId,
) {
  const plan = await prisma.plan.findUnique({ where: { id: Number(planId) } });
  if (!plan) throw new ApiError(404, "Plan not found");

  const paypalPlanId =
    billingCycle === "MONTHLY"
      ? plan.paypalMonthlyPlanId
      : plan.paypalYearlyPlanId;
  if (!paypalPlanId) {
    throw new ApiError(
      500,
      `No PayPal plan configured for ${plan.title} (${billingCycle})`,
    );
  }

  const existing = await prisma.planSubscription.findUnique({
    where: {
      userId_planId: { userId: Number(userId), planId: Number(planId) },
    },
  });

  if (existing) {
    return prisma.planSubscription.update({
      where: { id: existing.id },
      data: { billingCycle, status: "PENDING", paypalSubscriptionId },
      include: { plan: true },
    });
  }

  return prisma.planSubscription.create({
    data: {
      userId: Number(userId),
      planId: Number(planId),
      billingCycle,
      status: "PENDING",
      startsAt: new Date(),
      currentPeriodEnd: new Date(), // placeholder — webhook sets the real value
      paypalSubscriptionId,
    },
    include: { plan: true },
  });
}

export async function initiatePaypalSubscription(
  userId,
  planId,
  billingCycle,
  { returnUrl, cancelUrl },
) {
  const plan = await prisma.plan.findUnique({ where: { id: Number(planId) } });
  if (!plan) throw new ApiError(404, "Plan not found");
  if (!plan.isPublished)
    throw new ApiError(400, "This plan is not currently available");

  if (billingCycle === "MONTHLY" && !plan.allowMonthly) {
    throw new ApiError(400, "Monthly billing is not available.");
  }
  if (billingCycle === "YEARLY" && !plan.allowYearly) {
    throw new ApiError(400, "Yearly billing is not available.");
  }

  const paypalPlanId =
    billingCycle === "MONTHLY"
      ? plan.paypalMonthlyPlanId
      : plan.paypalYearlyPlanId;

  if (!paypalPlanId) {
    throw new ApiError(
      500,
      `No PayPal plan configured for ${plan.title} (${billingCycle})`,
    );
  }

  const existing = await prisma.planSubscription.findUnique({
    where: {
      userId_planId: { userId: Number(userId), planId: Number(planId) },
    },
  });

  if (existing && existing.status === "ACTIVE") {
    throw new ApiError(
      409,
      "User already has an active subscription to this plan.",
    );
  }

  const ppSubscription = await createPaypalSubscription({
    planId: paypalPlanId,
    userId,
    returnUrl,
    cancelUrl,
  });

  // Store as PENDING — webhook will flip this to ACTIVE once approved
  if (existing) {
    await prisma.planSubscription.update({
      where: { id: existing.id },
      data: {
        billingCycle,
        status: "PENDING",
        paypalSubscriptionId: ppSubscription.id, // ← needs schema addition, see below
      },
    });
  } else {
    await prisma.planSubscription.create({
      data: {
        userId: Number(userId),
        planId: Number(planId),
        billingCycle,
        status: "PENDING",
        startsAt: new Date(),
        currentPeriodEnd: new Date(), // placeholder — webhook sets the real value
        paypalSubscriptionId: ppSubscription.id,
      },
    });
  }

  const approvalUrl = ppSubscription.links?.find(
    (l) => l.rel === "approve",
  )?.href;

  return { subscriptionId: ppSubscription.id, approvalUrl };
}

export async function deletePlan(id, tenantId) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, "Valid plan ID is required");
  }

  return prisma.plan.delete({
    where: { id: numericId, tenantId },
  });
}

export async function togglePlanPublished(id, tenantId) {
  const existingPlan = await prisma.plan.findUnique({
    where: { id: Number(id), tenantId },
  });
  if (!existingPlan) throw new ApiError(404, "Plan not found");

  return prisma.plan.update({
    where: { id: Number(id) },
    data: { isPublished: !existingPlan.isPublished },
  });
}

export async function updatePlanOrder(tenantId, plans) {
  const updates = plans.map((plan, index) =>
    prisma.plan.update({
      where: { id: Number(plan.id), tenantId },
      data: { sortOrder: index },
    }),
  );
  return prisma.$transaction(updates);
}

export async function getUserCurrentAccess(userId) {
  if (!prisma.planSubscription) return { type: "none", record: null }; // Billing module not installed

  const [subscription, enrollment] = await Promise.all([
    prisma.planSubscription.findFirst({
      where: { userId: Number(userId) },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.planEnrollment.findFirst({
      where: { userId: Number(userId) },
      include: { plan: true },
      orderBy: { purchasedAt: "desc" },
    }),
  ]);

  // ✅ Check and expire subscription if needed
  const validSubscription = subscription
    ? await ensureSubscriptionExpired(subscription)
    : null;

  if (enrollment) return { type: "enrollment", record: enrollment };
  if (validSubscription)
    return { type: "subscription", record: validSubscription };
  return { type: null, record: null };
}

export async function getUserCourseAccess(userId, courseId) {
  const [subscription, enrollment] = await Promise.all([
    prisma.subscription.findUnique({
      where: {
        userId_courseId: { userId: Number(userId), courseId: Number(courseId) },
      },
      include: { course: true },
    }),
    prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: { userId: Number(userId), courseId: Number(courseId) },
      },
      include: { course: true },
    }),
  ]);

  if (enrollment) return { type: "enrollment", record: enrollment };
  if (subscription) return { type: "subscription", record: subscription };
  return { type: null, record: null };
}

export async function getPublicPlans() {
  return prisma.plan.findMany({
    where: { isPublished: true },
    include: { features: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPlansWithCurrentSubscription(userId) {
  const [plans, subscription] = await Promise.all([
    prisma.plan.findMany({
      where: { isPublished: true },
      include: {
        features: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),

    prisma.planSubscription.findFirst({
      where: { userId: Number(userId) },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // ✅ Check and expire subscription if needed
  const validSubscription = subscription
    ? await ensureSubscriptionExpired(subscription)
    : null;

  const now = new Date();

  return {
    plans,
    currentPlan: validSubscription
      ? {
          planId: validSubscription.planId,
          status: validSubscription.status,
          trialEndsAt: validSubscription.trialEndsAt,
          currentPeriodEnd: validSubscription.currentPeriodEnd,
          daysRemaining:
            validSubscription.status === "TRIAL" &&
            validSubscription.trialEndsAt
              ? Math.max(
                  0,
                  Math.ceil(
                    (validSubscription.trialEndsAt.getTime() - now.getTime()) /
                      (1000 * 60 * 60 * 24),
                  ),
                )
              : null,
        }
      : null,
  };
}

function computePeriodEnd(plan, billingCycle) {
  if (billingCycle === "LIFETIME") {
    throw new ApiError(
      500,
      "LIFETIME plans should use PlanEnrollment, not PlanSubscription",
    );
  }

  const end = new Date();

  switch (billingCycle) {
    case "MONTHLY":
      end.setMonth(end.getMonth() + 1);
      break;

    case "YEARLY":
      end.setFullYear(end.getFullYear() + 1);
      break;

    default:
      throw new ApiError(400, `Unknown billing cycle: ${billingCycle}`);
  }

  return end;
}
async function hasUserEverSubscribed(userId) {
  const existing = await prisma.planSubscription.findFirst({
    where: { userId: Number(userId) },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function createSubscription(
  userId,
  planId,
  billingCycle = "MONTHLY",
) {
  const plan = await prisma.plan.findUnique({
    where: { id: Number(planId) },
  });

  if (!plan) throw new ApiError(404, "Plan not found");

  if (!plan.isPublished) {
    throw new ApiError(400, "This plan is not currently available");
  }

  // Validate selected billing cycle
  if (billingCycle === "MONTHLY" && !plan.allowMonthly) {
    throw new ApiError(400, "Monthly billing is not available.");
  }

  if (billingCycle === "YEARLY" && !plan.allowYearly) {
    throw new ApiError(400, "Yearly billing is not available.");
  }

  const existing = await prisma.planSubscription.findUnique({
    where: {
      userId_planId: {
        userId: Number(userId),
        planId: Number(planId),
      },
    },
  });

  const now = new Date();
  const currentPeriodEnd = computePeriodEnd(plan, billingCycle);

  if (existing) {
    if (existing.status === "TRIAL") {
      return prisma.planSubscription.update({
        where: { id: existing.id },
        data: {
          billingCycle,
          status: "ACTIVE",
          startsAt: now,
          currentPeriodEnd,
          trialEndsAt: null,
        },
        include: { plan: true },
      });
    }

    throw new ApiError(409, "User already has a subscription to this plan.");
  }

  return prisma.planSubscription.create({
    data: {
      userId: Number(userId),
      planId: Number(planId),
      billingCycle,
      status: "ACTIVE",
      startsAt: now,
      currentPeriodEnd,
    },
    include: { plan: true },
  });
}
export async function startTrial(userId, planId) {
  console.log("startTrial: called", { userId, planId });

  const existing = await prisma.planSubscription.findUnique({
    where: {
      userId_planId: { userId: Number(userId), planId: Number(planId) },
    },
  });
  console.log("startTrial: existing subscription lookup", {
    userId: Number(userId),
    planId: Number(planId),
    existing: Boolean(existing),
  });
  if (existing)
    throw new ApiError(409, "User already has a subscription to this plan.");

  const alreadyUsedTrial = await hasUserEverSubscribed(userId);
  console.log("startTrial: has user ever subscribed", {
    userId: Number(userId),
    alreadyUsedTrial,
  });
  if (alreadyUsedTrial) throw new ApiError(400, "Trial already used.");

  const plan = await prisma.plan.findUnique({ where: { id: Number(planId) } });
  if (!plan) throw new ApiError(404, "Plan not found");

  const trialDays = await getTrialDaysForPlan(plan.tenantId, plan);
  if (trialDays <= 0)
    throw new ApiError(400, "This plan has no trial available.");

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  console.log("startTrial: creating planSubscription", {
    userId: Number(userId),
    planId: Number(planId),
    billingCycle: "MONTHLY",
    status: "TRIAL",
    startsAt: now.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
    currentPeriodEnd: trialEndsAt.toISOString(),
  });

  const subscription = await prisma.planSubscription.create({
    data: {
      userId: Number(userId),
      planId: Number(planId),
      billingCycle: "MONTHLY",
      status: "TRIAL",
      startsAt: now,
      trialEndsAt,
      currentPeriodEnd: trialEndsAt,
    },
    include: { plan: true },
  });

  console.log("startTrial: created planSubscription", {
    subscriptionId: subscription.id,
    userId: subscription.userId,
    planId: subscription.planId,
    status: subscription.status,
  });

  return subscription;
}

const DEFAULT_TRIAL_DAYS = 15;

export async function startDefaultTrial(userId, tenantId) {
  const alreadyUsedTrial = await hasUserEverSubscribed(userId);
  if (alreadyUsedTrial) {
    throw new ApiError(400, "Trial already used or subscription exists.");
  }

  const defaultPlan = await prisma.plan.findFirst({
    where: { tenantId, isPublished: true },
    orderBy: { sortOrder: "asc" },
  });

  if (!defaultPlan) {
    throw new ApiError(500, "No default plan configured for trial.");
  }

  const now = new Date();
  const trialEndsAt = new Date(
    now.getTime() + DEFAULT_TRIAL_DAYS * 24 * 60 * 60 * 1000,
  );

  return prisma.planSubscription.create({
    data: {
      userId: Number(userId),
      planId: defaultPlan.id,
      billingCycle: "MONTHLY",
      status: "TRIAL",
      startsAt: now,
      trialEndsAt,
      currentPeriodEnd: trialEndsAt,
    },
    include: { plan: true },
  });
}

export async function createEnrollment(userId, planId) {
  const existing = await prisma.planEnrollment.findUnique({
    where: {
      userId_planId: { userId: Number(userId), planId: Number(planId) },
    },
  });

  if (existing) {
    throw new ApiError(409, "User is already enrolled in this plan.");
  }

  const plan = await prisma.plan.findUnique({ where: { id: Number(planId) } });

  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  if (!plan.isPublished) {
    throw new ApiError(400, "This plan is not currently available");
  }

  return prisma.planEnrollment.create({
    data: { userId: Number(userId), planId: Number(planId) },
    include: { plan: true },
  });
}

export async function getUserPlanAccess(userId, planId) {
  const [subscription, enrollment] = await Promise.all([
    prisma.planSubscription.findUnique({
      where: {
        userId_planId: { userId: Number(userId), planId: Number(planId) },
      },
      include: { plan: true },
    }),
    prisma.planEnrollment.findUnique({
      where: {
        userId_planId: { userId: Number(userId), planId: Number(planId) },
      },
      include: { plan: true },
    }),
  ]);

  // ✅ Check and expire subscription if needed
  const validSubscription = subscription
    ? await ensureSubscriptionExpired(subscription)
    : null;

  if (enrollment) {
    return { type: "enrollment", record: enrollment };
  }

  if (validSubscription) {
    return { type: "subscription", record: validSubscription };
  }

  return { type: null, record: null };
}

export async function isSubscriptionActive(userId, planId) {
  const access = await getUserPlanAccess(userId, planId);

  if (access.type === "enrollment") {
    return true;
  }

  if (access.type === "subscription") {
    const subscription = access.record;
    const now = new Date();

    switch (subscription.status) {
      case "CANCELED":
      case "EXPIRED":
        return false;
      case "ACTIVE":
        return subscription.currentPeriodEnd > now;
      default:
        return false;
    }
  }

  return false;
}

export async function cancelSubscription(userId, planId) {
  const subscription = await prisma.planSubscription.findUnique({
    where: {
      userId_planId: { userId: Number(userId), planId: Number(planId) },
    },
  });

  if (!subscription) {
    throw new ApiError(404, "No subscription found for this user and plan");
  }

  if (subscription.status === "CANCELED") {
    throw new ApiError(400, "Subscription is already canceled");
  }

  if (subscription.status === "EXPIRED") {
    throw new ApiError(400, "Subscription has already expired");
  }

  return prisma.planSubscription.update({
    where: {
      userId_planId: { userId: Number(userId), planId: Number(planId) },
    },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
    include: { plan: true },
  });
}

export async function expireSubscriptions(userId = null) {
  const now = new Date();

  // ✅ Build filter: if userId provided, only expire that user's subscriptions
  const filterCriteria = userId ? { userId: Number(userId) } : {};

  // ✅ Find all TRIAL subscriptions that should expire
  const expiredTrials = await prisma.planSubscription.findMany({
    where: {
      ...filterCriteria,
      status: "TRIAL",
      trialEndsAt: { lte: now },
    },
  });

  // ✅ Find all ACTIVE subscriptions that should expire
  const expiredActive = await prisma.planSubscription.findMany({
    where: {
      ...filterCriteria,
      status: "ACTIVE",
      currentPeriodEnd: { lte: now },
    },
  });

  // ✅ Update all expired trials
  const trialUpdates = expiredTrials.map((subscription) =>
    prisma.planSubscription.update({
      where: { id: subscription.id },
      data: { status: "EXPIRED" },
    }),
  );

  // ✅ Update all expired active subscriptions
  const activeUpdates = expiredActive.map((subscription) =>
    prisma.planSubscription.update({
      where: { id: subscription.id },
      data: { status: "EXPIRED" },
    }),
  );

  // ✅ Execute all updates in a transaction
  if (trialUpdates.length > 0 || activeUpdates.length > 0) {
    await prisma.$transaction([...trialUpdates, ...activeUpdates]);
  }

  const totalTrialsExpired = expiredTrials.length;
  const totalActiveExpired = activeUpdates.length;
  const totalExpired = totalTrialsExpired + totalActiveExpired;
  const userInfo = userId ? ` for user ${userId}` : " globally";

  console.log(
    `✅ Subscription expiry completed${userInfo}: ${totalTrialsExpired} trials expired, ${totalActiveExpired} active subscriptions expired (${totalExpired} total)`,
  );

  return {
    trialToActive: totalTrialsExpired,
    expiredTotal: totalExpired,
    details: {
      trialsExpired: totalTrialsExpired,
      activeExpired: totalActiveExpired,
    },
  };
}

// subscriber users
export async function getSubscriberUsers() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        not: "SUPER_ADMIN", // Exclude SUPER_ADMIN users
      },
    },
    include: {
      // Most recent plan subscription only — a user could have old
      // canceled ones, we only care about their current standing.
      planSubscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,

        include: { plan: { select: { title: true } } },
      },
      _count: {
        select: {
          uploadedFiles: true, // files THEY uploaded
          fileShares: true,
        }, // links THEY created
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => {
    const sub = u.planSubscriptions[0] ?? null;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      sharedFilesCount: u._count.fileShares,
      uploadedFilesCount: u._count.uploadedFiles,
      plan: sub
        ? {
            title: sub.plan.title,
            status: sub.status, // "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELED"
            billingCycle: sub.billingCycle,
            startsAt: sub.startsAt,
            canceledAt: sub.canceledAt,
            currentPeriodEnd: sub.currentPeriodEnd,
            trialEndsAt: sub.trialEndsAt,
          }
        : null,
    };
  });
}

// subscriber users details

export const getUserDetails = async (userId) => {
  const id = Number(userId);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          uploadedFiles: true, // Uploaded files count
          fileShares: true, // Shared links count
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const subscription = await prisma.planSubscription.findFirst({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    include: {
      plan: {
        select: {
          title: true,
          // billingCycle: true,
        },
      },
    },
  });

  const shares = await prisma.fileShareLink.findMany({
    where: {
      createdBy: id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      files: {
        include: {
          file: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  // Uploaded files
  const uploadedFiles = await prisma.uploadedFile.findMany({
    where: {
      uploadedBy: id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      originalName: true,
      category: true,
      mimeType: true,
      size: true,
      url: true,
      createdAt: true,
    },
  });

  return {
    user,

    plan: subscription
      ? {
          title: subscription.plan.title,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          startsAt: subscription.startsAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
          trialEndsAt: subscription.trialEndsAt,
        }
      : null,

    uploadedFiles,

    shares: shares.map((share) => ({
      shareId: share.id,
      sharedWith: share.sharedWith,
      createdAt: share.createdAt,
      viewedAt: share.viewedAt,
      zipDownloadedAt: share.zipDownloadedAt,
      fileCount: share.files.length,
      fileTitles: share.files.map((i) => i.file.title),
    })),
  };
};
