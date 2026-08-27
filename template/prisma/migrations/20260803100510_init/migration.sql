-- CreateTable
CREATE TABLE `tenant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tenant_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `triggerEvent` VARCHAR(191) NOT NULL,
    `recipientType` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `bodyHtml` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `variables` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmailTemplate_triggerEvent_recipientType_key`(`triggerEvent`, `recipientType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `senderName` VARCHAR(191) NOT NULL DEFAULT '',
    `fromEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `replyToEmail` VARCHAR(191) NULL,
    `adminEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `lastTestStatus` VARCHAR(191) NULL,
    `lastTestAt` DATETIME(3) NULL,
    `lastTestError` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailLog` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `triggerEvent` VARCHAR(191) NOT NULL,
    `recipientType` VARCHAR(191) NOT NULL,
    `emailTo` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `error` TEXT NULL,
    `metadata` JSON NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmailLog_status_idx`(`status`),
    INDEX `EmailLog_triggerEvent_idx`(`triggerEvent`),
    INDEX `EmailLog_templateId_idx`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analyticsSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `gtmId` VARCHAR(191) NULL,
    `gtmHeadScript` TEXT NULL,
    `gtmBodyScript` TEXT NULL,
    `gaMeasurementId` VARCHAR(191) NULL,
    `gaHeadScript` TEXT NULL,
    `facebookPixelId` VARCHAR(191) NULL,
    `facebookHeadScript` TEXT NULL,
    `googleAdsId` VARCHAR(191) NULL,
    `googleAdsHeadScript` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `autoGenerateScripts` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `analyticsSettings_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AICrawlSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `enableMarkdownGeneration` BOOLEAN NOT NULL DEFAULT true,
    `includePages` BOOLEAN NOT NULL DEFAULT true,
    `includePosts` BOOLEAN NOT NULL DEFAULT true,
    `excludeDrafts` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `autoGenerateScripts` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `AICrawlSettings_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'VIEWER', 'SUBSCRIBER') NOT NULL DEFAULT 'SUBSCRIBER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tenantId` INTEGER NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AICrawlContent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `contentType` VARCHAR(191) NOT NULL,
    `contentId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `markdown` TEXT NOT NULL,
    `wordCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AICrawlContent_tenantId_idx`(`tenantId`),
    INDEX `AICrawlContent_contentType_idx`(`contentType`),
    UNIQUE INDEX `AICrawlContent_tenantId_contentType_contentId_key`(`tenantId`, `contentType`, `contentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `courseId` INTEGER NULL,
    `planId` INTEGER NULL,
    `billingCycle` ENUM('MONTHLY', 'YEARLY', 'LIFETIME') NOT NULL DEFAULT 'LIFETIME',
    `paypalOrderId` VARCHAR(191) NULL,
    `paypalCaptureId` VARCHAR(191) NULL,
    `paypalSubscriptionId` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_paypalOrderId_key`(`paypalOrderId`),
    UNIQUE INDEX `Payment_paypalCaptureId_key`(`paypalCaptureId`),
    INDEX `Payment_userId_idx`(`userId`),
    INDEX `Payment_courseId_idx`(`courseId`),
    INDEX `Payment_planId_idx`(`planId`),
    INDEX `Payment_status_idx`(`status`),
    INDEX `Payment_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `billingCycle` ENUM('MONTHLY', 'YEARLY', 'LIFETIME') NOT NULL DEFAULT 'MONTHLY',
    `status` ENUM('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELED', 'PENDING') NOT NULL DEFAULT 'TRIAL',
    `startsAt` DATETIME(3) NOT NULL,
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `canceledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Subscription_userId_idx`(`userId`),
    INDEX `Subscription_courseId_idx`(`courseId`),
    INDEX `Subscription_status_idx`(`status`),
    INDEX `Subscription_currentPeriodEnd_idx`(`currentPeriodEnd`),
    UNIQUE INDEX `Subscription_userId_courseId_key`(`userId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Plan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `tagline` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `monthlyPrice` DECIMAL(10, 2) NULL,
    `yearlyPrice` DECIMAL(10, 2) NULL,
    `allowMonthly` BOOLEAN NOT NULL DEFAULT true,
    `allowYearly` BOOLEAN NOT NULL DEFAULT true,
    `billingPeriodDays` INTEGER NULL,
    `paypalMonthlyPlanId` VARCHAR(191) NULL,
    `paypalYearlyPlanId` VARCHAR(191) NULL,
    `trialDays` INTEGER NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Plan_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Plan_slug_tenantId_key`(`slug`, `tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `defaultTrialDays` INTEGER NOT NULL DEFAULT 7,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PlanSettings_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanFeature` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `planId` INTEGER NOT NULL,

    INDEX `PlanFeature_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanSubscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `planId` INTEGER NOT NULL,
    `billingCycle` ENUM('MONTHLY', 'YEARLY', 'LIFETIME') NOT NULL DEFAULT 'MONTHLY',
    `status` ENUM('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELED', 'PENDING') NOT NULL DEFAULT 'TRIAL',
    `startsAt` DATETIME(3) NOT NULL,
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `trialEndsAt` DATETIME(3) NULL,
    `paypalSubscriptionId` VARCHAR(191) NULL,
    `canceledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PlanSubscription_paypalSubscriptionId_key`(`paypalSubscriptionId`),
    INDEX `PlanSubscription_userId_idx`(`userId`),
    INDEX `PlanSubscription_planId_idx`(`planId`),
    INDEX `PlanSubscription_status_idx`(`status`),
    INDEX `PlanSubscription_currentPeriodEnd_idx`(`currentPeriodEnd`),
    UNIQUE INDEX `PlanSubscription_userId_planId_key`(`userId`, `planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanEnrollment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `planId` INTEGER NOT NULL,
    `purchasedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlanEnrollment_userId_idx`(`userId`),
    INDEX `PlanEnrollment_planId_idx`(`planId`),
    UNIQUE INDEX `PlanEnrollment_userId_planId_key`(`userId`, `planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `permission_name_key`(`name`),
    INDEX `permission_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rolepermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'VIEWER', 'SUBSCRIBER') NOT NULL,
    `permissionId` INTEGER NOT NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,

    INDEX `rolepermission_permissionId_idx`(`permissionId`),
    INDEX `rolepermission_role_idx`(`role`),
    UNIQUE INDEX `rolepermission_role_permissionId_key`(`role`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userpermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,
    `allowed` BOOLEAN NOT NULL DEFAULT true,

    INDEX `userpermission_permissionId_idx`(`permissionId`),
    INDEX `userpermission_userId_idx`(`userId`),
    UNIQUE INDEX `userpermission_userId_permissionId_key`(`userId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `page` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `html` TEXT NOT NULL,
    `css` TEXT NULL,
    `js` TEXT NULL,
    `jsxCode` TEXT NULL,
    `pageType` VARCHAR(191) NOT NULL DEFAULT 'html',
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
    `seoData` JSON NULL,
    `sitemapEnabled` BOOLEAN NOT NULL DEFAULT true,
    `sitemapPriority` DECIMAL(2, 1) NOT NULL DEFAULT 0.8,
    `sitemapChangeFreq` ENUM('ALWAYS', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'NEVER') NOT NULL DEFAULT 'WEEKLY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tenantId` INTEGER NOT NULL,

    INDEX `page_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `page_tenantId_slug_key`(`tenantId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` TEXT NOT NULL,
    `featuredImage` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'PUBLISHED',
    `authorId` INTEGER NULL,
    `seoData` JSON NULL,
    `publishedAt` DATETIME(3) NULL,
    `sitemapEnabled` BOOLEAN NOT NULL DEFAULT true,
    `sitemapPriority` DECIMAL(2, 1) NOT NULL DEFAULT 0.8,
    `sitemapChangeFreq` ENUM('ALWAYS', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'NEVER') NOT NULL DEFAULT 'WEEKLY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `format` VARCHAR(191) NOT NULL DEFAULT 'standard',
    `tenantId` INTEGER NOT NULL,

    INDEX `post_authorId_idx`(`authorId`),
    INDEX `post_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `post_tenantId_slug_key`(`tenantId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `parentId` VARCHAR(191) NULL,
    `tenantId` INTEGER NOT NULL,
    `sitemapEnabled` BOOLEAN NOT NULL DEFAULT true,
    `sitemapPriority` DECIMAL(2, 1) NOT NULL DEFAULT 0.5,
    `sitemapChangeFreq` ENUM('ALWAYS', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'NEVER') NOT NULL DEFAULT 'WEEKLY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `category_tenantId_idx`(`tenantId`),
    INDEX `category_parentId_idx`(`parentId`),
    UNIQUE INDEX `category_tenantId_slug_key`(`tenantId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `tenantId` INTEGER NOT NULL,
    `sitemapEnabled` BOOLEAN NOT NULL DEFAULT false,
    `sitemapPriority` DECIMAL(2, 1) NOT NULL DEFAULT 0.8,
    `sitemapChangeFreq` ENUM('ALWAYS', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'NEVER') NOT NULL DEFAULT 'WEEKLY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tag_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `tag_tenantId_slug_key`(`tenantId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comment` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorEmail` VARCHAR(191) NOT NULL,
    `authorUrl` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'SPAM', 'TRASH') NOT NULL DEFAULT 'PENDING',
    `postId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NULL,
    `parentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `comment_parentId_idx`(`parentId`),
    INDEX `comment_postId_idx`(`postId`),
    INDEX `comment_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileName` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(255) NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `altText` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `caption` TEXT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tenantId` INTEGER NOT NULL,
    `collectionId` INTEGER NULL,

    INDEX `media_tenantId_idx`(`tenantId`),
    INDEX `media_collectionId_idx`(`collectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `userId` INTEGER NOT NULL,
    `tenantId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `collection_userId_idx`(`userId`),
    UNIQUE INDEX `collection_userId_name_key`(`userId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL DEFAULT 'none',
    `tenantId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menuitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL,
    `menuId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,

    INDEX `menuitem_menuId_idx`(`menuId`),
    INDEX `menuitem_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `fields` JSON NOT NULL,
    `submitButtonLabel` VARCHAR(191) NULL DEFAULT 'Submit',
    `confirmationType` VARCHAR(191) NOT NULL DEFAULT 'message',
    `confirmationMessage` TEXT NULL,
    `redirectUrl` VARCHAR(191) NULL,
    `emails` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `tenantId` INTEGER NOT NULL,

    INDEX `form_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `form_tenantId_slug_key`(`tenantId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `formsubmission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `formId` INTEGER NOT NULL,
    `data` JSON NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `read` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,

    INDEX `formsubmission_formId_idx`(`formId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sitesettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `siteName` VARCHAR(191) NULL,
    `siteTagline` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `favicon` VARCHAR(191) NULL,
    `defaultMetaTitle` VARCHAR(191) NULL,
    `defaultMetaDescription` TEXT NULL,
    `postsPerPage` INTEGER NOT NULL DEFAULT 10,
    `homepageType` VARCHAR(191) NOT NULL DEFAULT 'posts',
    `homepagePageId` INTEGER NULL,
    `postsPageId` INTEGER NULL,
    `globalCss` TEXT NULL,
    `globalJs` TEXT NULL,
    `showAdminToolbar` BOOLEAN NOT NULL DEFAULT true,
    `tenantId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `sitemapEnabled` BOOLEAN NOT NULL DEFAULT true,
    `sitemapCacheMinutes` INTEGER NOT NULL DEFAULT 10,
    `sitemapLastGeneratedAt` DATETIME(3) NULL,
    `sitemapCustomUrl` VARCHAR(191) NULL,
    `includePages` BOOLEAN NOT NULL DEFAULT true,
    `includePosts` BOOLEAN NOT NULL DEFAULT true,
    `includeCategories` BOOLEAN NOT NULL DEFAULT true,
    `includeTags` BOOLEAN NOT NULL DEFAULT false,
    `pingSearchEngines` BOOLEAN NOT NULL DEFAULT false,
    `cachedSitemapXml` VARCHAR(191) NULL,
    `cachedSitemapExpiresAt` DATETIME(3) NULL,
    `highlightAutoLinks` BOOLEAN NOT NULL DEFAULT false,
    `seoEnabled` BOOLEAN NOT NULL DEFAULT false,
    `robotsEnabled` BOOLEAN NOT NULL DEFAULT false,
    `robotsContent` TEXT NULL,
    `customCrawlerRules` TEXT NULL,

    UNIQUE INDEX `sitesettings_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrackingSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `gtmId` VARCHAR(191) NULL,
    `gaMeasurementId` VARCHAR(191) NULL,
    `facebookPixelId` VARCHAR(191) NULL,
    `googleAdsId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TrackingSettings_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `footersettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `tenantId` INTEGER NOT NULL,
    `value` JSON NOT NULL,

    UNIQUE INDEX `footersettings_key_key`(`key`),
    INDEX `footersettings_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NavbarConfig` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` INTEGER NOT NULL,
    `bgColor` VARCHAR(191) NOT NULL DEFAULT '#0B0F1A',
    `bgOpacity` INTEGER NOT NULL DEFAULT 90,
    `linkColor` VARCHAR(191) NOT NULL DEFAULT '#cbd5e1',
    `linkHoverColor` VARCHAR(191) NOT NULL DEFAULT '#ffffff',
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#22d3ee',
    `dropdownBg` VARCHAR(191) NOT NULL DEFAULT '#111827',
    `sticky` BOOLEAN NOT NULL DEFAULT true,
    `blur` BOOLEAN NOT NULL DEFAULT true,
    `showLogin` BOOLEAN NOT NULL DEFAULT true,
    `showSignup` BOOLEAN NOT NULL DEFAULT true,
    `showPricing` BOOLEAN NOT NULL DEFAULT true,
    `loginLabel` VARCHAR(191) NOT NULL DEFAULT 'Log In',
    `signupLabel` VARCHAR(191) NOT NULL DEFAULT 'Sign Up',
    `pricingLabel` VARCHAR(191) NOT NULL DEFAULT 'Pricing',
    `customCss` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `NavbarConfig_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FooterConfig` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` INTEGER NOT NULL,
    `bgColor` VARCHAR(191) NOT NULL DEFAULT '#0B0F1A',
    `borderColor` VARCHAR(191) NOT NULL DEFAULT '#ffffff',
    `borderOpacity` INTEGER NOT NULL DEFAULT 8,
    `headingColor` VARCHAR(191) NOT NULL DEFAULT '#ffffff',
    `textColor` VARCHAR(191) NOT NULL DEFAULT '#cbd5e1',
    `mutedTextColor` VARCHAR(191) NOT NULL DEFAULT '#94a3b8',
    `bottomTextColor` VARCHAR(191) NOT NULL DEFAULT '#64748b',
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#22d3ee',
    `accentHoverColor` VARCHAR(191) NOT NULL DEFAULT '#67e8f9',
    `ctaTextColor` VARCHAR(191) NOT NULL DEFAULT '#0f172a',
    `eyebrowText` VARCHAR(191) NOT NULL DEFAULT 'Let''s Start a Conversation',
    `headline` VARCHAR(191) NOT NULL DEFAULT 'Ready to grow your business?',
    `showCta` BOOLEAN NOT NULL DEFAULT true,
    `customCss` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FooterConfig_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BreadcrumbSettings` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` INTEGER NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `homeLabel` VARCHAR(191) NOT NULL DEFAULT 'Home',
    `homeUrl` VARCHAR(191) NULL,
    `separator` VARCHAR(191) NOT NULL DEFAULT '/',
    `showHome` BOOLEAN NOT NULL DEFAULT true,
    `showCurrent` BOOLEAN NOT NULL DEFAULT true,
    `showParent` BOOLEAN NOT NULL DEFAULT true,
    `pagesEnabled` BOOLEAN NOT NULL DEFAULT true,
    `postsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `categoriesEnabled` BOOLEAN NOT NULL DEFAULT true,
    `tagsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `hideOnHome` BOOLEAN NOT NULL DEFAULT true,
    `hideOn404` BOOLEAN NOT NULL DEFAULT true,
    `hideOnSearch` BOOLEAN NOT NULL DEFAULT false,
    `schemaEnabled` BOOLEAN NOT NULL DEFAULT true,
    `cssClass` VARCHAR(191) NULL,
    `customCss` TEXT NULL,
    `linkColor` VARCHAR(191) NOT NULL DEFAULT '#4b5563',
    `linkHoverColor` VARCHAR(191) NOT NULL DEFAULT '#111827',
    `currentColor` VARCHAR(191) NOT NULL DEFAULT '#6b7280',
    `separatorColor` VARCHAR(191) NOT NULL DEFAULT '#9ca3af',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BreadcrumbSettings_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Redirect` (
    `id` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `destinationUrl` VARCHAR(191) NOT NULL,
    `statusCode` INTEGER NOT NULL DEFAULT 301,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `isAutoDetected` BOOLEAN NOT NULL DEFAULT false,
    `hitCount` INTEGER NOT NULL DEFAULT 0,
    `lastUsedAt` DATETIME(3) NULL,
    `tenantId` INTEGER NOT NULL,

    UNIQUE INDEX `Redirect_sourceUrl_key`(`sourceUrl`),
    INDEX `Redirect_sourceUrl_idx`(`sourceUrl`),
    INDEX `Redirect_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotFoundLog` (
    `id` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `referrer` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `suggestedUrl` VARCHAR(191) NULL,
    `redirectId` VARCHAR(191) NULL,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tenantId` INTEGER NOT NULL,

    INDEX `NotFoundLog_path_idx`(`path`),
    INDEX `NotFoundLog_isResolved_idx`(`isResolved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RedirectImport` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `totalCount` INTEGER NOT NULL,
    `successCount` INTEGER NOT NULL,
    `failureCount` INTEGER NOT NULL,
    `errors` VARCHAR(191) NULL,
    `importedBy` VARCHAR(191) NOT NULL,
    `importedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tenantId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternalLinkRule` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` INTEGER NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `destinationType` VARCHAR(191) NULL,
    `destinationId` VARCHAR(191) NULL,
    `destinationUrl` VARCHAR(191) NOT NULL,
    `linkTitle` VARCHAR(191) NULL,
    `openInNewTab` BOOLEAN NOT NULL DEFAULT false,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `wholeWordOnly` BOOLEAN NOT NULL DEFAULT true,
    `caseSensitive` BOOLEAN NOT NULL DEFAULT false,
    `firstOccurrenceOnly` BOOLEAN NOT NULL DEFAULT false,
    `ignoreHeadings` BOOLEAN NOT NULL DEFAULT true,
    `ignoreExistingLinks` BOOLEAN NOT NULL DEFAULT true,
    `maxLinksPerPage` INTEGER NOT NULL DEFAULT 1,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InternalLinkRule_tenantId_idx`(`tenantId`),
    INDEX `InternalLinkRule_keyword_idx`(`keyword`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `parentId` VARCHAR(191) NULL,
    `tenantId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FileCategory_tenantId_idx`(`tenantId`),
    INDEX `FileCategory_parentId_idx`(`parentId`),
    UNIQUE INDEX `FileCategory_tenantId_slug_key`(`tenantId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UploadedFile` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `shortDesc` TEXT NULL,
    `description` TEXT NULL,
    `isShareable` BOOLEAN NOT NULL DEFAULT true,
    `tags` TEXT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `uploadedBy` INTEGER NOT NULL,
    `tenantId` INTEGER NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UploadedFile_tenantId_idx`(`tenantId`),
    INDEX `UploadedFile_uploadedBy_idx`(`uploadedBy`),
    INDEX `UploadedFile_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileShareLink` (
    `id` VARCHAR(191) NOT NULL,
    `sharedWith` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdBy` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `viewedAt` DATETIME(3) NULL,
    `zipDownloadedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FileShareLink_token_key`(`token`),
    INDEX `FileShareLink_token_idx`(`token`),
    INDEX `FileShareLink_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileShareFile` (
    `id` VARCHAR(191) NOT NULL,
    `shareLinkId` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,
    `downloadedAt` DATETIME(3) NULL,

    INDEX `FileShareFile_shareLinkId_idx`(`shareLinkId`),
    INDEX `FileShareFile_fileId_idx`(`fileId`),
    UNIQUE INDEX `FileShareFile_shareLinkId_fileId_key`(`shareLinkId`, `fileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_posttotag` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_posttotag_AB_unique`(`A`, `B`),
    INDEX `_posttotag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_categorytopost` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_categorytopost_AB_unique`(`A`, `B`),
    INDEX `_categorytopost_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EmailLog` ADD CONSTRAINT `EmailLog_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `EmailTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analyticsSettings` ADD CONSTRAINT `analyticsSettings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AICrawlSettings` ADD CONSTRAINT `AICrawlSettings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AICrawlContent` ADD CONSTRAINT `AICrawlContent_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Plan` ADD CONSTRAINT `Plan_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanSettings` ADD CONSTRAINT `PlanSettings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanFeature` ADD CONSTRAINT `PlanFeature_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanSubscription` ADD CONSTRAINT `PlanSubscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanSubscription` ADD CONSTRAINT `PlanSubscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanEnrollment` ADD CONSTRAINT `PlanEnrollment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanEnrollment` ADD CONSTRAINT `PlanEnrollment_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rolepermission` ADD CONSTRAINT `rolepermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userpermission` ADD CONSTRAINT `userpermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userpermission` ADD CONSTRAINT `userpermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `page` ADD CONSTRAINT `page_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post` ADD CONSTRAINT `post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post` ADD CONSTRAINT `post_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category` ADD CONSTRAINT `category_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category` ADD CONSTRAINT `category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tag` ADD CONSTRAINT `tag_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `comment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `collection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collection` ADD CONSTRAINT `collection_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collection` ADD CONSTRAINT `collection_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menu` ADD CONSTRAINT `menu_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menuitem` ADD CONSTRAINT `menuitem_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `menu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menuitem` ADD CONSTRAINT `menuitem_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `menuitem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form` ADD CONSTRAINT `form_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `formsubmission` ADD CONSTRAINT `formsubmission_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sitesettings` ADD CONSTRAINT `sitesettings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrackingSettings` ADD CONSTRAINT `TrackingSettings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `footersettings` ADD CONSTRAINT `footersettings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NavbarConfig` ADD CONSTRAINT `NavbarConfig_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FooterConfig` ADD CONSTRAINT `FooterConfig_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BreadcrumbSettings` ADD CONSTRAINT `BreadcrumbSettings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Redirect` ADD CONSTRAINT `Redirect_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotFoundLog` ADD CONSTRAINT `NotFoundLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RedirectImport` ADD CONSTRAINT `RedirectImport_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternalLinkRule` ADD CONSTRAINT `InternalLinkRule_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileCategory` ADD CONSTRAINT `FileCategory_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileCategory` ADD CONSTRAINT `FileCategory_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `FileCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UploadedFile` ADD CONSTRAINT `UploadedFile_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `FileCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UploadedFile` ADD CONSTRAINT `UploadedFile_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UploadedFile` ADD CONSTRAINT `UploadedFile_uploadedBy_fkey` FOREIGN KEY (`uploadedBy`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileShareLink` ADD CONSTRAINT `FileShareLink_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileShareFile` ADD CONSTRAINT `FileShareFile_shareLinkId_fkey` FOREIGN KEY (`shareLinkId`) REFERENCES `FileShareLink`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileShareFile` ADD CONSTRAINT `FileShareFile_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `UploadedFile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_posttotag` ADD CONSTRAINT `_posttotag_A_fkey` FOREIGN KEY (`A`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_posttotag` ADD CONSTRAINT `_posttotag_B_fkey` FOREIGN KEY (`B`) REFERENCES `tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_categorytopost` ADD CONSTRAINT `_categorytopost_A_fkey` FOREIGN KEY (`A`) REFERENCES `category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_categorytopost` ADD CONSTRAINT `_categorytopost_B_fkey` FOREIGN KEY (`B`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
