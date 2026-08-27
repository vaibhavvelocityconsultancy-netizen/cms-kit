-- CreateTable
CREATE TABLE `PageElementOverride` (
    `id` VARCHAR(191) NOT NULL,
    `pageId` INTEGER NOT NULL,
    `editorId` VARCHAR(191) NOT NULL,
    `styles` JSON NULL,
    `classes` VARCHAR(191) NULL,
    `text` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `tenantId` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PageElementOverride_tenantId_idx`(`tenantId`),
    INDEX `PageElementOverride_pageId_idx`(`pageId`),
    UNIQUE INDEX `PageElementOverride_pageId_editorId_key`(`pageId`, `editorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PageElementOverride` ADD CONSTRAINT `PageElementOverride_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `page`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PageElementOverride` ADD CONSTRAINT `PageElementOverride_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
