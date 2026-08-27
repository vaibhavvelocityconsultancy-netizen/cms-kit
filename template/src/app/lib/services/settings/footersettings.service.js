import { prisma } from "../../prisma.js";
import { requirePermission } from "../../withPermission.js";

// GET setting by key
export async function getSetting(key) {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  const setting = await prisma.footerSettings.findFirst({
    where: { key, tenantId },
  });

  return setting ? setting.value : null;
}

// GET all settings
export async function getAllSettings() {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  const settings = await prisma.footerSettings.findMany({
    where: { tenantId },
  });

  return settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
}

// UPSERT
export async function upsertSetting(key, value) {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  return prisma.footerSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value, tenantId },
  });
}

// DELETE
export async function deleteSetting(key) {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  const setting = await prisma.footerSettings.findFirst({
    where: { key, tenantId },
  });
  if (!setting) {
    throw new Error("Setting not found");
  }

  return prisma.footerSettings.delete({
    where: { id: setting.id },
  });
}
