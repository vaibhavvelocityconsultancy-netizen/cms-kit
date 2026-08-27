import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

import { prisma } from "../src/app/lib/prisma.js";
import {
  getTenantUploadDir,
  getTenantFileUrl,
} from "../src/app/lib/utils/uploadconfig.js";

async function optimizeExistingMedia() {
  console.log("========================================");
  console.log("   LIVE IMAGE OPTIMIZATION");
  console.log("   ORIGINAL FILES WILL BE KEPT");
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

  let processed = 0;
  let failed = 0;
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const media of mediaItems) {
    const tenantDir = getTenantUploadDir(media.tenantId);

    const oldFilePath = path.join(tenantDir, media.publicId);

    try {
      // Make sure original exists
      await fs.access(oldFilePath);

      const originalBuffer = await fs.readFile(oldFilePath);

      // Generate WebP from original
      const optimizedBuffer = await sharp(originalBuffer)
        .webp({
          quality: 80,
        })
        .toBuffer();

      const baseName = path.basename(
        media.publicId,
        path.extname(media.publicId),
      );

      const newFileName = `${baseName}.webp`;

      const newFilePath = path.join(tenantDir, newFileName);

      // If a WebP with the same name already exists,
      // don't overwrite it accidentally.
      try {
        await fs.access(newFilePath);

        console.log(
          `⚠️  ID ${media.id}: ${newFileName} already exists. Skipping.`,
        );

        continue;
      } catch {
        // File doesn't exist, safe to create.
      }

      // Create WebP
      await fs.writeFile(newFilePath, optimizedBuffer);

      const newUrl = getTenantFileUrl(media.tenantId, newFileName);

      // Update database
      await prisma.media.update({
        where: {
          id: media.id,
        },
        data: {
          fileName: newFileName,
          publicId: newFileName,
          url: newUrl,
          mimeType: "image/webp",
          size: optimizedBuffer.length,
        },
      });

      const originalKB = media.size / 1024;
      const optimizedKB = optimizedBuffer.length / 1024;

      const savedKB = originalKB - optimizedKB;

      const savingPercent = originalKB > 0 ? (savedKB / originalKB) * 100 : 0;

      totalOriginalSize += media.size;
      totalOptimizedSize += optimizedBuffer.length;

      processed++;

      console.log(`✅ ID ${media.id}`);
      console.log(`   Original: ${media.publicId}`);
      console.log(`   WebP:     ${newFileName}`);
      console.log(
        `   ${originalKB.toFixed(2)} KB → ${optimizedKB.toFixed(2)} KB`,
      );
      console.log(
        `   Saved: ${savedKB.toFixed(2)} KB (${savingPercent.toFixed(1)}%)`,
      );
      console.log("");
    } catch (error) {
      failed++;

      console.error(`❌ ID ${media.id} failed: ${error.message}\n`);
    }
  }

  console.log("========================================");
  console.log("             RESULT");
  console.log("========================================");

  console.log(`Processed: ${processed}`);
  console.log(`Failed:    ${failed}`);

  console.log(`Original total:  ${(totalOriginalSize / 1024).toFixed(2)} KB`);

  console.log(`WebP total:      ${(totalOptimizedSize / 1024).toFixed(2)} KB`);

  console.log(
    `Potential saved: ${(
      (totalOriginalSize - totalOptimizedSize) /
      1024
    ).toFixed(2)} KB`,
  );

  console.log("\n✅ Optimization completed.");
  console.log("✅ Original JPG/PNG files were NOT deleted.");
}

optimizeExistingMedia()
  .catch(async (error) => {
    console.error("❌ Fatal error:", error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
