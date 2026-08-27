import { PrismaClient } from "@prisma/client";
import { load } from "cheerio";

const prisma = new PrismaClient();

function extractSearchableText(html) {
  const $ = load(html || "");
  $("script, style").remove();
  return $.text().replace(/\s+/g, " ").trim();
}

async function run() {
  const pages = await prisma.page.findMany({
    where: { searchText: null },
    select: { id: true, html: true },
  });

  console.log(`Found ${pages.length} pages to backfill...`);

  for (const page of pages) {
    const searchText = extractSearchableText(page.html);
    await prisma.page.update({
      where: { id: page.id },
      data: { searchText },
    });
    console.log(`✓ Page ${page.id} updated`);
  }

  console.log("Backfill complete.");
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});