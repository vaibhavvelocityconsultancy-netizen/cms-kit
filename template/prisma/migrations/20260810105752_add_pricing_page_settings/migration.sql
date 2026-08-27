-- AlterTable
ALTER TABLE `page` ADD COLUMN `componentSettings` JSON NULL;

-- CreateTable
CREATE TABLE `pricingPageSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `formId` INTEGER NULL,
    `tenantId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pricingPageSettings_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pricingPageSettings` ADD CONSTRAINT `pricingPageSettings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pricingPageSettings` ADD CONSTRAINT `pricingPageSettings_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `form`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
