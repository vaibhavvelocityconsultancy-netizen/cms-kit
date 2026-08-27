import { verifyToken } from "@/src/app/lib/jwt";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { prisma } from "@/src/app/lib/prisma";
import { canManageUser } from "./permissions";
import { ensurePermissionsSeeded } from "./startup";
import { cookies } from "next/headers";

// ── Get session or throw 401 ──────────────────────────────

export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) throw new ApiError(401, "Unauthorized — please log in");

  const payload = await verifyToken(token);
  if (!payload) throw new ApiError(401, "Unauthorized — please log in");

  return {
    user: {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      tenantId: Number(payload.tenantId),
    },
  };
}

// ── Check permission purely from DB ──────────────────────

const permissionIdCache = new Map();

async function getPermissionId(permission) {
  if (permissionIdCache.has(permission)) {
    return permissionIdCache.get(permission);
  }

  const permissionRecord = await prisma.permission.findUnique({
    where: { name: permission },
  });

  const id = permissionRecord?.id ?? null;
  permissionIdCache.set(permission, id);
  return id;
}

async function checkPermissionFromDB(role, permission, userId) {
  // SUPER_ADMIN always has everything
  if (role === "SUPER_ADMIN") return true;

  const permissionId = await getPermissionId(permission);
  if (!permissionId) return false;

  const [userOverride, rolePermission] = await prisma.$transaction([
    prisma.userPermission.findFirst({
      where: {
        userId,
        permissionId,
      },
    }),
    prisma.rolePermission.findFirst({
      where: {
        role,
        permissionId,
      },
    }),
  ]);

  if (userOverride !== null) {
    return userOverride.allowed;
  }

  return rolePermission !== null;
}

// ── Require a specific permission ─────────────────────────

export async function requirePermission(permission) {
  const session = await requireAuth();
  const role = session.user.role;
  const userId = Number(session.user.id);

  // Auto-seed on first run
  await ensurePermissionsSeeded();

  const allowed = await checkPermissionFromDB(role, permission, userId);

  if (!allowed) {
    throw new ApiError(
      403,
      `Forbidden — you don't have permission: ${permission}`,
    );
  }

  return { session, role, userId };
}

// ── Require actor can manage target user ──────────────────

export async function requireCanManageUser(targetUserId) {
  const session = await requireAuth();
  const actorRole = session.user.role;
  const actorId = Number(session.user.id);

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true },
  });

  if (!targetUser) throw new ApiError(404, "User not found");
  if (actorId === targetUserId) {
    throw new ApiError(400, "Cannot manage your own account this way");
  }
  if (!canManageUser(actorRole, targetUser.role)) {
    throw new ApiError(
      403,
      "Forbidden — you cannot manage a user with equal or higher role",
    );
  }

  return { session, actorRole, targetUser };
}
