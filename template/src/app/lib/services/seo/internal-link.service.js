import * as cheerio from "cheerio";
import { prisma } from "../../prisma";
import { requirePermission } from "../../withPermission";
import { normalizeURL } from "../../utils/redirectUtils";

const ALWAYS_SKIP_SELECTOR = "script, style, textarea, code, pre";
const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";
const VALID_DESTINATION_TYPES = [
  "page",
  "post",
  "category",
  "tag",
  "course",
  "custom",
];

// ─── Helpers ──────────────────────────────────────────────

function toPlainText(html) {
  const $ = cheerio.load(html || "", null, false);
  $(ALWAYS_SKIP_SELECTOR).remove();
  return $.root().text().replace(/\s+/g, " ").trim();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildKeywordRegex(keyword, { wholeWordOnly, caseSensitive }) {
  const escaped = escapeRegex(keyword);
  const pattern = wholeWordOnly ? `(?<![\\w])${escaped}(?![\\w])` : escaped;
  return new RegExp(pattern, caseSensitive ? "g" : "gi");
}

function isInsideMarkdownLinkLabel(text, start, end) {
  const openBracket = text.lastIndexOf("[", start);
  if (openBracket === -1) return false;

  const closeBracket = text.indexOf("]", end);
  if (closeBracket === -1) return false;

  const hasClosingBracketBeforeMatch = text
    .slice(openBracket + 1, start)
    .includes("]");
  if (hasClosingBracketBeforeMatch) return false;

  return text.slice(closeBracket, closeBracket + 2) === "](";
}

function isSafeUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  );
}

// Extract a snippet of text around the keyword match
// Returns the phrase with surrounding context (up to 75 chars on each side)
function extractSnippet(text, matchStart, matchEnd) {
  const contextLength = 75;
  const snippetStart = Math.max(0, matchStart - contextLength);
  const snippetEnd = Math.min(text.length, matchEnd + contextLength);

  let snippet = text.substring(snippetStart, snippetEnd).trim();

  // Add ellipsis if we trimmed
  if (snippetStart > 0) snippet = "..." + snippet;
  if (snippetEnd < text.length) snippet = snippet + "...";

  return snippet;
}

// Simple semantic relevance scorer (0-100)
// Can be replaced with embeddings or AI API for better accuracy
function scoreRelevance(sourceTitle, destTitle, keywordInSource) {
  let score = 50; // baseline

  // Exact phrase match bonus
  if (destTitle.toLowerCase().includes(keywordInSource.toLowerCase())) {
    score += 25;
  }

  // Length similarity bonus (titles of similar length often relate)
  const lenDiff = Math.abs(sourceTitle.length - destTitle.length);
  if (lenDiff < 20) score += 10;
  if (lenDiff < 10) score += 5;

  // Word overlap bonus
  const sourceWords = new Set(sourceTitle.toLowerCase().split(/\s+/));
  const destWords = destTitle.toLowerCase().split(/\s+/);
  const overlap = destWords.filter((w) => sourceWords.has(w)).length;
  if (overlap > 0) score += Math.min(overlap * 5, 15);

  return Math.min(score, 100);
}

// ─── Validation ───────────────────────────────────────────

async function validateRule(input, tenantId, excludeId = null) {
  if (!input.keyword?.trim()) {
    throw new Error("Keyword is required");
  }

  const destinationType = input.destinationType ?? "custom";
  if (!VALID_DESTINATION_TYPES.includes(destinationType)) {
    throw new Error(`Invalid destinationType "${destinationType}"`);
  }

  if (destinationType !== "custom" && !input.destinationId) {
    throw new Error(`destinationId is required for type "${destinationType}"`);
  }

  if (destinationType === "custom") {
    if (!input.destinationUrl?.trim()) {
      throw new Error("destinationUrl is required for custom links");
    }
    if (!isSafeUrl(input.destinationUrl)) {
      throw new Error(
        "destinationUrl must start with '/', 'http://' or 'https://'",
      );
    }
  }

  switch (destinationType) {
    case "page": {
      const page = await prisma.page.findFirst({
        where: { id: Number(input.destinationId), tenantId },
      });
      if (!page) throw new Error("Destination page not found");
      break;
    }
    case "course": {
      const course = await prisma.course.findFirst({
        where: { id: input.destinationId, tenantId },
      });
      if (!course) throw new Error("Destination course not found");
      break;
    }
    case "post": {
      const post = await prisma.post.findFirst({
        where: { id: String(input.destinationId), tenantId },
      });
      if (!post) throw new Error("Destination post not found");
      break;
    }
    case "category": {
      const category = await prisma.category.findFirst({
        where: { id: String(input.destinationId), tenantId },
      });
      if (!category) throw new Error("Destination category not found");
      break;
    }
    case "tag": {
      const tag = await prisma.tag.findFirst({
        where: { id: String(input.destinationId), tenantId },
      });
      if (!tag) throw new Error("Destination tag not found");
      break;
    }
    case "custom":
      break;
  }

  const dupe = await prisma.internalLinkRule.findFirst({
    where: {
      tenantId,
      keyword: { equals: input.keyword.trim(), mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (dupe)
    throw new Error(`A rule for keyword "${input.keyword}" already exists`);

  return {
    ...input,
    keyword: input.keyword.trim(),
    destinationType,
    destinationId:
      destinationType === "custom" || input.destinationId == null
        ? null
        : String(input.destinationId),
  };
}

function validateBehaviorFields(input) {
  if (input.maxLinksPerPage !== undefined && input.maxLinksPerPage < 1) {
    throw new Error("maxLinksPerPage must be at least 1");
  }
  if (input.priority !== undefined && !Number.isInteger(input.priority)) {
    throw new Error("priority must be an integer");
  }
  if (
    input.linkTitle !== undefined &&
    input.linkTitle !== null &&
    typeof input.linkTitle !== "string"
  ) {
    throw new Error("linkTitle must be a string");
  }
}

async function createRedirectForRule(tenantId, rule) {
  if (!rule || !rule.keyword) return;

  const sourceUrl = normalizeURL(`/${rule.keyword}`.toLowerCase());
  const destinationUrl = normalizeURL(
    rule.destinationType === "custom" && rule.destinationUrl
      ? rule.destinationUrl
      : rule.destinationId
        ? await resolveDestinationUrl(rule, tenantId)
        : "",
  );

  if (!destinationUrl || destinationUrl === "#") return;
  if (!sourceUrl || sourceUrl === destinationUrl) return;

  // Safety check: don't hijack a URL that belongs to a real, live page/post
  const collidesWithLivePage = await urlBelongsToLiveContent(
    sourceUrl,
    tenantId,
  );
  if (collidesWithLivePage) {
    console.warn(
      `Skipped auto-redirect for keyword "${rule.keyword}" — ` +
        `"${sourceUrl}" matches an existing live page/post URL.`,
    );
    return;
  }

  try {
    await prisma.redirect.create({
      data: {
        tenantId,
        sourceUrl,
        destinationUrl,
        statusCode: 301,
        description: `Auto-created from internal link rule: ${rule.keyword}`,
        isAutoDetected: true,
      },
    });
  } catch (error) {
    if (!String(error?.message || "").includes("Unique constraint")) {
      console.error("Failed to create redirect for internal link rule:", error);
    }
  }
}

// New helper — checks if a URL path matches a real, live page or post
async function urlBelongsToLiveContent(url, tenantId) {
  const cleanPath = url.replace(/^\//, "").split("?")[0];
  if (!cleanPath) return false;

  const [page, post] = await Promise.all([
    prisma.page.findFirst({
      where: { tenantId, slug: cleanPath, status: "PUBLISHED" },
      select: { id: true },
    }),
    prisma.post.findFirst({
      where: { tenantId, slug: cleanPath, status: "PUBLISHED" },
      select: { id: true },
    }),
  ]);

  return Boolean(page || post);
}

// ─── CRUD ─────────────────────────────────────────────────

export async function getInternalLinkRules() {
  const { session } = await requirePermission("seo_manage");
  const tenantId = session.user.tenantId;

  return prisma.internalLinkRule.findMany({
    where: { tenantId },
    orderBy: { priority: "desc" },
  });
}

export async function getInternalLinkRule(id) {
  const { session } = await requirePermission("seo_manage");
  const tenantId = session.user.tenantId;

  const rule = await prisma.internalLinkRule.findFirst({
    where: { id, tenantId },
  });
  if (!rule) throw new Error("Rule not found");
  return rule;
}

export async function createInternalLinkRule(input) {
  const { session } = await requirePermission("seo_manage");
  const tenantId = session.user.tenantId;

  const clean = await validateRule(input, tenantId);

  const createdRule = await prisma.internalLinkRule.create({
    data: {
      tenantId,
      keyword: clean.keyword,
      destinationType: clean.destinationType,
      destinationId: clean.destinationId ?? null,
      destinationUrl: clean.destinationUrl ?? "",
      linkTitle: clean.linkTitle ?? null,
      openInNewTab: clean.openInNewTab ?? false,
      enabled: clean.enabled ?? true,
      wholeWordOnly: clean.wholeWordOnly ?? true,
      caseSensitive: clean.caseSensitive ?? false,
      firstOccurrenceOnly: clean.firstOccurrenceOnly ?? false,
      ignoreHeadings: clean.ignoreHeadings ?? true,
      ignoreExistingLinks: clean.ignoreExistingLinks ?? true,
      maxLinksPerPage: clean.maxLinksPerPage ?? 1,
      priority: clean.priority ?? 0,
    },
  });

  await createRedirectForRule(tenantId, createdRule);
  return createdRule;
}

export async function updateInternalLinkRule(id, input) {
  const { session } = await requirePermission("seo_manage");
  const tenantId = session.user.tenantId;

  const existing = await prisma.internalLinkRule.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new Error("Rule not found");

  const keywordChanged =
    input.keyword !== undefined &&
    input.keyword.trim().toLowerCase() !== existing.keyword.toLowerCase();

  const destinationChanged =
    (input.destinationType !== undefined &&
      input.destinationType !== existing.destinationType) ||
    (input.destinationId !== undefined &&
      input.destinationId !== existing.destinationId) ||
    (input.destinationUrl !== undefined &&
      input.destinationUrl !== existing.destinationUrl);

  if (keywordChanged || destinationChanged) {
    const merged = { ...existing, ...input };
    const clean = await validateRule(merged, tenantId, id);
    const updatedRule = await prisma.internalLinkRule.update({
      where: { id },
      data: clean,
    });
    await createRedirectForRule(tenantId, updatedRule);
    return updatedRule;
  }

  validateBehaviorFields(input);
  return prisma.internalLinkRule.update({ where: { id }, data: input });
}

export async function deleteInternalLinkRule(id) {
  const { session } = await requirePermission("seo_manage");
  const tenantId = session.user.tenantId;

  const existing = await prisma.internalLinkRule.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new Error("Rule not found");

  return prisma.internalLinkRule.delete({ where: { id } });
}

export async function toggleInternalLinkRule(id) {
  const { session } = await requirePermission("seo_manage");
  const tenantId = session.user.tenantId;

  const existing = await prisma.internalLinkRule.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new Error("Rule not found");

  return prisma.internalLinkRule.update({
    where: { id },
    data: { enabled: !existing.enabled },
  });
}

export async function resolveDestinationUrl(rule, tenantId) {
  if (rule.destinationType === "custom" || !rule.destinationId) {
    return isSafeUrl(rule.destinationUrl) ? rule.destinationUrl : "#";
  }

  switch (rule.destinationType) {
    case "page": {
      const page = await prisma.page.findFirst({
        where: { id: Number(rule.destinationId), tenantId },
      });
      if (!page) return rule.destinationUrl;
      return page.slug === "home" ? "/" : `/${page.slug}`;
    }
    case "course": {
      const course = await prisma.course.findFirst({
        where: { id: rule.destinationId, tenantId },
      });
      return course ? `/courses/${course.slug}` : rule.destinationUrl;
    }
    case "post": {
      const post = await prisma.post.findFirst({
        where: { id: rule.destinationId, tenantId },
      });
      return post ? `/posts/${post.slug}` : rule.destinationUrl;
    }
    case "category": {
      const category = await prisma.category.findFirst({
        where: { id: rule.destinationId, tenantId },
      });
      return category
        ? `/posts?category=${category.slug}`
        : rule.destinationUrl;
    }
    case "tag": {
      const tag = await prisma.tag.findFirst({
        where: { id: rule.destinationId, tenantId },
      });
      return tag ? `/posts?tag=${tag.slug}` : rule.destinationUrl;
    }
    default:
      return isSafeUrl(rule.destinationUrl) ? rule.destinationUrl : "#";
  }
}

export async function processInternalLinks(html, tenantId) {
  if (!html) return html;
  if (!prisma.internalLinkRule) return html;

  const rules = await prisma.internalLinkRule.findMany({
    where: { tenantId, enabled: true },
    orderBy: { priority: "desc" },
  });
  if (!rules.length) return html;

  const resolvedRules = (
    await Promise.all(
      rules.map(async (rule) => ({
        ...rule,
        resolvedUrl: await resolveDestinationUrl(rule, tenantId),
      })),
    )
  )
    .filter((rule) => isSafeUrl(rule.resolvedUrl) || rule.resolvedUrl === "#")
    // Longer keywords win first, then higher priority
    .sort(
      (a, b) => b.keyword.length - a.keyword.length || b.priority - a.priority,
    );

  const $ = cheerio.load(html, null, false);
  const linkCounts = new Map(resolvedRules.map((r) => [r.id, 0]));

  $("*")
    .contents()
    .filter(function () {
      return this.type === "text";
    })
    .each(function () {
      const $parent = $(this).parent();
      if ($parent.closest(ALWAYS_SKIP_SELECTOR).length) return;

      const insideHeading = $parent.closest(HEADING_SELECTOR).length > 0;
      const insideAnchor = $parent.closest("a").length > 0;

      const text = $(this).text();
      if (!text.trim()) return;

      // Step 1: Collect ALL candidate matches from ALL rules,
      // always scanning the ORIGINAL plain text (never modified text)
      const candidates = [];

      for (const rule of resolvedRules) {
        if (rule.ignoreHeadings && insideHeading) continue;
        if (rule.ignoreExistingLinks && insideAnchor) continue;

        const re = buildKeywordRegex(rule.keyword, {
          wholeWordOnly: rule.wholeWordOnly,
          caseSensitive: rule.caseSensitive,
        });

        let match;
        while ((match = re.exec(text)) !== null) {
          candidates.push({
            rule,
            start: match.index,
            end: match.index + match[0].length,
            matchText: match[0],
          });
          // Prevent infinite loop on zero-length matches
          if (match[0].length === 0) re.lastIndex++;
        }
      }

      if (!candidates.length) return;

      // Step 2: Sort candidates by rule priority order (already reflected
      // in resolvedRules order), then by position in text.
      // Since resolvedRules is sorted longest-keyword-first, we sort
      // candidates the same way so longer/higher-priority matches claim
      // their range before shorter ones can steal part of it.
      const ruleRank = new Map(resolvedRules.map((r, i) => [r.id, i]));
      candidates.sort((a, b) => {
        const rankDiff = ruleRank.get(a.rule.id) - ruleRank.get(b.rule.id);
        if (rankDiff !== 0) return rankDiff;
        return a.start - b.start;
      });

      // Step 3: Walk candidates, accept non-overlapping ones only,
      // respecting maxLinksPerPage / firstOccurrenceOnly per rule.
      const accepted = [];
      const takenRanges = []; // [start, end] pairs already claimed

      const overlaps = (start, end) =>
        takenRanges.some((r) => start < r[1] && end > r[0]);

      for (const c of candidates) {
        if (overlaps(c.start, c.end)) continue;

        const already = linkCounts.get(c.rule.id) ?? 0;
        if (already >= c.rule.maxLinksPerPage) continue;
        if (c.rule.firstOccurrenceOnly && already >= 1) continue;

        linkCounts.set(c.rule.id, already + 1);
        takenRanges.push([c.start, c.end]);
        accepted.push(c);
      }

      if (!accepted.length) return;

      // Step 4: Build the final string in ONE pass, left to right,
      // over the ORIGINAL text — so no rule ever scans HTML.
      accepted.sort((a, b) => a.start - b.start);

      let result = "";
      let cursor = 0;

      for (const c of accepted) {
        result += text.slice(cursor, c.start);

        const attrs = [
          `href="${c.rule.resolvedUrl}"`,
          `class="auto-internal-link"`,
          `rel="internal"`,
          c.rule.linkTitle
            ? `title="${c.rule.linkTitle.replace(/"/g, "&quot;")}"`
            : null,
          c.rule.openInNewTab
            ? `target="_blank" rel="internal noopener noreferrer"`
            : null,
        ]
          .filter(Boolean)
          .join(" ");

        result += `<a ${attrs}>${c.matchText}</a>`;
        cursor = c.end;
      }

      result += text.slice(cursor);

      $(this).replaceWith($.parseHTML(result));
    });

  return $.html();
}

// ─── NEW: Rank Math-style suggestions with snippets ──────

// Extract all occurrences of keywords with surrounding text context
function extractPhraseOccurrences(text, keyword) {
  const occurrences = [];
  const re = buildKeywordRegex(keyword, {
    wholeWordOnly: true,
    caseSensitive: false,
  });

  let match;
  while ((match = re.exec(text)) !== null) {
    const snippet = extractSnippet(text, match.index, re.lastIndex, keyword);
    occurrences.push({
      phrase: match[0],
      snippet,
      position: match.index,
    });
  }

  return occurrences;
}

export async function suggestInternalLinkTargetsWithPhrases(
  sourceType,
  sourceId,
  sourceTitle,
) {
  const { session } = await requirePermission("seo_manage");
  const tenantId = session.user.tenantId;

  const source =
    sourceType === "page"
      ? await prisma.page.findFirst({
          where: { id: Number(sourceId), tenantId },
          select: { id: true, html: true },
        })
      : await prisma.post.findFirst({
          where: { id: String(sourceId), tenantId },
          select: { id: true, content: true },
        });

  if (!source) throw new Error("Source content not found");

  const sourceText = toPlainText(
    sourceType === "page" ? source.html : source.content,
  );

  const [pages, posts] = await Promise.all([
    prisma.page.findMany({
      where: {
        tenantId,
        status: "PUBLISHED",
        ...(sourceType === "page" ? { id: { not: Number(sourceId) } } : {}),
      },
      select: { id: true, title: true, slug: true },
    }),
    prisma.post.findMany({
      where: {
        tenantId,
        status: "PUBLISHED",
        ...(sourceType === "post" ? { id: { not: String(sourceId) } } : {}),
      },
      select: { id: true, title: true, slug: true },
    }),
  ]);

  const existingKeywords = new Set(
    (
      await prisma.internalLinkRule.findMany({
        where: { tenantId },
        select: { keyword: true },
      })
    ).map((rule) => rule.keyword.toLowerCase()),
  );

  const candidates = [
    ...pages.map((p) => ({
      destinationType: "page",
      destinationId: String(p.id),
      destTitle: p.title,
      slug: p.slug,
    })),
    ...posts.map((p) => ({
      destinationType: "post",
      destinationId: String(p.id),
      destTitle: p.title,
      slug: p.slug,
    })),
  ];

  const suggestions = candidates
    .filter((c) => c.destTitle)
    .map((c) => {
      const phrases = extractPhraseOccurrences(sourceText, c.destTitle);

      // Use the actual matched phrase text, not destTitle again
      const bestMatchPhrase = phrases.length > 0 ? phrases[0].phrase : "";
      const relevanceScore = scoreRelevance(
        sourceTitle,
        c.destTitle,
        bestMatchPhrase,
      );

      return {
        keyword: c.destTitle,
        destinationType: c.destinationType,
        destinationId: c.destinationId,
        destTitle: c.destTitle,
        resolvedUrl:
          c.destinationType === "page"
            ? c.slug === "home"
              ? "/"
              : `/${c.slug}`
            : `/posts/${c.slug}`,
        relevanceScore,
        phrases,
        linked: existingKeywords.has(c.destTitle.toLowerCase()),
      };
    })
    .filter((s) => s.phrases.length > 0)
    .sort((a, b) => {
      if (a.linked !== b.linked) return a.linked ? 1 : -1;
      return b.relevanceScore - a.relevanceScore;
    });
  return suggestions;
}

// Keep original for backward compatibility
export async function suggestInternalLinkTargets(sourceType, sourceId) {
  const { session } = await requirePermission("seo_manage");
  const tenantId = session.user.tenantId;

  const source =
    sourceType === "page"
      ? await prisma.page.findFirst({
          where: { id: Number(sourceId), tenantId },
          select: { id: true, html: true },
        })
      : await prisma.post.findFirst({
          where: { id: String(sourceId), tenantId },
          select: { id: true, content: true },
        });

  if (!source) throw new Error("Source content not found");

  const sourceText = toPlainText(
    sourceType === "page" ? source.html : source.content,
  );

  const [pages, posts] = await Promise.all([
    prisma.page.findMany({
      where: {
        tenantId,
        status: "PUBLISHED",
        ...(sourceType === "page" ? { id: { not: Number(sourceId) } } : {}),
      },
      select: { id: true, title: true, slug: true },
    }),
    prisma.post.findMany({
      where: {
        tenantId,
        status: "PUBLISHED",
        ...(sourceType === "post" ? { id: { not: String(sourceId) } } : {}),
      },
      select: { id: true, title: true, slug: true },
    }),
  ]);

  const existingKeywords = new Set(
    (
      await prisma.internalLinkRule.findMany({
        where: { tenantId },
        select: { keyword: true },
      })
    ).map((rule) => rule.keyword.toLowerCase()),
  );

  const candidates = [
    ...pages.map((p) => ({
      destinationType: "page",
      destinationId: String(p.id),
      title: p.title,
      slug: p.slug,
    })),
    ...posts.map((p) => ({
      destinationType: "post",
      destinationId: String(p.id),
      title: p.title,
      slug: p.slug,
    })),
  ];

  const suggestions = candidates
    .filter((c) => c.title)
    .filter((c) =>
      buildKeywordRegex(c.title, {
        wholeWordOnly: true,
        caseSensitive: false,
      }).test(sourceText),
    )
    .map((c) => ({
      keyword: c.title,
      destinationType: c.destinationType,
      destinationId: c.destinationId,
      resolvedUrl:
        c.destinationType === "page"
          ? c.slug === "home"
            ? "/"
            : `/${c.slug}`
          : `/posts/${c.slug}`,
      linked: existingKeywords.has(c.title.toLowerCase()),
    }))
    .sort((a, b) => {
      if (a.linked !== b.linked) return a.linked ? 1 : -1;
      return b.keyword.length - a.keyword.length;
    });

  return suggestions;
}

export async function getLinkableContentList() {
  const { session } = await requirePermission("seo_manage");
  const tenantId = session.user.tenantId;

  const [pages, posts] = await Promise.all([
    prisma.page.findMany({
      where: { tenantId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.post.findMany({
      where: { tenantId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return [
    ...pages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      published: p.status === "PUBLISHED",
      updatedAt: p.updatedAt,
      type: "page",
    })),
    ...posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      published: p.status === "PUBLISHED",
      updatedAt: p.updatedAt,
      type: "post",
    })),
  ].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
