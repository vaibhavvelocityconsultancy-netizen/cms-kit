import "server-only";

import { prisma } from "@/src/app/lib/prisma";

const MEDIA_URL_PATTERN =
  /<img\b[^>]*\bsrc\s*=\s*["']https:\/\/ipdav\.com\/api\/media\/(\d+)["'][^>]*>/gi;

export async function enrichHtmlWithMediaDimensions(
  html: string,
): Promise<string> {
  const mediaIds = [
    ...new Set(
      [...html.matchAll(MEDIA_URL_PATTERN)].map((match) => Number(match[1])),
    ),
  ];

  if (mediaIds.length === 0) {
    return html;
  }

  const mediaItems = await prisma.media.findMany({
    where: {
      id: {
        in: mediaIds,
      },
    },
    select: {
      id: true,
      width: true,
      height: true,
    },
  });

  const dimensionsById = new Map(
    mediaItems.map((media) => [media.id, media]),
  );

  return html.replace(MEDIA_URL_PATTERN, (imgTag, mediaId) => {
    const media = dimensionsById.get(Number(mediaId));

    if (!media) {
      return imgTag;
    }

    let enrichedTag = imgTag;

    if (media.width != null && !/\bwidth\s*=/i.test(enrichedTag)) {
      enrichedTag = enrichedTag.replace(
        /\/?>$/,
        ` width="${media.width}"$&`,
      );
    }

    if (media.height != null && !/\bheight\s*=/i.test(enrichedTag)) {
      enrichedTag = enrichedTag.replace(
        /\/?>$/,
        ` height="${media.height}"$&`,
      );
    }

    return enrichedTag;
  });
}
