import { prisma } from "../../prisma.js";
import { requireAuth, requirePermission } from "../../withPermission.js";

// ─── Constants ────────────────────────────────────────────

export const VALID_LOCATIONS = ["header", "footer"];
export const VALID_ITEM_TYPES = ["page", "custom"];

// ─── Validators ───────────────────────────────────────────

// fix 1: location validation
function validateLocation(location) {
  if (!location) {
    throw new Error("Menu location is required");
  }
  if (!VALID_LOCATIONS.includes(location)) {
    throw new Error(`Location must be one of: ${VALID_LOCATIONS.join(", ")}`);
  }
}

// fix 2 + 3 + 4: menu item validation
async function validateMenuItem(item, tenantId) {
  if (!item.label || !item.label.trim()) {
    throw new Error("Item label is required");
  }

  if (!item.type) {
    throw new Error("Item type is required");
  }

  if (!VALID_ITEM_TYPES.includes(item.type)) {
    throw new Error(`Item type must be one of: ${VALID_ITEM_TYPES.join(", ")}`);
  }

  if (item.type === "page") {
    const page = await prisma.page.findFirst({
      where: {
        slug: item.slug,
        tenantId,
      },
    });

    if (!page) {
      throw new Error(`Page not found: ${item.slug}`);
    }
  }

  if (item.type === "custom") {
    if (!item.url || !item.url.trim()) {
      throw new Error("Custom items must have a url");
    }
  }
}

async function getTenantMenu(menuId, tenantId) {
  const menu = await prisma.menu.findFirst({
    where: {
      id: Number(menuId),
      tenantId,
    },
    include: {
      menuitem: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!menu) {
    throw new Error("Menu not found");
  }

  return menu;
}

// ─── Services ─────────────────────────────────────────────

// GET all menus with items
export async function getAllMenus() {
  await requirePermission("menus_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return prisma.menu.findMany({
    where: { tenantId },
    include: {
      menuitem: {
        orderBy: { order: "asc" },
      },
    },
  });
}

// GET single menu by ID
export async function getMenuById(id) {
  await requirePermission("menus_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return getTenantMenu(id, tenantId);
}

// GET menu by location — fix 6: findFirst for location scopes
export async function getMenuByLocation(location, tenantId) {
  validateLocation(location);

  const where = { location };
  if (tenantId !== undefined) {
    where.tenantId = tenantId;
  }

  const menu = await prisma.menu.findFirst({
    where,
    include: {
      menuitem: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!menu) {
    throw new Error(`No menu found for location: ${location}`);
  }

  return menu;
}

// CREATE menu
export async function createMenu(input) {
  await requirePermission("menus_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const { name, location, items = [] } = input;

  validateLocation(location);

  await Promise.all(
    items.map(async (item, index) => {
      try {
        await validateMenuItem(item, tenantId);
      } catch (err) {
        throw new Error(`Item ${index + 1}: ${err.message}`);
      }
    }),
  );

  return prisma.menu.create({
    data: {
      name,
      location,
      tenantId,
      menuitem: {
        create: items.map((item, index) => ({
          label: item.label.trim(),
          type: item.type,
          slug: item.slug?.trim() ?? null,
          url: item.url?.trim() ?? null,
          order: item.order ?? index,
        })),
      },
    },
    include: {
      menuitem: {
        orderBy: { order: "asc" },
      },
    },
  });
}

// UPDATE menu — fix 7: also updates items (delete + recreate)
export async function updateMenu(id, input) {
  await requirePermission("menus_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const { name, location, items } = input;

  await getTenantMenu(id, tenantId);

  if (location) {
    validateLocation(location);
  }

  // fix 7: if items provided — delete all old + recreate
  if (items !== undefined) {
    // fix 2 + 3 + 4: validate each new item
    await Promise.all(
      items.map(async (item, index) => {
        try {
          await validateMenuItem(item, tenantId);
        } catch (err) {
          throw new Error(`Item ${index + 1}: ${err.message}`);
        }
      }),
    );

    // delete old items (cascade handles this but explicit is cleaner here)
    await prisma.menuItem.deleteMany({
      where: { menuId: Number(id) },
    });

    // recreate with new items
    await prisma.menuItem.createMany({
      data: items.map((item, index) => ({
        label: item.label.trim(),
        type: item.type, // fix 3
        slug: item.slug?.trim() ?? null,
        url: item.url?.trim() ?? null,
        order: item.order ?? index,
        menuId: Number(id),
      })),
    });
  }

  // update menu name/location
  return prisma.menu.update({
    where: { id: Number(id) },
    data: {
      ...(name && { name }),
      ...(location && { location }),
    },
    include: {
      menuitem: {
        orderBy: { order: "asc" },
      },
    },
  });
}

// DELETE menu — fix 5: cascade handles items automatically
export async function deleteMenu(id) {
  await requirePermission("menus_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  await getTenantMenu(id, tenantId);

  return prisma.menu.delete({
    where: { id: Number(id) },
  });
}

// ─── Menu Items ───────────────────────────────────────────

// ADD item to menu
export async function addMenuItem(menuId, input) {
  await requirePermission("menus_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  await getMenuById(menuId);
  await validateMenuItem(input, tenantId);

  const lastItem = await prisma.menuItem.findFirst({
    where: { menuId: Number(menuId) },
    orderBy: { order: "desc" },
  });

  const nextOrder = lastItem ? lastItem.order + 1 : 0;

  return prisma.menuItem.create({
    data: {
      label: input.label.trim(),
      type: input.type, // fix 3
      slug: input.slug?.trim() ?? null,
      url: input.url?.trim() ?? null,
      order: input.order ?? nextOrder,
      menuId: Number(menuId),
    },
  });
}

// UPDATE single item
export async function updateMenuItem(menuId, itemId, input) {
  await requirePermission("menus_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  await getMenuById(menuId);

  // fix 8: check item exists
  const existing = await prisma.menuItem.findUnique({
    where: { id: Number(itemId) },
  });

  if (!existing) {
    throw new Error("Menu item not found");
  }

  if (existing.menuId !== Number(menuId)) {
    throw new Error("Menu item not found");
  }

  // fix 2 + 3 + 4: validate updated item
  await validateMenuItem(input, tenantId);

  return prisma.menuItem.update({
    where: { id: Number(itemId) },
    data: {
      label: input.label.trim(),
      type: input.type, // fix 3
      slug: input.slug?.trim() ?? null,
      url: input.url?.trim() ?? null,
      order: input.order ?? existing.order,
    },
  });
}

// DELETE single item
export async function deleteMenuItem(menuId, itemId) {
  await requirePermission("menus_manage");

  await getMenuById(menuId);

  // fix 8: check exists
  const existing = await prisma.menuItem.findUnique({
    where: { id: Number(itemId) },
  });

  if (!existing) {
    throw new Error("Menu item not found");
  }

  if (existing.menuId !== Number(menuId)) {
    throw new Error("Menu item not found");
  }

  return prisma.menuItem.delete({
    where: { id: Number(itemId) },
  });
}

// REORDER items — accepts array of { id, order }
export async function reorderMenuItems(menuId, items) {
  await requirePermission("menus_manage");

  await getMenuById(menuId);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items must be a non-empty array");
  }

  const existingItems = await prisma.menuItem.findMany({
    where: { menuId: Number(menuId) },
  });

  const existingIds = new Set(existingItems.map((item) => item.id));

  for (const [index, item] of items.entries()) {
    if (!item.id) throw new Error(`Item ${index + 1} missing id`);
    if (item.order === undefined) {
      throw new Error(`Item ${index + 1} missing order`);
    }

    if (!existingIds.has(Number(item.id))) {
      throw new Error(`Item ${item.id} does not belong to this menu`);
    }

    if (item.parentId === item.id) {
      throw new Error("Item cannot be its own parent");
    }

    if (item.parentId) {
      const parentExists = existingItems.find(
        (existing) => existing.id === Number(item.parentId),
      );

      if (!parentExists) {
        throw new Error(`Parent item ${item.parentId} not found in this menu`);
      }
    }
  }

  return prisma.$transaction(
    items.map((item) =>
      prisma.menuItem.update({
        where: { id: Number(item.id) },
        data: {
          order: item.order,
          parentId: item.parentId ?? null,
        },
      }),
    ),
  );
}
