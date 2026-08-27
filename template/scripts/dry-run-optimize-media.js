import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

import { prisma } from "../src/app/lib/prisma.js";
import { getTenantUploadDir } from "../src/app/lib/utils/uploadconfig.js";

async function dryRunOptimizeMedia() {
  console.log("========================================");
  console.log("   IMAGE OPTIMIZATION — DRY RUN");
  console.log("   NO FILES OR DATABASE WILL BE CHANGED");
  console.log("========================================\n");

  const mediaItems = await prisma.media.findMany({
    where: {
      mimeType: {
        in: ["image/jpeg", "image/png"],
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(`Found ${mediaItems.length} JPG/PNG images.\n`);

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processed = 0;
  let failed = 0;

  for (const media of mediaItems) {
    const tenantDir = getTenantUploadDir(media.tenantId);

    const filePath = path.join(tenantDir, media.publicId);

    try {
      await fs.access(filePath);

      const originalBuffer = await fs.readFile(filePath);

      const optimizedBuffer = await sharp(originalBuffer)
        .webp({
          quality: 80,
        })
        .toBuffer();

      const originalKB = media.size / 1024;
      const optimizedKB = optimizedBuffer.length / 1024;
      const savedKB = originalKB - optimizedKB;
      const savingPercent = originalKB > 0 ? (savedKB / originalKB) * 100 : 0;

      totalOriginalSize += media.size;
      totalOptimizedSize += optimizedBuffer.length;
      processed++;

      console.log(`🖼️  ID: ${media.id}`);
      console.log(`   File: ${media.originalName}`);
      console.log(`   Current: ${originalKB.toFixed(2)} KB`);
      console.log(`   WebP:    ${optimizedKB.toFixed(2)} KB`);
      console.log(
        `   Saving:  ${savedKB.toFixed(2)} KB (${savingPercent.toFixed(1)}%)`,
      );
      console.log("");
    } catch (error) {
      failed++;

      console.error(`❌ ID ${media.id} failed: ${error.message}\n`);
    }
  }

  const totalOriginalKB = totalOriginalSize / 1024;
  const totalOptimizedKB = totalOptimizedSize / 1024;
  const totalSavedKB = totalOriginalKB - totalOptimizedKB;

  const totalSavingPercent =
    totalOriginalKB > 0 ? (totalSavedKB / totalOriginalKB) * 100 : 0;

  console.log("========================================");
  console.log("              DRY RUN RESULT");
  console.log("========================================");

  console.log(`Images processed: ${processed}`);
  console.log(`Images failed:    ${failed}`);

  console.log(`Current total:    ${totalOriginalKB.toFixed(2)} KB`);

  console.log(`WebP total:       ${totalOptimizedKB.toFixed(2)} KB`);

  console.log(`Potential saving: ${totalSavedKB.toFixed(2)} KB`);

  console.log(`Potential saving: ${totalSavingPercent.toFixed(1)}%`);

  console.log("\n⚠️ DRY RUN ONLY");
  console.log("No database records were changed.");
  console.log("No files were created.");
  console.log("No files were deleted.");

  await prisma.$disconnect();
}

dryRunOptimizeMedia().catch(async (error) => {
  console.error("❌ Fatal error:", error);

  await prisma.$disconnect();

  process.exit(1);
});
