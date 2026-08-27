// lib/utils/redirectUtils.ts
// import prisma from '@/lib/prisma';

import { prisma } from "../prisma";

/**
 * Validate redirect URLs
 */
export function validateRedirectURL(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const normalized = url.toLowerCase().trim();

  // Check for basic URL format
  if (normalized.startsWith('/')) {
    // Internal path
    return { valid: true };
  }

  // Check for external URL
  try {
    new URL(normalized);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Normalize URL for storage (consistent format)
 */
export function normalizeURL(url: string): string {
  const trimmed = url.toLowerCase().trim();
  
  if (trimmed.startsWith('/')) {
    // Internal path: remove trailing slash
    return trimmed.replace(/\/$/, '') || '/';
  }

  // External URL: keep as-is
  return trimmed;
}

/**
 * Parse CSV redirects file
 */
export function parseRedirectsCSV(csvContent: string) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map((h) => h.toLowerCase().trim());

  if (!headers.includes('source url') || !headers.includes('destination url')) {
    throw new Error('CSV must have "Source URL" and "Destination URL" columns');
  }

  const redirects = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const sourceIdx = headers.indexOf('source url');
    const destIdx = headers.indexOf('destination url');
    const statusIdx = headers.indexOf('status code');
    const descIdx = headers.indexOf('description');

    const sourceUrl = values[sourceIdx]?.trim();
    const destinationUrl = values[destIdx]?.trim();

    if (!sourceUrl || !destinationUrl) {
      continue;
    }

    redirects.push({
      sourceUrl: normalizeURL(sourceUrl),
      destinationUrl: normalizeURL(destinationUrl),
      statusCode: parseInt(values[statusIdx]) || 301,
      description: values[descIdx]?.trim() || null,
    });
  }

  return redirects;
}

/**
 * Parse CSV line with quoted values
 */
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Generate CSV export content
 */
export function generateRedirectsCSV(redirects: any[]): string {
  const headers = ['Source URL', 'Destination URL', 'Status Code', 'Active', 'Description'];
  const csvHeader = headers.join(',') + '\n';

  const csvRows = redirects
    .map((r) => {
      const row = [
        `"${r.sourceUrl}"`,
        `"${r.destinationUrl}"`,
        r.statusCode,
        r.isActive ? 'true' : 'false',
        `"${r.description || ''}"`,
      ];
      return row.join(',');
    })
    .join('\n');

  return csvHeader + csvRows;
}

/**
 * Detect broken redirect chains (A→B→C)
 */
export async function detectRedirectChains() {
  const redirects = await prisma.redirect.findMany({
    where: { isActive: true },
    select: { id: true, sourceUrl: true, destinationUrl: true },
  });

  const chains = [];

  for (const redirect of redirects) {
    const targetRedirect = redirects.find((r) => r.sourceUrl === redirect.destinationUrl);
    if (targetRedirect) {
      chains.push({
        from: redirect.sourceUrl,
        middle: targetRedirect.sourceUrl,
        to: targetRedirect.destinationUrl,
        ids: [redirect.id, targetRedirect.id],
      });
    }
  }

  return chains;
}

/**
 * Auto-fix redirect chains
 */
export async function fixRedirectChains() {
  const chains = await detectRedirectChains();
  let fixed = 0;

  for (const chain of chains) {
    try {
      await prisma.redirect.update({
        where: { id: chain.ids[0] },
        data: { destinationUrl: chain.to },
      });
      fixed++;
    } catch (error) {
      console.error('Failed to fix chain:', error);
    }
  }

  return { totalChains: chains.length, fixed };
}

/**
 * Get 404 statistics
 */
export async function get404Statistics(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [total, unresolved, topPaths] = await Promise.all([
    prisma.notFoundLog.count({
      where: { occurredAt: { gte: since } },
    }),
    prisma.notFoundLog.count({
      where: { occurredAt: { gte: since }, isResolved: false },
    }),
    prisma.notFoundLog.groupBy({
      by: ['path'],
      where: { occurredAt: { gte: since } },
      _count: true,
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    total,
    unresolved,
    resolvedPercentage: ((total - unresolved) / total * 100).toFixed(1),
    topPaths: topPaths.map((p) => ({
      path: p.path,
      count: p._count,
    })),
  };
}

/**
 * Get redirect effectiveness stats
 */
export async function getRedirectStats() {
  const redirects = await prisma.redirect.findMany({
    select: {
      id: true,
      statusCode: true,
      hitCount: true,
      isActive: true,
      isAutoDetected: true,
    },
  });

  const total = redirects.length;
  const active = redirects.filter((r) => r.isActive).length;
  const permanent = redirects.filter((r) => r.statusCode === 301).length;
  const totalHits = redirects.reduce((sum, r) => sum + r.hitCount, 0);
  const autoDetected = redirects.filter((r) => r.isAutoDetected).length;
  const avgHitsPerRedirect = total > 0 ? (totalHits / total).toFixed(1) : 0;

  return {
    total,
    active,
    permanent,
    temporary: total - permanent,
    totalHits,
    avgHitsPerRedirect,
    autoDetected,
    unused: redirects.filter((r) => r.hitCount === 0).length,
  };
}

/**
 * Find redirects that might be needed based on 404 patterns
 */
export async function suggestRedirects(limit = 10) {
  const suggestions = await prisma.notFoundLog.groupBy({
    by: ['path'],
    where: { isResolved: false },
    _count: true,
    orderBy: { _count: { path: 'desc' } },
    take: limit,
  });

  return suggestions.map((s) => ({
    missingPath: s.path,
    occurrences: s._count,
    suggestedType: s._count > 5 ? '301' : '302',
    note: `${s._count} users tried to access this page`,
  }));
}

/**
 * Bulk operations
 */
export async function bulkToggleRedirects(ids: string[], isActive: boolean) {
  const result = await prisma.redirect.updateMany({
    where: { id: { in: ids } },
    data: { isActive },
  });
  return result.count;
}

export async function bulkDeleteRedirects(ids: string[]) {
  const result = await prisma.redirect.deleteMany({
    where: { id: { in: ids } },
  });
  return result.count;
}

export async function bulkUpdateStatusCode(ids: string[], statusCode: number) {
  const result = await prisma.redirect.updateMany({
    where: { id: { in: ids } },
    data: { statusCode },
  });
  return result.count;
}

/**
 * Check for circular redirects (A→B→A)
 */
export async function detectCircularRedirects() {
  const redirects = await prisma.redirect.findMany({
    select: { sourceUrl: true, destinationUrl: true },
  });

  const circular = [];

  for (const r1 of redirects) {
    for (const r2 of redirects) {
      if (r1.sourceUrl === r2.destinationUrl && r2.sourceUrl === r1.destinationUrl) {
        circular.push([r1.sourceUrl, r2.sourceUrl]);
      }
    }
  }

  return circular;
}

/**
 * Create redirects from old page slugs (e.g., when renaming pages)
 */
export async function createBulkRedirectsFromRename(
  oldPages: Array<{ oldSlug: string; newSlug: string }>,
  baseUrl = '/'
) {
  const created = [];
  const errors = [];

  for (const page of oldPages) {
    try {
      const sourceUrl = normalizeURL(`${baseUrl}${page.oldSlug}`);
      const destinationUrl = normalizeURL(`${baseUrl}${page.newSlug}`);

      // Check if already exists
      const existing = await prisma.redirect.findUnique({
        where: { sourceUrl },
      });

      if (!existing) {
        await prisma.redirect.create({
          data: {
            sourceUrl,
            destinationUrl,
            statusCode: 301,
            description: `Auto-created from page rename: ${page.oldSlug} → ${page.newSlug}`,
          },
        });
        created.push(sourceUrl);
      }
    } catch (error: any) {
      errors.push({ page, error: error.message });
    }
  }

  return { created: created.length, errors };
}