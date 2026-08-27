import { prisma } from "../../prisma";

const SETTINGS_ID = 1;

export async function searchContext(query, tenantId) {
  if (!query || query.trim() === "") {
    return [];
  }

  const settingWhere =
    tenantId !== undefined
      ? { tenantId }
      : {
          id: SETTINGS_ID,
        };

  const setting = await prisma.siteSettings.findUnique({
    where: settingWhere,
  });

  // search Disabled
  if (!setting?.showSearch) {
    return [];
  }

  let results = [];

  const baseWhere = {
    status: "PUBLISHED",
    ...(tenantId !== undefined ? { tenantId } : {}),
    OR: [
      {
        title: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        Content: {
          contains: query,
          mode: "insensitive",
        },
      },
    ],
  };

  if (setting.searchInPages) {
    const pages = await prisma.page.findMany({
      where: baseWhere,
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    results.push(...pages.map((page) => ({ ...page, type: "page" })));
  }

  if (setting.searchInPosts) {
    const posts = await prisma.post.findMany({
      where: baseWhere,
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    results.push(...posts.map((post) => ({ ...post, type: "post" })));
  }

  return results;
}
