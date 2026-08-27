// import { prisma } from "../prisma.js";
// import { requireAuth, requirePermission } from "../withPermission.js";

import { prisma } from "../../prisma";
import { requireAuth, requirePermission } from "../../withPermission";

// ─── Helpers ──────────────────────────────────────────────

const DEFAULT_CONFIG = {
  bgColor: "#0B0F1A",
  bgOpacity: 90,
  linkColor: "#cbd5e1",
  linkHoverColor: "#ffffff",
  accentColor: "#22d3ee",
  dropdownBg: "#111827",
  sticky: true,
  blur: true,
  showLogin: true,
  showSignup: true,
  showPricing: true,
  loginLabel: "Log In",
  signupLabel: "Sign Up",
  pricingLabel: "Pricing",
  customCss: "",
};

// ─── Services ─────────────────────────────────────────────

// Public read — no auth, used by SiteNavbar on public pages
export async function getPublicNavbarConfig(tenantId) {
  const config = await prisma.navbarConfig.findUnique({
    where: { tenantId: Number(tenantId) },
  });

  return config ?? DEFAULT_CONFIG;
}

// Admin read — used by the admin editor to load current + defaults
export async function getNavbarConfig() {
  await requirePermission("settings_edit");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const config = await prisma.navbarConfig.findUnique({
    where: { tenantId },
  });

  return config ?? { ...DEFAULT_CONFIG, tenantId };
}

// Admin write — upsert since it's a singleton per tenant
export async function updateNavbarConfig(input) {
  await requirePermission("settings_edit");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const { id: _, tenantId: __, createdAt, updatedAt, ...cleanInput } = input;

  const config = await prisma.navbarConfig.upsert({
    where: { tenantId },
    update: cleanInput,
    create: {
      ...DEFAULT_CONFIG,
      ...cleanInput,
      tenantId,
    },
  });

  return config;
}

export async function resetNavbarConfig() {
  await requirePermission("settings_edit");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const config = await prisma.navbarConfig.upsert({
    where: { tenantId },
    update: DEFAULT_CONFIG,
    create: { ...DEFAULT_CONFIG, tenantId },
  });

  return config;
}
