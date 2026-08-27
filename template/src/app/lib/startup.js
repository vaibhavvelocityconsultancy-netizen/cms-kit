import {
  ALL_PERMISSIONS,
  ALL_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
} from "./permissions.js";
import { prisma } from "./prisma.js";
// import {
//   DEFAULT_ROLE_PERMISSIONS,
//   ALL_PERMISSIONS,
//   ALL_ROLES,
// } from "../src/lib/permissions.js";
let seeded = false; // in-memory flag — only seed once per server start

export async function ensurePermissionsSeeded() {
  if (seeded) return;

  try {
    console.log("🔍 Ensuring permissions are seeded...");
    await seedAll();
    console.log("✅ Permission seeding complete!");
    seeded = true;
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
  }
}
async function seedAll() {
  // 1. Create permission records
  for (const name of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: formatLabel(name),
      },
    });
  }

  // 2. Create role-permission mappings
  for (const [permName, roles] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const permission = await prisma.permission.findUnique({
      where: { name: permName },
    });
    if (!permission) continue;

    for (const role of ALL_ROLES) {
      const hasIt = roles.includes(role);
      if (hasIt) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role,
              permissionId: permission.id,
            },
          },
          update: {},
          create: { role, permissionId: permission.id },
        });
      }
    }
  }
}

function formatLabel(name) {
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
