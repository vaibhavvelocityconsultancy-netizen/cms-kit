import { prisma } from "../../prisma";

export async function searchPublishedContent(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const q = query.trim();

  const [pages, posts] = await Promise.all([
    prisma.page.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ title: { contains: q } }, { searchText: { contains: q } }],
      },
      select: { id: true, title: true, slug: true, searchText: true },
      take: 10,
    }),
    prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ title: { contains: q } }, { searchText: { contains: q } }],
      },
      select: { id: true, title: true, slug: true, searchText: true },
      take: 10,
    }),
  ]);

  return [
    ...pages.map((p) => ({
      ...p,
      type: "page",
      excerpt: buildExcerpt(p.searchText, q),
    })),
    ...posts.map((p) => ({
      ...p,
      type: "post",
      excerpt: buildExcerpt(p.searchText, q),
    })),
  ];
}

function buildExcerpt(text, query, radius = 60) {
  if (!text) return "";
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2) + "...";
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  return (
    (start > 0 ? "..." : "") +
    text.slice(start, end) +
    (end < text.length ? "..." : "")
  );
}
