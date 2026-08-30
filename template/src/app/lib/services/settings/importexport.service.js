import { prisma } from "../../prisma";
import { requirePermission } from "../../withPermission";
import { randomUUID } from "crypto";

const EXPORT_VERSION = "1.1";

// ─── EXPORT ───────────────────────────────────────────────
// We fetch each entity separately and bundle into one JSON object.
// We STRIP id, createdAt, updatedAt because:
//   - id is auto-incremented, will conflict on the target DB
//   - createdAt/updatedAt are DB-managed, should reset on import
// slug is kept because it's our natural unique key for conflict detection

export async function exportAll() {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  // __meta helps us validate the file on import
  // version lets us handle format changes in future without breaking imports
  const payload = {
    __meta: {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
    },
  };

  // ── Pages ──
  // We export all fields except id/createdAt/updatedAt
  // html, css, js, jsxCode are just strings so no special handling needed
  const pages = await prisma.page.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });
  payload.pages = pages.map(
    ({ id, createdAt, updatedAt, tenantId: _, ...rest }) => rest,
  );

  // ── Menus ──
  // Menus have nested items, so we include them via Prisma relation
  // BUT we store items as nested children tree (not flat with parentId integers)
  // because parentId integers are meaningless in a different database
  const menus = await prisma.menu.findMany({
    where: { tenantId },
    include: { menuitem: { orderBy: { order: "asc" } } },
  });
  payload.menus = menus.map(({ id, menuitem, tenantId: _, ...menu }) => ({
    ...menu,
    // Convert flat items array into a nested tree before exporting
    // so parent-child relationships survive across databases
    items: buildMenuTree(menuitem),
  }));

  payload.settings = await exportSettings(tenantId);

  const [categories, tags, posts, forms, collections, media] =
    await Promise.all([
      prisma.category.findMany({
        where: { tenantId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.tag.findMany({
        where: { tenantId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.post.findMany({
        where: { tenantId },
        include: { category: true, tag: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.form.findMany({
        where: { tenantId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.collection.findMany({
        where: { tenantId },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.media.findMany({
        where: { tenantId },
        include: { collection: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);
  payload.categories = categories.map(({ parentId, ...category }) => ({
    ...stripRecord(category),
    parentSlug: categories.find((item) => item.id === parentId)?.slug ?? null,
  }));
  payload.tags = tags.map(stripRecord);
  payload.posts = posts.map(({ category, tag, ...post }) => ({
    ...stripRecord(post),
    categorySlugs: category.map((item) => item.slug),
    tagSlugs: tag.map((item) => item.slug),
  }));
  payload.forms = forms.map(stripRecord);
  payload.collections = collections.map(
    ({ id, createdAt, updatedAt, tenantId: _, user, ...collection }) => ({
      ...collection,
      userEmail: user?.email ?? null,
    }),
  );
  payload.media = media.map(({ collection, ...item }) => ({
    ...stripRecord(item),
    collectionName: collection?.name ?? null,
  }));

  if (prisma.plan) {
    const plans = await prisma.plan.findMany({
      where: { tenantId },
      include: { features: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    payload.plans = plans.map(({ features, ...plan }) => ({
      ...stripRecord(plan),
      features: features.map(({ id, planId, ...feature }) => feature),
    }));
    payload.planSettings = await prisma.planSettings.findUnique({
      where: { tenantId },
      select: { defaultTrialDays: true },
    });
    payload.subscribers = await exportSubscribers(tenantId);
  } else {
    payload.plans = [];
    payload.planSettings = null;
    payload.subscribers = [];
  }

  return payload;
}

function stripRecord({ id, createdAt, updatedAt, tenantId: _, ...record }) {
  return record;
}

async function exportSettings(tenantId) {
  const [
    site,
    tracking,
    analytics,
    aiCrawl,
    navbar,
    footer,
    breadcrumbs,
    footerSettings,
  ] = await Promise.all([
    prisma.sitesettings.findUnique({ where: { tenantId } }),
    prisma.TrackingSettings.findUnique({ where: { tenantId } }),
    prisma.analyticsSettings.findUnique({ where: { tenantId } }),
    prisma.AICrawlSettings.findUnique({ where: { tenantId } }),
    prisma.navbarConfig.findUnique({ where: { tenantId } }),
    prisma.footerConfig.findUnique({ where: { tenantId } }),
    prisma.BreadcrumbSettings.findUnique({ where: { tenantId } }),
    prisma.footerSettings.findMany({
      where: { tenantId },
      orderBy: { key: "asc" },
    }),
  ]);

  return {
    site: site && stripRecord(site),
    globalCss: site?.globalCss ?? null,
    globalJs: site?.globalJs ?? null,
    tracking: tracking && stripRecord(tracking),
    analytics: analytics && stripRecord(analytics),
    aiCrawl: aiCrawl && stripRecord(aiCrawl),
    navbar: navbar && stripRecord(navbar),
    footer: footer && stripRecord(footer),
    breadcrumbs: breadcrumbs && stripRecord(breadcrumbs),
    footerSettings: footerSettings.map(
      ({ id, tenantId: _, ...setting }) => setting,
    ),
  };
}

async function exportSubscribers(tenantId) {
  if (!prisma.planSubscription || !prisma.planEnrollment) return [];

  const users = await prisma.user.findMany({
    where: { tenantId, role: { not: "SUPER_ADMIN" } },
    select: {
      email: true,
      name: true,
      role: true,
      planSubscriptions: {
        include: { plan: { select: { slug: true } } },
      },
      planEnrollments: {
        include: { plan: { select: { slug: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return users.map(({ planSubscriptions, planEnrollments, ...user }) => ({
    ...user,
    subscriptions: planSubscriptions.map(
      ({
        plan,
        userId,
        planId,
        id,
        createdAt,
        updatedAt,
        ...subscription
      }) => ({
        ...subscription,
        planSlug: plan.slug,
      }),
    ),
    enrollments: planEnrollments.map(
      ({ plan, userId, planId, id, ...enrollment }) => ({
        ...enrollment,
        planSlug: plan.slug,
      }),
    ),
  }));
}

// ─── Menu Tree Builder ─────────────────────────────────────
// Prisma returns menu items as a FLAT array with parentId references.
// On export we convert this to a nested tree so the structure is
// self-contained and doesn't rely on integer IDs from the source DB.
//
// Example flat input:
//   [{ id:1, label:'Home', parentId:null }, { id:2, label:'Sub', parentId:1 }]
// Nested output:
//   [{ label:'Home', children: [{ label:'Sub', children:[] }] }]

function buildMenuTree(items, parentId = null) {
  return items
    .filter((item) => item.parentId === parentId)
    .map(({ id, menuId, parentId, ...item }) => ({
      // strip id, menuId, parentId — all DB-specific, useless on import
      ...item,
      children: buildMenuTree(items, id), // recursively attach children
    }));
}

// ─── IMPORT ───────────────────────────────────────────────
// strategy controls what happens when a slug already exists in the target DB:
//   'skip'      → leave existing record untouched, move on
//   'overwrite' → update the existing record with imported data
//   'rename'    → append -1, -2 etc. to slug and create as new

export async function importAll(payload, strategy = "skip") {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  // Always validate before touching the database
  validatePayload(payload);

  // We collect results so the API can return a summary to the user
  // showing what was created, skipped, overwritten, and what errored
  const report = {
    pages: { created: 0, skipped: 0, overwritten: 0, errors: [] },
    menus: { created: 0, skipped: 0, overwritten: 0, errors: [] },
    settings: { created: 0, skipped: 0, overwritten: 0, errors: [] },
    categories: { created: 0, skipped: 0, overwritten: 0, errors: [] },
    tags: { created: 0, skipped: 0, overwritten: 0, errors: [] },
    posts: { created: 0, skipped: 0, overwritten: 0, errors: [] },
    forms: { created: 0, skipped: 0, overwritten: 0, errors: [] },
    collections: { created: 0, skipped: 0, overwritten: 0, errors: [] },
    media: { created: 0, skipped: 0, overwritten: 0, errors: [] },
    plans: { created: 0, skipped: 0, overwritten: 0, errors: [] },
    subscribers: { created: 0, skipped: 0, overwritten: 0, errors: [] },
  };

  if (payload.settings)
    await importSettings(payload.settings, report.settings, tenantId);
  if (payload.categories?.length)
    await importTaxonomy(
      payload.categories,
      "category",
      strategy,
      report.categories,
      tenantId,
    );
  if (payload.tags?.length)
    await importTaxonomy(payload.tags, "tag", strategy, report.tags, tenantId);
  if (payload.posts?.length)
    await importPosts(payload.posts, strategy, report.posts, tenantId);
  if (payload.forms?.length)
    await importForms(payload.forms, strategy, report.forms, tenantId);
  const collectionMap = payload.collections?.length
    ? await importCollections(
        payload.collections,
        strategy,
        report.collections,
        tenantId,
        session.user.id,
      )
    : new Map();
  if (payload.media?.length)
    await importMedia(
      payload.media,
      strategy,
      report.media,
      tenantId,
      collectionMap,
    );
  if (payload.plans?.length && prisma.plan)
    await importPlans(payload.plans, strategy, report.plans, tenantId);
  else if (payload.plans?.length)
    report.plans.skipped += payload.plans.length;
  if (payload.planSettings && prisma.planSettings)
    await importPlanSettings(payload.planSettings, report.settings, tenantId);
  else if (payload.planSettings)
    report.settings.skipped++;
  if (payload.subscribers?.length && prisma.planSubscription)
    await importSubscribers(
      payload.subscribers,
      strategy,
      report.subscribers,
      tenantId,
    );
  else if (payload.subscribers?.length)
    report.subscribers.skipped += payload.subscribers.length;

  if (payload.pages?.length) {
    await importPages(payload.pages, strategy, report.pages, tenantId);
  }

  if (payload.menus?.length) {
    await importMenus(payload.menus, strategy, report.menus, tenantId);
  }

  return report;
}

// ─── Payload Validator ─────────────────────────────────────
// Runs before any DB writes.
// Catches obviously wrong files early (wrong format, future version etc.)

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid file: expected a JSON object");
  }
  if (!payload.__meta?.version) {
    throw new Error(
      "Invalid file: missing __meta.version — was this exported from this CMS?",
    );
  }
  if (!["1.0", EXPORT_VERSION].includes(payload.__meta.version)) {
    // In future if you change the format to 2.0,
    // you'd add a migration/transform here instead of throwing
    throw new Error(`Unsupported version: ${payload.__meta.version}`);
  }
}

async function importSettings(settings, report, tenantId) {
  const singletonModels = [
    ["site", prisma.sitesettings],
    ["tracking", prisma.TrackingSettings],
    ["analytics", prisma.analyticsSettings],
    ["aiCrawl", prisma.AICrawlSettings],
    ["navbar", prisma.navbarConfig],
    ["footer", prisma.footerConfig],
    ["breadcrumbs", prisma.BreadcrumbSettings],
  ];

  for (const [key, model] of singletonModels) {
    if (!settings[key]) continue;
    try {
      const data = { ...settings[key], tenantId };
      if (key === "site") {
        data.globalCss = settings.globalCss ?? settings[key]?.globalCss ?? null;
        data.globalJs = settings.globalJs ?? settings[key]?.globalJs ?? null;
      }
      delete data.homepagePageId;
      delete data.postsPageId;
      delete data.coursesPageId;
      delete data.sitemapLastGeneratedAt;
      delete data.cachedSitemapXml;
      delete data.cachedSitemapExpiresAt;
      await model.upsert({
        where: { tenantId },
        update: data,
        create: data,
      });
      report.overwritten++;
    } catch (err) {
      report.errors.push({ section: key, error: err.message });
    }
  }

  for (const setting of settings.footerSettings ?? []) {
    try {
      const existing = await prisma.footerSettings.findFirst({
        where: { key: setting.key, tenantId },
      });
      const data = { key: setting.key, tenantId, value: setting.value };
      if (existing) {
        await prisma.footerSettings.update({
          where: { id: existing.id },
          data,
        });
        report.overwritten++;
      } else {
        await prisma.footerSettings.create({ data });
        report.created++;
      }
    } catch (err) {
      report.errors.push({ key: setting.key, error: err.message });
    }
  }
}

async function importTaxonomy(items, type, strategy, report, tenantId) {
  const model = type === "category" ? prisma.category : prisma.tag;
  const imported = new Map();

  for (const item of items) {
    try {
      const existing = await model.findFirst({
        where: { slug: item.slug, tenantId },
      });
      const data = { name: item.name, slug: item.slug, tenantId };
      if (type === "category") {
        data.description = item.description ?? null;
        data.sitemapEnabled = item.sitemapEnabled;
        data.sitemapPriority = item.sitemapPriority;
        data.sitemapChangeFreq = item.sitemapChangeFreq;
      } else {
        data.sitemapEnabled = item.sitemapEnabled;
        data.sitemapPriority = item.sitemapPriority;
        data.sitemapChangeFreq = item.sitemapChangeFreq;
      }

      if (existing && strategy === "skip") {
        imported.set(item.slug, existing.id);
        report.skipped++;
        continue;
      }
      if (existing && strategy === "overwrite") {
        const updated = await model.update({
          where: { id: existing.id },
          data,
        });
        imported.set(item.slug, updated.id);
        report.overwritten++;
        continue;
      }
      if (existing) data.slug = await findFreeSlug(item.slug, type, tenantId);
      const created = await model.create({ data });
      imported.set(item.slug, created.id);
      report.created++;
    } catch (err) {
      report.errors.push({ slug: item.slug, error: err.message });
    }
  }

  if (type === "category") {
    for (const item of items) {
      if (!item.parentSlug || !imported.has(item.slug)) continue;
      await model.update({
        where: { id: imported.get(item.slug) },
        data: { parentId: imported.get(item.parentSlug) ?? null },
      });
    }
  }
}

async function importPosts(posts, strategy, report, tenantId) {
  for (const post of posts) {
    try {
      const existing = await prisma.post.findFirst({
        where: { slug: post.slug, tenantId },
      });
      if (existing && strategy === "skip") {
        report.skipped++;
        continue;
      }

      const categoryIds = await findTaxonomyIds(
        "category",
        post.categorySlugs,
        tenantId,
      );
      const tagIds = await findTaxonomyIds("tag", post.tagSlugs, tenantId);
      const data = {
        title: post.title,
        slug:
          existing && strategy === "rename"
            ? await findFreeSlug(post.slug, "post", tenantId)
            : post.slug,
        excerpt: post.excerpt ?? null,
        content: post.content,
        featuredImage: post.featuredImage ?? null,
        status: post.status,
        seoData: post.seoData ?? null,
        publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
        format: post.format ?? "standard",
        sitemapEnabled: post.sitemapEnabled,
        sitemapPriority: post.sitemapPriority,
        sitemapChangeFreq: post.sitemapChangeFreq,
        category: { connect: categoryIds.map((id) => ({ id })) },
        tag: { connect: tagIds.map((id) => ({ id })) },
      };

      if (existing && strategy === "overwrite") {
        await prisma.post.update({ where: { id: existing.id }, data });
        report.overwritten++;
      } else {
        await prisma.post.create({
          data: { id: randomUUID(), ...data, tenantId },
        });
        report.created++;
      }
    } catch (err) {
      report.errors.push({ slug: post.slug, error: err.message });
    }
  }
}

async function findTaxonomyIds(type, slugs = [], tenantId) {
  if (!slugs.length) return [];
  const model = type === "category" ? prisma.category : prisma.tag;
  const rows = await model.findMany({
    where: { tenantId, slug: { in: slugs } },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

async function importPlans(plans, strategy, report, tenantId) {
  if (!prisma.plan) {
    report.skipped += plans.length;
    return;
  }

  for (const plan of plans) {
    try {
      const existing = await prisma.plan.findFirst({
        where: { slug: plan.slug, tenantId },
      });
      if (existing && strategy === "skip") {
        report.skipped++;
        continue;
      }

      const data = {
        title: plan.title,
        slug:
          existing && strategy === "rename"
            ? await findFreeSlug(plan.slug, "plan", tenantId)
            : plan.slug,
        tagline: plan.tagline ?? null,
        description: plan.description ?? null,
        price: plan.price,
        billingCycle: plan.billingCycle,
        billingPeriodDays: plan.billingPeriodDays ?? null,
        trialDays: plan.trialDays ?? null,
        isFeatured: plan.isFeatured,
        isPublished: plan.isPublished,
        sortOrder: plan.sortOrder ?? 0,
      };
      const features = (plan.features ?? []).map((feature, index) => ({
        title: feature.title,
        sortOrder: feature.sortOrder ?? index,
      }));

      if (existing && strategy === "overwrite") {
        await prisma.planFeature.deleteMany({ where: { planId: existing.id } });
        await prisma.plan.update({
          where: { id: existing.id },
          data: { ...data, features: { create: features } },
        });
        report.overwritten++;
      } else {
        await prisma.plan.create({
          data: { ...data, tenantId, features: { create: features } },
        });
        report.created++;
      }
    } catch (err) {
      report.errors.push({ slug: plan.slug, error: err.message });
    }
  }
}

async function importPlanSettings(settings, report, tenantId) {
  if (!prisma.planSettings) {
    report.skipped++;
    return;
  }

  try {
    await prisma.planSettings.upsert({
      where: { tenantId },
      update: { defaultTrialDays: settings.defaultTrialDays },
      create: { tenantId, defaultTrialDays: settings.defaultTrialDays },
    });
    report.overwritten++;
  } catch (err) {
    report.errors.push({ section: "planSettings", error: err.message });
  }
}

async function importSubscribers(subscribers, strategy, report, tenantId) {
  if (!prisma.plan || !prisma.planSubscription || !prisma.planEnrollment) {
    report.skipped += subscribers.length;
    return;
  }

  for (const subscriber of subscribers) {
    try {
      const user = await prisma.user.findFirst({
        where: { email: subscriber.email, tenantId },
      });
      if (!user) {
        report.errors.push({
          email: subscriber.email,
          error:
            "Subscriber does not exist in target tenant; password setup is required",
        });
        continue;
      }
      if (strategy === "overwrite") {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: subscriber.name, role: subscriber.role },
        });
        report.overwritten++;
      } else {
        report.skipped++;
      }

      for (const subscription of subscriber.subscriptions ?? []) {
        const plan = await prisma.plan.findFirst({
          where: { slug: subscription.planSlug, tenantId },
        });
        if (!plan) continue;
        await prisma.planSubscription.upsert({
          where: { userId_planId: { userId: user.id, planId: plan.id } },
          update: {
            billingCycle: subscription.billingCycle,
            status: subscription.status,
            startsAt: new Date(subscription.startsAt),
            currentPeriodEnd: new Date(subscription.currentPeriodEnd),
            trialEndsAt: subscription.trialEndsAt
              ? new Date(subscription.trialEndsAt)
              : null,
            canceledAt: subscription.canceledAt
              ? new Date(subscription.canceledAt)
              : null,
          },
          create: {
            userId: user.id,
            planId: plan.id,
            billingCycle: subscription.billingCycle,
            status: subscription.status,
            startsAt: new Date(subscription.startsAt),
            currentPeriodEnd: new Date(subscription.currentPeriodEnd),
            trialEndsAt: subscription.trialEndsAt
              ? new Date(subscription.trialEndsAt)
              : null,
            canceledAt: subscription.canceledAt
              ? new Date(subscription.canceledAt)
              : null,
          },
        });
      }

      for (const enrollment of subscriber.enrollments ?? []) {
        const plan = await prisma.plan.findFirst({
          where: { slug: enrollment.planSlug, tenantId },
        });
        if (!plan) continue;
        await prisma.planEnrollment.upsert({
          where: { userId_planId: { userId: user.id, planId: plan.id } },
          update: { purchasedAt: new Date(enrollment.purchasedAt) },
          create: {
            userId: user.id,
            planId: plan.id,
            purchasedAt: new Date(enrollment.purchasedAt),
          },
        });
      }
    } catch (err) {
      report.errors.push({ email: subscriber.email, error: err.message });
    }
  }
}

// ─── Page Importer ────────────────────────────────────────
// Loops through each exported page and decides what to do
// based on whether the slug already exists and what strategy is set

async function importPages(pages, strategy, report, tenantId) {
  for (const page of pages) {
    try {
      const existing = await prisma.page.findFirst({
        where: { slug: page.slug, tenantId },
      });

      if (existing) {
        if (strategy === "skip") {
          report.skipped++;
          continue;
        }

        if (strategy === "overwrite") {
          await prisma.page.update({
            where: { id: existing.id },
            data: {
              title: page.title,
              html: page.html,
              css: page.css,
              js: page.js,
              jsxCode: page.jsxCode,
              pageType: page.pageType,
              status: page.status,
              seoData: page.seoData,
            },
          });
          report.overwritten++;
          continue;
        }

        if (strategy === "rename") {
          page.slug = await findFreeSlug(page.slug, "page", tenantId);
        }
      }

      await prisma.page.create({ data: { ...page, tenantId } });
      report.created++;
    } catch (err) {
      report.errors.push({ slug: page.slug, error: err.message });
    }
  }
}

// ─── Form Importer ───────────────────────────────────────
async function importForms(forms, strategy, report, tenantId) {
  for (const form of forms) {
    try {
      const existing = await prisma.form.findFirst({
        where: { slug: form.slug, tenantId },
      });

      if (existing) {
        if (strategy === "skip") {
          report.skipped++;
          continue;
        }

        if (strategy === "overwrite") {
          await prisma.form.update({
            where: { id: existing.id },
            data: {
              title: form.title,
              slug: form.slug,
              fields: form.fields,
              submitButtonLabel: form.submitButtonLabel,
              layout: form.layout,
              twoColumnHeading: form.twoColumnHeading,
              twoColumnParagraph: form.twoColumnParagraph,
              confirmationType: form.confirmationType,
              confirmationMessage: form.confirmationMessage,
              confirmationMessageClass: form.confirmationMessageClass,
              redirectUrl: form.redirectUrl,
              emails: form.emails,
              status: form.status,
            },
          });
          report.overwritten++;
          continue;
        }

        if (strategy === "rename") {
          form.slug = await findFreeSlug(form.slug, "form", tenantId);
        }
      }

      await prisma.form.create({ data: { ...form, tenantId } });
      report.created++;
    } catch (err) {
      report.errors.push({ slug: form.slug, error: err.message });
    }
  }
}

// ─── Collection Importer ────────────────────────────────
async function importCollections(
  collections,
  strategy,
  report,
  tenantId,
  fallbackUserId,
) {
  const imported = new Map();

  for (const item of collections) {
    try {
      const targetUserId = await resolveImportUserId(
        item.userEmail,
        tenantId,
        fallbackUserId,
      );
      const existing = await prisma.collection.findFirst({
        where: { tenantId, name: item.name, userId: targetUserId },
      });

      const data = {
        name: item.name,
        description: item.description ?? null,
        tenantId,
        userId: targetUserId,
      };

      if (existing && strategy === "skip") {
        imported.set(item.name, existing.id);
        report.skipped++;
        continue;
      }
      if (existing && strategy === "overwrite") {
        const updated = await prisma.collection.update({
          where: { id: existing.id },
          data,
        });
        imported.set(item.name, updated.id);
        report.overwritten++;
        continue;
      }
      if (existing) {
        data.name = `${item.name} (${Date.now()})`;
      }
      const created = await prisma.collection.create({ data });
      imported.set(item.name, created.id);
      report.created++;
    } catch (err) {
      report.errors.push({ name: item.name, error: err.message });
    }
  }

  return imported;
}

// ─── Media Importer ─────────────────────────────────────
async function importMedia(media, strategy, report, tenantId, collectionMap) {
  for (const item of media) {
    try {
      const existing = await prisma.media.findFirst({
        where: { tenantId, fileName: item.fileName },
      });

      const collectionId = item.collectionName
        ? (collectionMap.get(item.collectionName) ?? null)
        : null;

      const data = {
        fileName: item.fileName,
        originalName: item.originalName,
        url: item.url,
        publicId: item.publicId ?? null,
        mimeType: item.mimeType,
        size: item.size,
        width: item.width ?? null,
        height: item.height ?? null,
        altText: item.altText ?? null,
        title: item.title ?? null,
        caption: item.caption ?? null,
        description: item.description ?? null,
        tenantId,
        collectionId,
      };

      if (existing) {
        if (strategy === "skip") {
          report.skipped++;
          continue;
        }
        if (strategy === "overwrite") {
          await prisma.media.update({
            where: { id: existing.id },
            data,
          });
          report.overwritten++;
          continue;
        }
        if (strategy === "rename") {
          data.fileName = await findFreeFileName(item.fileName, tenantId);
        }
      }

      await prisma.media.create({ data });
      report.created++;
    } catch (err) {
      report.errors.push({ fileName: item.fileName, error: err.message });
    }
  }
}

// ─── Menu Importer ────────────────────────────────────────
// Menus don't have slugs in your schema, so we match by name instead.
// Items are stored as a nested tree in the export file,
// so we flatten them back when writing to DB, rebuilding parentId links
// using the newly created IDs from the target DB

async function importMenus(menus, strategy, report, tenantId) {
  for (const menu of menus) {
    try {
      const existing = await prisma.menu.findFirst({
        where: { name: menu.name, tenantId },
      });

      if (existing) {
        if (strategy === "skip") {
          report.skipped++;
          continue;
        }

        if (strategy === "overwrite") {
          await prisma.menuItem.deleteMany({ where: { menuId: existing.id } });
          await insertMenuItems(menu.items, existing.id, null);
          await prisma.menu.update({
            where: { id: existing.id },
            data: { location: menu.location },
          });
          report.overwritten++;
          continue;
        }

        if (strategy === "rename") {
          menu.name = `${menu.name} (imported)`;
        }
      }

      const created = await prisma.menu.create({
        data: { name: menu.name, location: menu.location, tenantId },
      });

      await insertMenuItems(menu.items, created.id, null);
      report.created++;
    } catch (err) {
      report.errors.push({ name: menu.name, error: err.message });
    }
  }
}

// ─── Menu Item Inserter ───────────────────────────────────
// Takes the nested children tree from the export file and
// writes it back to DB as flat rows with correct parentId references.
// We recurse depth-first: create parent first, get its new DB id,
// then create children with that id as their parentId

async function insertMenuItems(items, menuId, parentId) {
  for (const { children, ...itemData } of items) {
    const created = await prisma.menuItem.create({
      data: {
        ...itemData,
        menuId,
        parentId, // null for top-level, parent's new DB id for nested
      },
    });

    // If this item has children, recurse with this item's new id as parentId
    if (children?.length) {
      await insertMenuItems(children, menuId, created.id);
    }
  }
}

// ─── Slug Rename Helper ───────────────────────────────────
// Used when strategy is 'rename'. Tries slug-1, slug-2 etc.
// until it finds one that doesn't exist in the DB

async function resolveImportUserId(userEmail, tenantId, fallbackUserId) {
  if (!userEmail) return fallbackUserId;

  const user = await prisma.user.findFirst({
    where: { email: userEmail, tenantId },
    select: { id: true },
  });

  return user?.id ?? fallbackUserId;
}

async function findFreeSlug(baseSlug, type, tenantId) {
  let counter = 1;
  let candidate = `${baseSlug}-${counter}`;

  while (true) {
    const model =
      type === "page"
        ? prisma.page
        : type === "post"
          ? prisma.post
          : type === "plan"
            ? prisma.plan
            : type === "category"
              ? prisma.category
              : type === "fileCategory"
                ? prisma.fileCategory
                : type === "form"
                  ? prisma.form
                  : prisma.tag;
    const exists = await model.findFirst({
      where: { slug: candidate, tenantId },
    });

    if (!exists) return candidate;
    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
}

async function findFreeFileName(baseFileName, tenantId) {
  const extension = baseFileName.includes(".")
    ? baseFileName.slice(baseFileName.lastIndexOf("."))
    : "";
  const nameWithoutExtension = extension
    ? baseFileName.slice(0, baseFileName.lastIndexOf("."))
    : baseFileName;

  let counter = 1;
  let candidate = `${nameWithoutExtension}-${counter}${extension}`;

  while (true) {
    const exists = await prisma.media.findFirst({
      where: { fileName: candidate, tenantId },
    });

    if (!exists) return candidate;
    counter++;
    candidate = `${nameWithoutExtension}-${counter}${extension}`;
  }
}
