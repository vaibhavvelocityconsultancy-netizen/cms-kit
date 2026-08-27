"use client";

import { ROLE_LABELS } from "@/src/app/lib/permissions";
import { authApi } from "@/src/lib/auth";
import { useEffect, useState } from "react";

type RoleName =
  "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR" | "VIEWER" | "SUBSCRIBER";

interface PermissionRow {
  id: number;
  name: string;
  description: string;
  roles: string[]; // always flat strings after normalization
}

function getCategory(name: string): string {
  const prefix = name.split("_")[0];
  const map: Record<string, string> = {
    pages: "Pages",
    posts: "Posts",
    comments: "Comments",
    media: "Media",
    taxonomy: "Taxonomy",
    menus: "Menus",
    users: "Users",
    settings: "Settings",
    global: "Settings",
    courses: "Courses",
    course: "Courses",
    plans: "Plans",
  };
  return map[prefix] ?? "Other";
}

export function PermissionsSection() {
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string>("");
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data } = await authApi.permissions();

      // ← KEY FIX: flatten [{role: "ADMIN"}] → ["ADMIN"]
      const normalized = (data.data ?? []).map((p: any) => ({
        ...p,
        roles: p.roles.map((r: any) => (typeof r === "string" ? r : r.role)),
      }));

      setPermissions(normalized);
    } catch {
      setError("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  async function handleSeed() {
    try {
      setSeeding(true);
      setError("");
      const { data } = await authApi.seedPermissions();
      if (!data.success) {
        setError(data.message || "Seeding failed");
        return;
      }
      setSuccess("Permissions reset to defaults");
      setTimeout(() => setSuccess(""), 3000);
      fetchPermissions();
    } catch {
      setError("Network error");
    } finally {
      setSeeding(false);
    }
  }

  async function handleToggle(
    permissionName: string,
    role: string,
    currentlyHas: boolean,
  ) {
    const key = `${role}-${permissionName}`;
    setSaving(key);
    setError("");

    try {
      const { data } = await authApi.updatePermissionRole({
        role,
        permission: permissionName,
        allowed: !currentlyHas,
      });

      if (!data.success) {
        setError(data.message || "Failed to update");
        return;
      }

      // Update local state — roles are flat strings
      setPermissions((prev) =>
        prev.map((p) => {
          if (p.name !== permissionName) return p;
          const updatedRoles = currentlyHas
            ? p.roles.filter((r) => r !== role)
            : [...p.roles, role];
          return { ...p, roles: updatedRoles };
        }),
      );
    } catch {
      setError("Network error");
    } finally {
      setSaving("");
    }
  }

  const grouped = permissions.reduce<Record<string, PermissionRow[]>>(
    (acc, p) => {
      const cat = getCategory(p.name);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    },
    {},
  );

  const displayRoles: RoleName[] = [
    "ADMIN",
    "EDITOR",
    "AUTHOR",
    "VIEWER",
    "SUBSCRIBER",
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground mb-1">
            Roles & Permissions
          </h1>
          <p className="text-sm font-mono text-muted-foreground">
            Toggle permissions per role — changes take effect immediately
          </p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="px-4 py-2 bg-muted text-muted-foreground text-sm rounded-lg hover:bg-muted/80 disabled:opacity-50 transition-colors"
        >
          {seeding ? "Seeding..." : "Reset to Defaults"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg">
          ✓ {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading permissions...
        </div>
      ) : permissions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No permissions found in database.</p>
          <button
            onClick={handleSeed}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg"
          >
            Seed Permissions Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, perms]) => (
            <div
              key={category}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              <div className="bg-muted/50 px-4 py-3 border-b border-border flex justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  {category}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {perms.length} permissions
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground w-64">
                        Permission
                      </th>
                      {displayRoles.map((role) => (
                        <th
                          key={role}
                          className="text-center px-4 py-3 font-medium text-muted-foreground"
                        >
                          {ROLE_LABELS[role]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {perms.map((perm) => (
                      <>
                        <tr
                          key={perm.name}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground text-xs font-mono">
                              {perm.name}
                            </p>
                            {perm.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {perm.description}
                              </p>
                            )}
                          </td>

                          {displayRoles.map((role) => {
                            const hasIt = perm.roles.includes(role); // ✅ now works — flat strings
                            const key = `${role}-${perm.name}`;
                            const isBusy = saving === key;

                            return (
                              <td key={role} className="px-4 py-3 text-center">
                                <button
                                  onClick={() =>
                                    handleToggle(perm.name, role, hasIt)
                                  }
                                  disabled={isBusy}
                                  className={`w-10 h-5 rounded-full transition-colors relative disabled:opacity-50 ${
                                    hasIt ? "bg-green-500" : "bg-gray-200"
                                  }`}
                                  title={`${hasIt ? "Remove" : "Grant"} ${perm.name} for ${ROLE_LABELS[role]}`}
                                >
                                  <span
                                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                      hasIt
                                        ? "translate-x-5"
                                        : "translate-x-0.5"
                                    }`}
                                  />
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <strong>Super Admin</strong> always has all permissions and cannot
            be restricted.
          </div>
        </div>
      )}
    </div>
  );
}
