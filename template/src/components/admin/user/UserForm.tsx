"use client";

import { useState, useEffect } from "react";
import { UserPlus, Loader2, Trash2, X, Shield, Pencil } from "lucide-react";
import { getBaseUrl } from "@/src/lib/config";
import { ALL_ROLES, ROLE_LABELS, ROLE_COLORS } from "@/src/app/lib/permissions";
import { useCurrentUser } from "@/src/hooks/use-current-user";
// import { DataTable, Column } from "@/src/components/DataTabl
import { Button } from "@/src/ui/button";
import { DataTable, Column } from "@/src/ui/data-table";

type RoleName = keyof typeof ROLE_LABELS;

function isRoleName(role: string): role is RoleName {
  return role in ROLE_LABELS;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// ── Role Badge ────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role as RoleName] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}
    >
      <Shield size={10} />
      {isRoleName(role) ? ROLE_LABELS[role] : role}
    </span>
  );
}

// ── Create User Modal ─────────────────────────────────────

function UserFormModal({
  actorRole,
  onSuccess,
  onCancel,
  editingUser = null,
}: {
  actorRole: string;
  onSuccess: () => void;
  onCancel: () => void;
  editingUser?: User | null;
}) {
  const [form, setForm] = useState({
    name: editingUser?.name || "",
    email: editingUser?.email || "",
    password: "",
    role: editingUser?.role || "SUBSCRIBER",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const availableRoles = ALL_ROLES.filter((r) => {
    if (actorRole === "SUPER_ADMIN") return true;
    if (actorRole === "ADMIN") return r !== "SUPER_ADMIN";
    return false;
  });

  const isEditMode = !!editingUser;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        isEditMode
          ? `${getBaseUrl()}/api/users/${editingUser.id}`
          : `${getBaseUrl()}/api/users`,
        {
          method: isEditMode ? "PATCH" : "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(form),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.message || `Failed to ${isEditMode ? "update" : "create"} user`,
        );

        return;
      }

      setSuccess(true);

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isEditMode ? "Edit User" : "Create New User"}{" "}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEditMode
                ? "Update user details"
                : "Add a new user account to the system"}{" "}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="px-4 py-3 bg-green-500/10 border border-green-500/20 text-green-600 text-sm rounded-lg">
              ✓ User created successfully!
            </div>
          )}
          {error && (
            <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email Address <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="john@example.com"
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password <span className="text-destructive">*</span>
              </label>

              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                required
                placeholder="Minimum 8 characters"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Role <span className="text-destructive">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {isRoleName(r) ? ROLE_LABELS[r] : r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <UserPlus size={14} />
              )}
              {loading
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create User"}{" "}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main UsersSection ─────────────────────────────────────

export function UserForm() {
  const { user: session } = useCurrentUser();
  const actorRole = (session?.role as any) ?? "";
  const actorId = session?.id;
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canCreateUsers = actorRole === "SUPER_ADMIN" || actorRole === "ADMIN";
  const canDeleteUsers = actorRole === "SUPER_ADMIN" || actorRole === "ADMIN";
  const canChangeRoles = actorRole === "SUPER_ADMIN" || actorRole === "ADMIN";

  const availableRoles = ALL_ROLES.filter((r) => {
    if (actorRole === "SUPER_ADMIN") return true;
    if (actorRole === "ADMIN") return r !== "SUPER_ADMIN";
    return false;
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getBaseUrl()}/api/users`);
      const data = await res.json();
      setUsers(data.data ?? []);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleDeleteUser(id: number) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${getBaseUrl()}/api/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Failed to delete user");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSuccess("User deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Network error");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRoleChange(id: number, newRole: string) {
    setUpdatingRoleId(id);
    try {
      const res = await fetch(`${getBaseUrl()}/api/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        setError("Failed to update role");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)),
      );
      setSuccess("Role updated");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Network error");
    } finally {
      setUpdatingRoleId(null);
    }
  }

  // ── Columns ──────────────────────────────────────────────

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "User",
      filterable: false,
      cell: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
            {(user.name || user.email)?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">
              {user.name || "—"}
              {user.id === actorId && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (you)
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      filterable: true,
      filterValue: (user) => user.role,
      cell: (user) =>
        canChangeRoles && user.id !== actorId ? (
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(user.id, e.target.value)}
            disabled={updatingRoleId === user.id}
            className="text-xs bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {isRoleName(r) ? ROLE_LABELS[r] : r}
              </option>
            ))}
          </select>
        ) : (
          <RoleBadge role={user.role} />
        ),
    },
    {
      key: "createdAt",
      header: "Joined",
      filterable: false,
      cell: (user) => (
        <span className="text-xs text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      filterable: false,
      className: "w-16 text-right",
      cell: (user) => (
        <div className="flex items-center justify-end gap-2">
          {user.id !== actorId && (
            <button
              onClick={() => {
                setEditingUser(user);
                setShowForm(true);
              }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Edit user"
            >
              <Pencil size={14} />
            </button>
          )}
          {canDeleteUsers && user.id !== actorId ? (
            <button
              onClick={() => handleDeleteUser(user.id)}
              disabled={deletingId === user.id}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
              title="Delete user"
            >
              {deletingId === user.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Users</h1>
          <p className="text-sm font-mono text-muted-foreground">
            {users.length} total user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreateUsers && (
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <UserPlus size={15} />
            Add User
          </Button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg">
          ✓ {success}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading users...
        </div>
      ) : (
        <DataTable
          data={users}
          columns={columns}
          searchPlaceholder="Search by name or email..."
          searchKeys={["name", "email"]}
          pageSize={10}
          emptyMessage="No users found."
          getRowId={(row) => row.id}
        />
      )}

      {/* Create User Modal */}
      {showForm && (
        <UserFormModal
          actorRole={actorRole}
          editingUser={editingUser}
          onSuccess={() => {
            setShowForm(false);
            setEditingUser(null);
            fetchUsers();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}
