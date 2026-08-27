import { verifyToken } from "@/src/app/lib/jwt";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminShell } from "@/src/app/admin/AdminShell";
import { prisma } from "@/src/app/lib/prisma";
import { ensurePermissionsSeeded } from "@/src/app/lib/startup";

function buildVisibleModules(
  role: string | undefined,
  permissions: Array<{ name: string; roles?: Array<{ role: string }> }>,
) {
  const modules: Record<string, boolean> = {};

  permissions.forEach((permission) => {
    modules[permission.name] =
      role === "SUPER_ADMIN" ||
      role === "ADMIN" ||
      Boolean(permission.roles?.some((entry) => entry.role === role));
  });

  return modules;
}

async function getPermissionsForSidebar() {
  await ensurePermissionsSeeded();

  const permissions = await prisma.permission.findMany({
    orderBy: { name: "asc" },
  });
  const rolePermissions = await prisma.rolePermission.findMany({
    select: {
      role: true,
      permissionId: true,
    },
  });

  const rolesByPermissionId = rolePermissions.reduce<
    Record<string | number, Array<{ role: string }>>
  >((acc, rolePermission) => {
    acc[rolePermission.permissionId] ??= [];
    acc[rolePermission.permissionId].push({ role: rolePermission.role });
    return acc;
  }, {});

  return permissions.map((permission) => ({
    ...permission,
    roles: rolesByPermissionId[permission.id] ?? [],
  }));
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyToken(token);

  if (!payload) {
    redirect("/login");
  }

  if (payload.role === "SUBSCRIBER") {
    redirect("/dashboard");
  }

  const permissions = await getPermissionsForSidebar();
  const visibleModules = buildVisibleModules(payload.role, permissions);

  return (
    <AdminShell user={payload} visibleModules={visibleModules}>
      {children}
    </AdminShell>
  );
}
