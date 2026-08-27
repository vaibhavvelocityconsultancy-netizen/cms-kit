import { prisma } from "../../prisma.js";
import { clearRedirectCache } from "../../../../lib/redirectMiddleware";

// ─── Helpers ──────────────────────────────────────────────

function normalizeRedirectUrls({ sourceUrl, destinationUrl }) {
  return {
    sourceUrl: (sourceUrl || "").toLowerCase().replace(/\/$/, "") || "/",
    destinationUrl: (destinationUrl || "").toLowerCase(),
  };
}

async function findExistingBySource(sourceUrl) {
  return prisma.redirect.findUnique({ where: { sourceUrl } });
}

// ═══════════════════════════════════════════════════════════
// REDIRECT SERVICES
// ═══════════════════════════════════════════════════════════

export async function listRedirects({
  isActive,
  isAutoDetected,
  search,
  sortBy = "createdAt",
  order = "desc",
  tenantId,
}) {
  const where = {};

  if (tenantId !== undefined && tenantId !== null) {
    where.tenantId = tenantId;
  }
  if (isActive !== undefined && isActive !== null)
    where.isActive = isActive === "true";
  if (isAutoDetected !== undefined && isAutoDetected !== null)
    where.isAutoDetected = isAutoDetected === "true";
  if (search) {
    where.OR = [
      { sourceUrl: { contains: search, mode: "insensitive" } },
      { destinationUrl: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.redirect.findMany({
    where,
    orderBy: { [sortBy]: order },
    take: 100,
  });
}

export async function createRedirect(
  { sourceUrl, destinationUrl, statusCode = 301, description },
  tenantId,
) {
  if (!sourceUrl || !destinationUrl) {
    throw new ServiceError("Source and destination URLs are required", 400);
  }

  if (!tenantId) {
    throw new ServiceError("Tenant is required", 400);
  }

  if (![301, 302].includes(statusCode)) {
    throw new ServiceError("Status code must be 301 or 302", 400);
  }

  const normalized = normalizeRedirectUrls({ sourceUrl, destinationUrl });

  const existing = await findExistingBySource(normalized.sourceUrl);
  if (existing) {
    throw new ServiceError("This redirect already exists", 409);
  }

  const created = await prisma.redirect.create({
    data: {
      ...normalized,
      statusCode,
      description,
      isAutoDetected: false,
      tenantId,
    },
  });

  // Always clear cache on new redirect
  try {
    await clearRedirectCache();
  } catch (cacheError) {
    console.error("Failed to clear redirect cache:", cacheError);
  }

  return created;
}

export async function getRedirectById(id) {
  const redirect = await prisma.redirect.findUnique({ where: { id } });
  if (!redirect) {
    throw new ServiceError("Redirect not found", 404);
  }
  return redirect;
}

export async function updateRedirect(
  id,
  { sourceUrl, destinationUrl, statusCode, description, isActive },
) {
  try {
    const existing = await prisma.redirect.findUnique({ where: { id } });
    if (!existing) {
      throw new ServiceError("Redirect not found", 404);
    }

    const updateData = {};

    if (sourceUrl) {
      updateData.sourceUrl = normalizeRedirectUrls({ sourceUrl }).sourceUrl;
    }
    if (destinationUrl) {
      updateData.destinationUrl = destinationUrl.toLowerCase();
    }
    if (statusCode !== undefined) updateData.statusCode = statusCode;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    const updated = await prisma.redirect.update({
      where: { id },
      data: updateData,
    });

    // always clear, cache clear is cheap, correctness > micro-optimization
    try {
      await clearRedirectCache();
    } catch (cacheError) {
      console.error("Failed to clear redirect cache:", cacheError);
    }

    return updated;
  } catch (error) {
    if (error.code === "P2002") {
      throw new ServiceError("This redirect already exists", 409);
    }
    throw error;
  }
}
export async function deleteRedirect(id) {
  const deleted = await prisma.redirect.delete({ where: { id } });

  // Always clear cache on deletion
  try {
    await clearRedirectCache();
  } catch (cacheError) {
    console.error("Failed to clear redirect cache:", cacheError);
  }

  return deleted;
}

export async function listNotFoundLogs({ isResolved, limit = 50 }) {
  const where = {};
  if (isResolved !== undefined && isResolved !== null)
    where.isResolved = isResolved === "true";

  const cappedLimit = Math.min(limit, 100);

  const [logs, topMissing] = await Promise.all([
    prisma.notFoundLog.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: cappedLimit,
    }),
    prisma.notFoundLog.groupBy({
      by: ["path"],
      where: { isResolved: false },
      _count: true,
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
  ]);

  return { logs, topMissing };
}

export async function bulkImportRedirects(redirects, tenantId) {
  if (!Array.isArray(redirects)) {
    throw new ServiceError("Redirects must be an array", 400);
  }
  if (!tenantId) {
    throw new ServiceError("Tenant is required", 400);
  }

  let successCount = 0;
  const errors = [];

  for (let i = 0; i < redirects.length; i++) {
    const item = redirects[i];
    try {
      const normalized = normalizeRedirectUrls(item);

      if (
        !normalized.sourceUrl ||
        !normalized.destinationUrl ||
        (normalized.sourceUrl === "/" && !item.sourceUrl)
      ) {
        errors.push({ row: i + 1, error: "Missing source or destination URL" });
        continue;
      }

      const existing = await findExistingBySource(normalized.sourceUrl);
      if (existing) {
        errors.push({
          row: i + 1,
          error: "URL already exists",
          url: normalized.sourceUrl,
        });
        continue;
      }

      await prisma.redirect.create({
        data: {
          ...normalized,
          statusCode: item.statusCode || 301,
          description: item.description || null,
          tenantId,
        },
      });

      successCount++;
    } catch (error) {
      errors.push({ row: i + 1, error: error.message });
    }
  }

  return {
    total: redirects.length,
    success: successCount,
    failed: errors.length,
    errors: errors.slice(0, 20),
  };
}

export async function exportRedirectsCsv({ isActive }) {
  const where = {};
  if (isActive !== undefined && isActive !== null)
    where.isActive = isActive === "true";

  const redirects = await prisma.redirect.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const csvHeader =
    "Source URL,Destination URL,Status Code,Active,Description,Hit Count,Last Used\n";
  const csvRows = redirects
    .map(
      (r) =>
        `"${r.sourceUrl}","${r.destinationUrl}",${r.statusCode},${r.isActive},"${r.description || ""}",${r.hitCount},"${r.lastUsedAt?.toISOString() || ""}"`,
    )
    .join("\n");

  return csvHeader + csvRows;
}

// ─── Error class for service → route status mapping ────────

export class ServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

// ─── Chain / Circular Detection Helpers ─────────────────────

async function detectRedirectChains() {
  const redirects = await prisma.redirect.findMany({
    where: { isActive: true },
    select: { sourceUrl: true, destinationUrl: true },
  });

  const chains = [];

  for (const r1 of redirects) {
    for (const r2 of redirects) {
      if (r1.sourceUrl !== r2.sourceUrl && r1.destinationUrl === r2.sourceUrl) {
        chains.push({
          from: r1.sourceUrl,
          middle: r2.sourceUrl,
          to: r2.destinationUrl,
        });
      }
    }
  }

  return chains;
}

async function detectCircularRedirects() {
  const redirects = await prisma.redirect.findMany({
    where: { isActive: true },
    select: { sourceUrl: true, destinationUrl: true },
  });

  const circular = [];

  for (const r1 of redirects) {
    for (const r2 of redirects) {
      if (
        r1.sourceUrl === r2.destinationUrl &&
        r2.sourceUrl === r1.destinationUrl
      ) {
        circular.push([r1.sourceUrl, r2.sourceUrl]);
      }
    }
  }

  return circular;
}

// ═══════════════════════════════════════════════════════════
// STATS / RECOMMENDATIONS / HEALTH SERVICES
// ═══════════════════════════════════════════════════════════

export async function getRedirectStats() {
  const [redirects, redirectChains, circularRedirects] = await Promise.all([
    prisma.redirect.findMany({
      select: {
        id: true,
        statusCode: true,
        hitCount: true,
        isActive: true,
        isAutoDetected: true,
      },
    }),
    detectRedirectChains(),
    detectCircularRedirects(),
  ]);

  const total = redirects.length;
  const active = redirects.filter((r) => r.isActive).length;
  const permanent = redirects.filter((r) => r.statusCode === 301).length;
  const totalHits = redirects.reduce((sum, r) => sum + r.hitCount, 0);
  const autoDetected = redirects.filter((r) => r.isAutoDetected).length;
  const unused = redirects.filter((r) => r.hitCount === 0).length;

  const avgHitsPerRedirect =
    total > 0 ? parseFloat((totalHits / total).toFixed(1)) : 0;

  return {
    total,
    active,
    permanent,
    temporary: total - permanent,
    totalHits,
    avgHitsPerRedirect,
    autoDetected,
    unused,
    issues: {
      chains: redirectChains.length,
      circular: circularRedirects.length,
    },
  };
}

export async function getRedirectRecommendations() {
  const [chains, circular, unused, lowActivity, fourOFours] = await Promise.all(
    [
      detectRedirectChains(),
      detectCircularRedirects(),
      prisma.redirect.count({
        where: {
          hitCount: 0,
          isActive: true,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.redirect.count({
        where: { hitCount: { lt: 5 }, isActive: true },
      }),
      prisma.notFoundLog.count({
        where: {
          isResolved: false,
          occurredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ],
  );

  const recommendations = [];

  if (chains.length > 0) {
    recommendations.push({
      id: "chains",
      title: "Redirect Chains Found",
      description: `You have ${chains.length} redirect chain(s) (A→B→C). Consolidate to A→C for better performance.`,
      severity: "warning",
      count: chains.length,
      action: "Run fixRedirectChains()",
    });
  }

  if (circular.length > 0) {
    recommendations.push({
      id: "circular",
      title: "Circular Redirects",
      description: `Found ${circular.length} circular redirect(s) that could cause infinite loops.`,
      severity: "error",
      count: circular.length,
      action: "Delete or fix immediately",
    });
  }

  if (unused > 0) {
    recommendations.push({
      id: "unused",
      title: "Unused Redirects",
      description: `${unused} redirect(s) created in last 30 days with zero hits. Consider disabling or deleting.`,
      severity: "info",
      count: unused,
    });
  }

  if (lowActivity > 0) {
    recommendations.push({
      id: "low_activity",
      title: "Low Activity Redirects",
      description: `${lowActivity} redirect(s) have less than 5 hits. Review if still needed.`,
      severity: "info",
      count: lowActivity,
    });
  }

  if (fourOFours > 0) {
    recommendations.push({
      id: "404s",
      title: "Unresolved 404 Errors",
      description: `${fourOFours} 404 error(s) in last 7 days. Create redirects to fix these.`,
      severity: "warning",
      count: fourOFours,
      action: "Check 404s tab",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "all_good",
      title: "All Systems Optimal",
      description: "Your redirects are properly configured.",
      severity: "success",
    });
  }

  return recommendations;
}

export async function getRedirectHealth() {
  const [
    totalRedirects,
    activeRedirects,
    totalHits,
    last404,
    lastUsedRedirect,
  ] = await Promise.all([
    prisma.redirect.count(),
    prisma.redirect.count({ where: { isActive: true } }),
    prisma.redirect.aggregate({ _sum: { hitCount: true } }),
    prisma.notFoundLog.findFirst({ orderBy: { occurredAt: "desc" } }),
    prisma.redirect.findFirst({
      where: { lastUsedAt: { not: null } },
      orderBy: { lastUsedAt: "desc" },
    }),
  ]);

  return {
    totalRedirects,
    activeRedirects,
    totalHits: totalHits._sum.hitCount || 0,
    lastActivity: {
      last404: last404?.occurredAt,
      lastRedirect: lastUsedRedirect?.lastUsedAt,
    },
  };
}
