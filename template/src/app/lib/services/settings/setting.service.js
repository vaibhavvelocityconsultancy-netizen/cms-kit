import { prisma } from "../../prisma.js";
import { requirePermission } from "../../withPermission.js";

// GET SETTINGS
export async function getSettings() {
  // console.log("SETTINGS API HIT", new Date().toISOString());
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  let settings = await prisma.sitesettings.findUnique({
    where: { tenantId },
  });

  if (!settings) {
    settings = await prisma.sitesettings.create({
      data: {
        updatedAt: new Date(),
        tenant: {
          connect: { id: tenantId },
        },
      },
    });
  }

  return settings;
}

// UPDATE SETTINGS
export async function updateSettings(input) {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  await getSettings();

  // Validation
  if (input.homepageType === "page" && !input.homepagePageId) {
    throw new Error("Homepage page is required when homepage type is page");
  }

  if (
    input.homepagePageId &&
    input.postsPageId &&
    Number(input.homepagePageId) === Number(input.postsPageId)
  ) {
    throw new Error("Homepage and Posts Page cannot be the same");
  }

  return prisma.sitesettings.update({
    where: {
      tenantId,
    },

    data: {
      siteName: input.siteName,

      siteTagline: input.siteTagline,

      logo: input.logo,

      favicon: input.favicon,

      defaultMetaTitle: input.defaultMetaTitle,

      defaultMetaDescription: input.defaultMetaDescription,

      postsPerPage:
        input.postsPerPage !== undefined
          ? Number(input.postsPerPage)
          : undefined,

      homepageType: input.homepageType,

      homepagePageId:
        input.homepageType === "posts"
          ? null
          : input.homepagePageId !== undefined
            ? Number(input.homepagePageId)
            : undefined,

      postsPageId:
        input.homepageType === "posts"
          ? null
          : input.postsPageId !== undefined
            ? Number(input.postsPageId)
            : undefined,


      globalCss: input.globalCss,
      globalJs: input.globalJs,

      showAdminToolbar:
        input.showAdminToolbar !== undefined
          ? Boolean(input.showAdminToolbar)
          : undefined,


      highlightAutoLinks:
        input.highlightAutoLinks !== undefined
          ? Boolean(input.highlightAutoLinks)
          : undefined,


      seoEnabled:
        input.seoEnabled !== undefined ? Boolean(input.seoEnabled) : undefined,

    },
  });
}

function normalizeCustomCrawlers(input) {
  if (!Array.isArray(input)) return [];

  const normalized = input
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      userAgent:
        typeof item.userAgent === "string" ? item.userAgent.trim() : "",
      enabled: Boolean(item.enabled),
    }))
    .filter((item) => item.userAgent);

  const seen = new Set();
  return normalized.filter((item) => {
    const key = item.userAgent.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseCustomCrawlers(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return normalizeCustomCrawlers(parsed);
  } catch {
    return [];
  }
}

const BUILT_IN_AI_CRAWLERS = new Set([
  "gptbot",
  "chatgpt-user",
  "perplexitybot",
  "claudebot",
  "google-extended",
]);

function parseCustomCrawlersFromRobots(content) {
  if (!content) return [];

  const crawlers = [];
  const blockRegex =
    /# AI crawler:\s*([^\r\n]+)[\s\S]*?User-agent:\s*([^\r\n]+)[\s\S]*?(Allow|Disallow):\s*\/[\s\S]*?# End AI crawler:\s*\1/gi;

  for (const match of content.matchAll(blockRegex)) {
    const userAgent = (match[2] || match[1] || "").trim();
    if (!userAgent || BUILT_IN_AI_CRAWLERS.has(userAgent.toLowerCase())) {
      continue;
    }

    crawlers.push({
      userAgent,
      enabled: match[3].toLowerCase() === "allow",
    });
  }

  return normalizeCustomCrawlers(crawlers);
}

export async function getRobotsSettings() {
  const settings = await getSettings();
  const customCrawlers = parseCustomCrawlers(settings.customCrawlerRules);

  return {
    robotsEnabled: settings.robotsEnabled,
    robotsContent: settings.robotsContent,
    customCrawlers: customCrawlers.length
      ? customCrawlers
      : parseCustomCrawlersFromRobots(settings.robotsContent),
  };
}

export async function updateRobotsSettings(input) {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  const existingSettings = await prisma.sitesettings.findUnique({
    where: { tenantId },
  });

  if (!existingSettings) {
    await prisma.sitesettings.create({
      data: {
        updatedAt: new Date(),
        tenant: {
          connect: { id: tenantId },
        },
      },
    });
  }

  const customCrawlers = normalizeCustomCrawlers(input.customCrawlers);

  const settings = await prisma.sitesettings.update({
    where: { tenantId },
    data: {
      robotsEnabled: Boolean(input.robotsEnabled),
      robotsContent: input.robotsContent?.trim() || null,
      customCrawlerRules: customCrawlers.length
        ? JSON.stringify(customCrawlers)
        : null,
    },
  });

  return {
    ...settings,
    customCrawlers,
  };
}
