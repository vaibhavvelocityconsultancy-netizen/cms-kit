import * as cheerio from "cheerio";
import { prisma } from "../../prisma.js";

function stripHtml(text = "") {
  return text.replace(/<[^>]*>/g, "").trim();
}

function humanizeFilename(filename = "") {
  return stripHtml(filename)
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSeoTitle(pageTitle = "", seoData = {}) {
  return (
    pageTitle ||
    seoData.metaTitle ||
    seoData.ogTitle ||
    seoData.twitterTitle ||
    seoData.title ||
    ""
  );
}

function generateAltText(media, pageTitle, seoData) {
  return (
    media.altText ||
    media.title ||
    getSeoTitle(pageTitle, seoData) ||
    humanizeFilename(media.originalName) ||
    ""
  );
}

function generateTitle(media, pageTitle, seoData) {
  return (
    media.title ||
    getSeoTitle(pageTitle, seoData) ||
    humanizeFilename(media.originalName) ||
    ""
  );
}
export async function processImageSeo({
  html = "",
  pageTitle = "",
  seoData = {},
  tenantId,
}) {
  if (!html) return html;

  const $ = cheerio.load(html, { decodeEntities: false });

  const images = $("img").toArray();

  for (const img of images) {
    const src = $(img).attr("src");
    if (!src) continue;

    const media = await prisma.media.findFirst({
      where: {
        url: src,
        tenantId,
      },
    });
    if (!media) continue;

    const altFromAttr = $(img).attr("alt")?.trim() || "";
    const titleFromAttr = $(img).attr("title")?.trim() || "";

    const altText = altFromAttr || generateAltText(media, pageTitle, seoData);
    const titleText = titleFromAttr || generateTitle(media, pageTitle, seoData);

    if (!altFromAttr && altText) {
      $(img).attr("alt", altText);
    }
    if (!titleFromAttr && titleText) {
      $(img).attr("title", titleText);
    }

    const updateData = {};
    if (!media.altText && altText) {
      updateData.altText = altText;
    }
    if (!media.title && titleText) {
      updateData.title = titleText;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.media.update({
        where: {
          id: media.id,
        },
        data: updateData,
      });
    }
  }

  return $.html();
}
