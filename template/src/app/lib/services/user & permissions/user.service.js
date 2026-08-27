import bcrypt from "bcryptjs";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { canManageUser, normalizeRole } from "../../permissions";
import {
  requireCanManageUser,
  requireAuth,
  requirePermission,
} from "../../withPermission";
// import { create } from "domain";
// import { permission } from "process";
// import { id } from "date-fns/locale";

const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,

  _count: {
    select: {
      post: true,
      comment: true,
    },
  },
  userpermission: {
    select: {
      id: true,
      allowed: true,
      permission: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  },
};

// get all users
export const getUsers = async () => {
  await requirePermission("users_view");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  // fetch all users with their permissions
  const users = await prisma.user.findMany({
    where: {
      tenantId: tenantId,
    },
    orderBy: {
      createdAt: "desc", // latest users first
    },
    select: safeSelect,
  });
  return users;
};

// get single user by id

export const getUserById = async (id) => {
  await requirePermission("users_view");

  // fetch user with their permissions
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const user = await prisma.user.findUnique({
    where: {
      id: Number(id),
      tenantId: tenantId,
    },
    select: safeSelect,
  });

  // validate if user not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

// create new user
export const createUser = async ({ name, email, password, role }) => {
  await requirePermission("users_create");

  // validate inputs
  if (!name?.trim()) {
    throw new ApiError(400, "Name is required");
  }
  if (!email?.trim()) throw new ApiError(400, "Email is required");
  if (!password?.trim()) throw new ApiError(400, "Password is required");
  if (!role?.trim()) throw new ApiError(400, "Role is required");
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) throw new ApiError(400, "Invalid role");

  // check if user already exists
  const exisitngUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  // if user exists throw error
  if (exisitngUser) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  // create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      tenantId,
    },
    select: safeSelect, // return user with permissions
  });

  return user;
};

// update user
export async function updateUser(id, { name, email }) {
  await requirePermission("users_edit");
  await requireCanManageUser(Number(id));

  // fetch user to check if it exists and also to get current permissions
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const user = await prisma.user.findUnique({
    where: {
      id: Number(id),
      tenantId: tenantId,
    },
  });
  if (!user) throw new ApiError(404, "User not found");

  return prisma.user.update({
    where: {
      id: Number(id),
      tenantId: tenantId,
    },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
    },
    select: safeSelect,
  });
}

// ── Change role ───────────────────────────────────────────

export async function changeUserRole(id, newRole, actorRole) {
  await requirePermission("users_change_role");

  if (!actorRole) {
    const session = await requireAuth();
    actorRole = session.user.role;
  }

  const normalizedRole = normalizeRole(newRole);
  if (!normalizedRole) throw new ApiError(400, "Invalid role");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const user = await prisma.user.findUnique({
    where: { id: Number(id), tenantId: tenantId },
  });
  if (!user) throw new ApiError(404, "User not found");

  // Cannot change role of someone equal or higher
  if (!canManageUser(actorRole, user.role)) {
    throw new ApiError(
      403,
      "Cannot change role of a user with equal or higher role",
    );
  }

  // Cannot assign a role equal or higher than your own
  if (!canManageUser(actorRole, normalizedRole)) {
    throw new ApiError(
      403,
      "Cannot assign a role equal or higher than your own",
    );
  }

  return prisma.user.update({
    where: { id: Number(id), tenantId: tenantId },
    data: { role: normalizedRole },
    select: safeSelect,
  });
}

// ── Delete user ───────────────────────────────────────────

export async function deleteUser(id, actorRole) {
  await requirePermission("users_delete");

  if (!actorRole) {
    const session = await requireAuth();
    actorRole = session.user.role;
  }
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const user = await prisma.user.findUnique({
    where: {
      id: Number(id),
      tenantId: tenantId,
    },
  });
  if (!user) throw new ApiError(404, "User not found");

  if (!canManageUser(actorRole, user.role)) {
    throw new ApiError(403, "Cannot delete a user with equal or higher role");
  }

  // Prevent deleting last super admin
  if (user.role === "SUPER_ADMIN") {
    const session = await requireAuth();

    const superAdminCount = await prisma.user.count({
      where: {
        role: "SUPER_ADMIN",
        tenantId: session.user.tenantId,
      },
    });
    if (superAdminCount <= 1) {
      throw new ApiError(400, "Cannot delete the last Super Admin");
    }
  }

  return prisma.user.delete({ where: { id: Number(id), tenantId: tenantId } });
}

// ── Update own profile (no permission check) ──────────────
export async function updateOwnProfile(id, { name, password }) {
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (password !== undefined)
    updateData.password = await bcrypt.hash(password, 10);

  const session = await requireAuth();

  const user = await prisma.user.findFirst({
    where: {
      id: Number(id),
      tenantId: session.user.tenantId,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
}

// ── Get/set user-specific permission overrides ────────────

export async function getUserPermissions(userId) {
  await requirePermission("users_view");

  return prisma.userPermission.findMany({
    where: { userId: Number(userId) },
    include: { permission: true },
  });
}

export async function setUserPermission(userId, permissionName, allowed) {
  await requirePermission("users_edit");

  const permission = await prisma.permission.findUnique({
    where: { name: permissionName },
  });
  if (!permission)
    throw new ApiError(404, `Permission "${permissionName}" not found`);

  return prisma.userPermission.upsert({
    where: {
      userId_permissionId: {
        userId: Number(userId),
        permissionId: permission.id,
      },
    },
    update: { allowed },
    create: {
      userId: Number(userId),
      permissionId: permission.id,
      allowed,
    },
  });
}

export async function removeUserPermission(userId, permissionName) {
  await requirePermission("users_edit");

  const permission = await prisma.permission.findUnique({
    where: {
      name: permissionName,
    },
  });
  if (!permission)
    throw new ApiError(404, `Permission "${permissionName}" not found`);

  return prisma.userPermission.deleteMany({
    where: {
      userId: Number(userId),
      permissionId: permission.id,
    },
  });
}
