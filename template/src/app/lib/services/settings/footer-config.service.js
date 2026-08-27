import { prisma } from "../../prisma.js";
// import { requireAuth, requirePermission } from "../withPermission.js";

import { requireAuth, requirePermission } from "../../withPermission.js";

const DEFAULT_CONFIG = {
  bgColor: "#0B0F1A",
  borderColor: "#ffffff",
  borderOpacity: 8,
  headingColor: "#ffffff",
  textColor: "#cbd5e1",
  mutedTextColor: "#94a3b8",
  bottomTextColor: "#64748b",
  accentColor: "#22d3ee",
  accentHoverColor: "#67e8f9",
  ctaTextColor: "#0f172a",
  eyebrowText: "Let's Start a Conversation",
  headline: "Ready to grow your business?",
  showCta: true,
  customCss: "",
};

export async function getPublicFooterConfig(tenantId) {
  const config = await prisma.footerConfig.findUnique({
    where: { tenantId: Number(tenantId) },
  });
  return config ?? DEFAULT_CONFIG;
}

export async function getFooterConfig() {
  await requirePermission("settings_edit");
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const config = await prisma.footerConfig.findUnique({ where: { tenantId } });
  return config ?? { ...DEFAULT_CONFIG, tenantId };
}

export async function updateFooterConfig(input) {
  await requirePermission("settings_edit");
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const { id: _, tenantId: __, createdAt, updatedAt, ...cleanInput } = input;

  return prisma.footerConfig.upsert({
    where: { tenantId },
    update: cleanInput,
    create: { ...DEFAULT_CONFIG, ...cleanInput, tenantId },
  });
}

export async function resetFooterConfig() {
  await requirePermission("settings_edit");
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return prisma.footerConfig.upsert({
    where: { tenantId },
    update: DEFAULT_CONFIG,
    create: { ...DEFAULT_CONFIG, tenantId },
  });
}
