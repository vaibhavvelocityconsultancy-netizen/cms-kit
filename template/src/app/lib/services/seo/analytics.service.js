import { prisma } from "../../prisma";
import { requireAuth, requirePermission } from "../../withPermission";

export async function getAnalyticsSettings() {
  await requirePermission("settings_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const settings = await prisma.analyticsSettings.findUnique({
    where: { tenantId },
  });

  return (
    settings || {
      gtmId: "",
      gtmHeadScript: "",
      gtmBodyScript: "",

      gaMeasurementId: "",
      gaHeadScript: "",

      facebookPixelId: "",
      facebookHeadScript: "",

      googleAdsId: "",
      googleAdsHeadScript: "",
    }
  );
}

export async function updateAnalyticsSettings(input) {
  await requirePermission("settings_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const { id, tenantId: _, createdAt, updatedAt, ...data } = input;

  return prisma.analyticsSettings.upsert({
    where: {
      tenantId,
    },

    update: data,

    create: {
      tenantId,
      ...data,
    },
  });
}
